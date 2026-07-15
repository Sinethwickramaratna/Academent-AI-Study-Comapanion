import {
  collection,
  doc,
  getDocs,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getApiErrorMessage } from "./apiErrorUtils";
import { getKnowledgeForMaterial } from "./quizService";
import { createFlashcardFailureNotification, createFlashcardSuccessNotification } from "./notificationService";
import { applySm2Rating, createInitialSchedule, REVIEW_RATINGS } from "./spacedRepetitionService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BATCH_LIMIT = 450;

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use flash cards.");
};

const collectionRoot = (uid) => collection(db, "users", uid, "flashCardCollections");
const collectionRef = (uid, collectionId) => doc(db, "users", uid, "flashCardCollections", collectionId);
const cardsRoot = (uid, collectionId) => collection(db, "users", uid, "flashCardCollections", collectionId, "cards");
const cardRef = (uid, collectionId, cardId) => doc(db, "users", uid, "flashCardCollections", collectionId, "cards", cardId);
const reviewsRoot = (uid, collectionId) => collection(db, "users", uid, "flashCardCollections", collectionId, "reviewSessions");

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const normalizeType = (type) => {
  const normalized = String(type || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalized === "definition") return "definition";
  if (normalized === "concept") return "concept";
  if (["formula", "simple_formula"].includes(normalized)) return "formula";
  if (["true_false", "truefalse"].includes(normalized)) return "true_false";
  if (["fill_in_the_blank", "fill_blank", "blank"].includes(normalized)) return "fill_blank";
  if (["process", "algorithm"].includes(normalized)) return "process";
  if (["diagram_based", "diagram"].includes(normalized)) return "diagram";
  if (["q_a", "qa", "question_answer"].includes(normalized)) return "qa";
  return "qa";
};

const uniqueStrings = (items = []) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const compactSource = (source) => ({
  id: source.id,
  sourceId: source.id,
  type: source.type,
  title: source.title,
  path: source.path,
  semesterId: source.semesterId || "",
  moduleId: source.moduleId || "",
  folderId: source.folderId || "",
  url: source.url || "",
  size: source.size || 0,
  pageCount: source.pageCount || 0,
});

const makeSourceKey = (type, id) => `${type}-${id}`;

const visitFolder = (folder, context, addSource) => {
  const folderPath = `${context.path} / ${folder.title || "Folder"}`;
  (folder.notes || []).forEach((note) => addSource({
    id: note.noteId,
    type: "note",
    title: note.title || "Untitled note",
    path: folderPath,
    content: note.content || "",
    semesterId: context.semesterId,
    moduleId: context.moduleId,
    folderId: folder.folderId,
  }));

  (folder.pdfs || []).forEach((pdf) => addSource({
    id: pdf.pdfId,
    type: "pdf",
    title: pdf.title || pdf.originalName || "Untitled PDF",
    path: folderPath,
    semesterId: context.semesterId,
    moduleId: context.moduleId,
    folderId: folder.folderId,
    url: pdf.url || "",
    size: pdf.size || 0,
    pageCount: pdf.pageCount || pdf.pages || 0,
  }));

  (folder.folders || []).forEach((child) => visitFolder(child, { ...context, path: folderPath }, addSource));
};

const visitModule = (semester, module, addSource) => {
  const modulePath = `${semester.title || "Semester"} / ${module.title || "Module"}`;
  const context = {
    semesterId: semester.semesterId,
    moduleId: module.moduleId,
    path: modulePath,
  };

  (module.notes || []).forEach((note) => addSource({
    id: note.noteId,
    type: "note",
    title: note.title || "Untitled note",
    path: modulePath,
    content: note.content || "",
    semesterId: semester.semesterId,
    moduleId: module.moduleId,
  }));

  (module.pdfs || []).forEach((pdf) => addSource({
    id: pdf.pdfId,
    type: "pdf",
    title: pdf.title || pdf.originalName || "Untitled PDF",
    path: modulePath,
    semesterId: semester.semesterId,
    moduleId: module.moduleId,
    url: pdf.url || "",
    size: pdf.size || 0,
    pageCount: pdf.pageCount || pdf.pages || 0,
  }));

  (module.folders || []).forEach((folder) => visitFolder(folder, context, addSource));
};

export const resolveSelectedFlashCardSources = (noteManagement, selectedItems = []) => {
  const selectedKeys = new Set(selectedItems.map((item) => makeSourceKey(item.type, item.sourceId || item.id)));
  const selectedSources = new Map();
  const addSource = (source) => {
    if (!source?.id || !source?.type) return;
    selectedSources.set(makeSourceKey(source.type, source.id), source);
  };

  (noteManagement?.semesters || []).forEach((semester) => {
    const semesterSelected = selectedKeys.has(makeSourceKey("semester", semester.semesterId));

    (semester.modules || []).forEach((module) => {
      const moduleSelected = selectedKeys.has(makeSourceKey("module", module.moduleId));
      const directAdd = (source) => {
        if (semesterSelected || moduleSelected || selectedKeys.has(makeSourceKey(source.type, source.id))) addSource(source);
      };

      visitModule(semester, module, directAdd);

      const visitSelectedFolders = (folders = []) => {
        folders.forEach((folder) => {
          if (selectedKeys.has(makeSourceKey("folder", folder.folderId))) {
            visitFolder(folder, {
              semesterId: semester.semesterId,
              moduleId: module.moduleId,
              path: `${semester.title || "Semester"} / ${module.title || "Module"}`,
            }, addSource);
          }
          visitSelectedFolders(folder.folders || []);
        });
      };

      visitSelectedFolders(module.folders || []);
    });
  });

  return [...selectedSources.values()];
};

const parseRetryAfterSeconds = (value) => {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.max(1, Math.ceil(numeric));
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
};

const createFlashCardApiError = (response, result = {}) => {
  const rateLimit = result.rateLimit || {};
  const retryAfterSeconds = Number(rateLimit.retryAfterSeconds) || parseRetryAfterSeconds(response.headers.get("Retry-After"));
  const resetAt = rateLimit.resetAt || (retryAfterSeconds ? new Date(Date.now() + retryAfterSeconds * 1000).toISOString() : null);
  const message = getApiErrorMessage(result, "Flash card generation could not be completed. Please try again.");
  const error = new Error(message);

  error.status = response.status;
  error.retryAfterSeconds = retryAfterSeconds || null;
  error.resetAt = resetAt;
  error.isRateLimited = response.status === 429 || Boolean(resetAt || retryAfterSeconds);

  return error;
};

const callFlashCardApi = async (body) => {
  const response = await fetch(`${API_BASE_URL}/api/flashcards/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw createFlashCardApiError(response, result);
  }

  return result.data ?? result;
};

export const normalizeFlashCardPreferences = (preferences = {}) => ({
  cardCount: Math.max(1, Math.min(100, Number(preferences.cardCount || 35))),
  difficulty: String(preferences.difficulty || "mixed").toLowerCase(),
  cardTypes: uniqueStrings(preferences.cardTypes || ["definition", "concept", "formula", "qa"]).map(normalizeType),
  includeExamples: Boolean(preferences.includeExamples),
  includeMnemonics: Boolean(preferences.includeMnemonics),
  includeImages: Boolean(preferences.includeImages),
  avoidDuplicates: preferences.avoidDuplicates !== false,
  adaptiveDifficulty: Boolean(preferences.adaptiveDifficulty),
});

const normalizeGeneratedCard = (card, index) => ({
  type: normalizeType(card.type),
  difficulty: ["easy", "medium", "hard"].includes(String(card.difficulty || "").toLowerCase())
    ? String(card.difficulty).toLowerCase()
    : "medium",
  front: String(card.front || "").trim(),
  back: String(card.back || "").trim(),
  explanation: String(card.explanation || "").trim(),
  example: String(card.example || "").trim(),
  mnemonic: String(card.mnemonic || "").trim(),
  imageDescription: String(card.imageDescription || "").trim(),
  tags: uniqueStrings(card.tags || []),
  keywords: uniqueStrings(card.keywords || []),
  sourcePages: Array.isArray(card.sourcePages) ? card.sourcePages : [],
  confidence: Math.max(0, Math.min(1, Number(card.confidence || 0.85))),
  createdBy: "AI",
  sortIndex: index,
});

export const validateAndDedupeFlashCards = (cards = []) => {
  const seen = new Set();
  return cards
    .map(normalizeGeneratedCard)
    .filter((card) => {
      const key = `${card.front.toLowerCase()}|${card.back.toLowerCase()}`;
      if (!card.front || !card.back || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const prepareGenerationSources = async (uid, sources) => {
  const prepared = await Promise.all(sources.map(async (source) => {
    if (source.type === "note" && String(source.content || "").trim()) {
      return {
        ...compactSource(source),
        content: String(source.content).slice(0, 14000),
      };
    }

    const knowledgeRecord = await getKnowledgeForMaterial(uid, {
      id: source.id,
      sourceId: source.id,
      type: source.type,
      title: source.title,
    });

    return {
      ...compactSource(source),
      knowledge: knowledgeRecord.knowledge,
    };
  }));

  return prepared.filter((source) => source.content || source.knowledge);
};

const calculateStreak = (reviewEvents) => {
  const reviewedDays = new Set(reviewEvents
    .map((event) => toDate(event.reviewedAt))
    .filter(Boolean)
    .map((date) => startOfDay(date).toISOString().slice(0, 10)));

  let streak = 0;
  let cursor = startOfDay(new Date());
  while (reviewedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const calculateFlashCardAnalytics = (cards = [], reviewEvents = []) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const tomorrowStart = todayEnd;
  const tomorrowEnd = endOfDay(tomorrowStart);
  const weekStart = addDays(todayStart, -6);

  const total = cards.length;
  const mastered = cards.filter((card) => Number(card.masteryLevel || 0) >= 80).length;
  const reviewedToday = reviewEvents.filter((event) => {
    const date = toDate(event.reviewedAt);
    return date && date >= todayStart && date < todayEnd;
  }).length;
  const reviewedThisWeek = reviewEvents.filter((event) => {
    const date = toDate(event.reviewedAt);
    return date && date >= weekStart && date < endOfDay(now);
  }).length;
  const reviewedEvents = reviewEvents.filter((event) => Number(event.score || 0) > 0 || event.rating);
  const accurateReviews = reviewedEvents.filter((event) => Number(event.score || 0) >= 75).length;
  const averageScore = reviewedEvents.length
    ? Math.round(reviewedEvents.reduce((sum, event) => sum + Number(event.score || 0), 0) / reviewedEvents.length)
    : 0;

  const dueToday = cards.filter((card) => {
    const due = toDate(card.nextReview);
    return due && due < todayEnd;
  }).length;
  const dueTomorrow = cards.filter((card) => {
    const due = toDate(card.nextReview);
    return due && due >= tomorrowStart && due < tomorrowEnd;
  }).length;
  const overdue = cards.filter((card) => {
    const due = toDate(card.nextReview);
    return due && due < todayStart;
  }).length;

  return {
    totalFlashCards: total,
    masteredCards: mastered,
    learningCards: Math.max(total - mastered, 0),
    todaysReviews: reviewedToday,
    currentStreak: calculateStreak(reviewEvents),
    weeklyProgress: total ? Math.min(100, Math.round((reviewedThisWeek / Math.max(total, 1)) * 100)) : 0,
    retentionRate: reviewedEvents.length ? Math.round((accurateReviews / reviewedEvents.length) * 100) : 0,
    averageRecallScore: averageScore,
    dueToday,
    dueTomorrow,
    overdueCards: overdue,
    completionPercentage: total ? Math.round((mastered / total) * 100) : 0,
    reviewAccuracy: reviewedEvents.length ? Math.round((accurateReviews / reviewedEvents.length) * 100) : 0,
    averageReviewTime: reviewedEvents.length
      ? Math.round(reviewedEvents.reduce((sum, event) => sum + Number(event.durationMs || 0), 0) / reviewedEvents.length / 1000)
      : 0,
    cardsCreated: total,
    cardsReviewed: reviewedEvents.length,
    reviewSessions: reviewEvents.length,
    lastStudyDate: reviewEvents
      .map((event) => toDate(event.reviewedAt))
      .filter(Boolean)
      .sort((left, right) => right - left)[0] || null,
    updatedAt: new Date(),
  };
};

const getAllCards = async (uid, collectionId) => {
  const snapshot = await getDocs(query(cardsRoot(uid, collectionId), orderBy("createdAt", "asc")));
  return snapshot.docs.map((item) => ({ cardId: item.id, ...item.data() }));
};

const getAllReviews = async (uid, collectionId) => {
  const snapshot = await getDocs(query(reviewsRoot(uid, collectionId), orderBy("reviewedAt", "asc")));
  return snapshot.docs.map((item) => ({ reviewId: item.id, ...item.data() }));
};

export const recalculateCollectionAnalytics = async (uid, collectionId) => {
  ensureUid(uid);
  const [cards, reviews] = await Promise.all([getAllCards(uid, collectionId), getAllReviews(uid, collectionId)]);
  const analytics = calculateFlashCardAnalytics(cards, reviews);
  await setDoc(collectionRef(uid, collectionId), { analytics, updatedAt: serverTimestamp() }, { merge: true });
  return analytics;
};

export const subscribeToFlashCardCollections = (uid, onNext, onError) => {
  ensureUid(uid);
  const collectionsQuery = query(collectionRoot(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    collectionsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ id: item.id, collectionId: item.id, ...item.data() }))),
    onError,
  );
};

export const loadFlashCardsForCollection = async (uid, collectionId, maxCards = 80) => {
  ensureUid(uid);
  if (!collectionId) return [];
  const snapshot = await getDocs(query(cardsRoot(uid, collectionId), orderBy("sortIndex", "asc"), limitQuery(maxCards)));
  return snapshot.docs.map((item) => ({ id: item.id, cardId: item.id, ...item.data() }));
};

const commitInBatches = async (operations) => {
  for (let index = 0; index < operations.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);
    operations.slice(index, index + BATCH_LIMIT).forEach((operation) => operation(batch));
    await batch.commit();
  }
};

export const createGeneratedFlashCardCollection = async (uid, payload) => {
  ensureUid(uid);
  const idempotencyKey = [
    "flashcard-generation",
    payload.title || "untitled",
    ...(payload.selectedItems || []).map((item) => item.sourceId || item.id).filter(Boolean),
  ].join("|");

  try {
    const preferences = normalizeFlashCardPreferences(payload.preferences);
    const resolvedSources = resolveSelectedFlashCardSources(payload.noteManagement, payload.selectedItems);
    if (!resolvedSources.length) throw new Error("Select at least one note or PDF source.");

    const apiSources = await prepareGenerationSources(uid, resolvedSources);
    if (!apiSources.length) throw new Error("No extractable note text or PDF knowledge was available for the selected sources.");

    const generated = await callFlashCardApi({ sources: apiSources, preferences });
    const cards = validateAndDedupeFlashCards(generated.cards || []);
    if (!cards.length) throw new Error("No valid flash cards were generated. Try different sources or preferences.");

    const collectionDoc = doc(collectionRoot(uid));
    const now = new Date();
    const analytics = calculateFlashCardAnalytics(cards.map((card) => ({ ...card, ...createInitialSchedule(now) })), []);
    const selectedSources = resolvedSources.map(compactSource);
    const firstSource = selectedSources[0] || {};
    const title = payload.title?.trim()
      || `${firstSource.title || "AI"} Flash Cards${selectedSources.length > 1 ? ` + ${selectedSources.length - 1}` : ""}`;

    const collectionPayload = {
      collectionId: collectionDoc.id,
      title,
      description: payload.description || `Generated from ${selectedSources.length} selected source${selectedSources.length === 1 ? "" : "s"}.`,
      semesterId: firstSource.semesterId || "",
      moduleId: firstSource.moduleId || "",
      folderId: firstSource.folderId || "",
      selectedSources,
      preferences,
      analytics,
      cardCount: cards.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const operations = [
      (batch) => batch.set(collectionDoc, collectionPayload),
      ...cards.map((card, index) => (batch) => {
        const cardDoc = doc(cardsRoot(uid, collectionDoc.id));
        batch.set(cardDoc, {
          ...card,
          ...createInitialSchedule(now),
          cardId: cardDoc.id,
          collectionId: collectionDoc.id,
          sourceTitles: selectedSources.map((source) => source.title),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          sortIndex: index,
        });
      }),
    ];

    await commitInBatches(operations);
    const createdCollection = {
      ...collectionPayload,
      id: collectionDoc.id,
      createdAt: now,
      updatedAt: now,
    };

    await createFlashcardSuccessNotification(uid, createdCollection, { idempotencyKey }).catch((error) => {
      console.warn("Flashcard success notification could not be created:", error);
    });

    return createdCollection;
  } catch (error) {
    await createFlashcardFailureNotification(uid, { idempotencyKey }).catch((notificationError) => {
      console.warn("Flashcard failure notification could not be created:", notificationError);
    });
    throw error;
  }
};
export const deleteFlashCardCollection = async (uid, collectionId) => {
  ensureUid(uid);
  const [cardsSnapshot, reviewsSnapshot] = await Promise.all([
    getDocs(cardsRoot(uid, collectionId)),
    getDocs(reviewsRoot(uid, collectionId)),
  ]);

  const operations = [
    ...cardsSnapshot.docs.map((item) => (batch) => batch.delete(item.ref)),
    ...reviewsSnapshot.docs.map((item) => (batch) => batch.delete(item.ref)),
    (batch) => batch.delete(collectionRef(uid, collectionId)),
  ];

  await commitInBatches(operations);
};

export const duplicateFlashCardCollection = async (uid, sourceCollection) => {
  ensureUid(uid);
  const sourceId = sourceCollection.collectionId || sourceCollection.id;
  const cards = await loadFlashCardsForCollection(uid, sourceId, 500);
  const collectionDoc = doc(collectionRoot(uid));
  const now = new Date();
  const duplicatedCards = cards.map((card, index) => ({ ...card, ...createInitialSchedule(now), sortIndex: index }));
  const analytics = calculateFlashCardAnalytics(duplicatedCards, []);
  const collectionPayload = {
    ...sourceCollection,
    collectionId: collectionDoc.id,
    title: `${sourceCollection.title || "Flash Cards"} Copy`,
    analytics,
    cardCount: cards.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  delete collectionPayload.id;

  const operations = [
    (batch) => batch.set(collectionDoc, collectionPayload),
    ...duplicatedCards.map((card) => (batch) => {
      const cardDoc = doc(cardsRoot(uid, collectionDoc.id));
      const nextCard = { ...card, cardId: cardDoc.id, collectionId: collectionDoc.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      delete nextCard.id;
      batch.set(cardDoc, nextCard);
    }),
  ];

  await commitInBatches(operations);
  return { ...collectionPayload, id: collectionDoc.id, createdAt: now, updatedAt: now };
};

export const recordFlashCardReview = async (uid, collectionId, card, rating, durationMs = 0) => {
  ensureUid(uid);
  const currentCardId = card.cardId || card.id;
  const reviewedAt = new Date();
  const score = (REVIEW_RATINGS[rating] ?? 3) * 25;
  const schedule = applySm2Rating(card, rating, reviewedAt);
  const reviewDoc = doc(reviewsRoot(uid, collectionId));
  const reviewEvent = {
    reviewId: reviewDoc.id,
    cardId: currentCardId,
    rating,
    score,
    durationMs,
    reviewedAt,
    createdAt: serverTimestamp(),
  };
  const cardReviewEvent = {
    reviewId: reviewDoc.id,
    cardId: currentCardId,
    rating,
    score,
    durationMs,
    reviewedAt,
    createdAt: reviewedAt,
  };

  await Promise.all([
    updateDoc(cardRef(uid, collectionId, currentCardId), {
      ...schedule,
      updatedAt: serverTimestamp(),
      reviewHistory: [...(card.reviewHistory || []), cardReviewEvent].slice(-50),
    }),
    setDoc(reviewDoc, reviewEvent),
  ]);

  const analytics = await recalculateCollectionAnalytics(uid, collectionId);
  return { schedule, reviewEvent: cardReviewEvent, analytics };
};

export const saveManualFlashCard = async (uid, collectionId, cardData) => {
  ensureUid(uid);
  const cardDoc = doc(cardsRoot(uid, collectionId));
  const now = new Date();
  const card = {
    ...normalizeGeneratedCard(cardData, Date.now()),
    ...createInitialSchedule(now),
    cardId: cardDoc.id,
    collectionId,
    createdBy: cardData.createdBy || "Student",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(cardDoc, card);
  await recalculateCollectionAnalytics(uid, collectionId);
  return { ...card, id: cardDoc.id, createdAt: now, updatedAt: now };
};

export { toDate };



