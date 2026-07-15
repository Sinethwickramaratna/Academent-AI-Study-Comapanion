import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitQuery,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUSES,
  VALID_NOTIFICATION_TYPES,
  getNotificationMeta,
  getPreferenceKeyForNotificationType,
  isFailureNotificationType,
} from "./notificationTypes";

const MAX_DROPDOWN_NOTIFICATIONS = 20;
const MAX_PAGE_NOTIFICATIONS = 100;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use notifications.");
};

const normalizeText = (value, fallback = "") => String(value || fallback).trim();

const sanitizeIdPart = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 96) || "notification";

const randomId = () => (
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

export const notificationsCollection = (uid) => collection(db, "users", uid, "notifications");
export const notificationRef = (uid, notificationId) => doc(db, "users", uid, "notifications", notificationId);
export const notificationSettingsRef = (uid) => doc(db, "users", uid, "settings", "notifications");
export const userDevicesCollection = (uid) => collection(db, "users", uid, "devices");
export const userDeviceRef = (uid, deviceId) => doc(db, "users", uid, "devices", deviceId);

export const buildNotificationId = ({ type, entityType, entityId, idempotencyKey }) => (
  [
    sanitizeIdPart(type),
    sanitizeIdPart(entityType || "general"),
    sanitizeIdPart(entityId || idempotencyKey || randomId()),
  ].join("_")
);

export const mergeNotificationPreferences = (preferences = {}) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...preferences,
  defaultReminder: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.defaultReminder,
    ...(preferences.defaultReminder || {}),
  },
  quietHours: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
    ...(preferences.quietHours || {}),
  },
  timezone: preferences.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
});

export const getNotificationPreferences = async (uid) => {
  ensureUid(uid);
  const snapshot = await getDoc(notificationSettingsRef(uid));
  return mergeNotificationPreferences(snapshot.exists() ? snapshot.data() : {});
};

export const saveNotificationPreferences = async (uid, preferences = {}) => {
  ensureUid(uid);
  const payload = mergeNotificationPreferences(preferences);
  await setDoc(notificationSettingsRef(uid), {
    ...payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return payload;
};

export const subscribeNotificationPreferences = (uid, onNext, onError) => {
  ensureUid(uid);
  return onSnapshot(
    notificationSettingsRef(uid),
    (snapshot) => onNext(mergeNotificationPreferences(snapshot.exists() ? snapshot.data() : {})),
    onError,
  );
};

const shouldDeliverNotification = async (uid, type, deliveryChannels = {}) => {
  const meta = getNotificationMeta(type);
  if (meta.alwaysEnabled || isFailureNotificationType(type)) return true;

  const preferences = await getNotificationPreferences(uid);
  const preferenceKey = getPreferenceKeyForNotificationType(type);

  if (deliveryChannels.inApp !== false && preferences.inAppEnabled === false) return false;
  if (preferences[preferenceKey] === false) return false;
  return true;
};

const validateNotificationPayload = (payload = {}) => {
  const type = normalizeText(payload.type);
  if (!VALID_NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Unsupported notification type: ${type || "missing"}.`);
  }

  const title = normalizeText(payload.title);
  const message = normalizeText(payload.message);
  if (!title || !message) throw new Error("Notification title and message are required.");

  const actionUrl = normalizeText(payload.actionUrl);
  if (actionUrl && (!actionUrl.startsWith("/") || actionUrl.startsWith("//"))) {
    throw new Error("Notification action URL must be an application-relative path.");
  }

  if (payload.entityType && !payload.entityId) {
    throw new Error("A related entity id is required when entity type is provided.");
  }
};

export const createNotification = async (uid, payload = {}) => {
  ensureUid(uid);
  validateNotificationPayload(payload);

  const type = normalizeText(payload.type);
  const meta = getNotificationMeta(type);
  const deliveryChannels = {
    inApp: true,
    browserPush: true,
    ...(payload.deliveryChannels || {}),
  };

  const shouldDeliver = await shouldDeliverNotification(uid, type, deliveryChannels);
  if (!shouldDeliver) return null;

  const notificationId = payload.id || buildNotificationId({
    type,
    entityType: payload.entityType,
    entityId: payload.entityId,
    idempotencyKey: payload.idempotencyKey,
  });

  const notification = {
    id: notificationId,
    userId: uid,
    type,
    category: payload.category || meta.category || NOTIFICATION_CATEGORIES.system,
    status: payload.status || meta.status || NOTIFICATION_STATUSES.info,
    title: normalizeText(payload.title),
    message: normalizeText(payload.message),
    entityType: normalizeText(payload.entityType),
    entityId: normalizeText(payload.entityId),
    entityTitle: normalizeText(payload.entityTitle),
    actionLabel: normalizeText(payload.actionLabel),
    actionUrl: normalizeText(payload.actionUrl),
    isRead: false,
    isDeleted: false,
    deliveryChannels,
    createdAt: serverTimestamp(),
    readAt: null,
    expiresAt: payload.expiresAt || null,
    metadata: payload.metadata || {},
  };

  await setDoc(notificationRef(uid, notificationId), notification, { merge: false });
  return { ...notification, createdAt: new Date() };
};

const authenticatedNotificationRequest = async (path, options = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in before creating notifications.");

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Notification request could not be completed.");
  }

  return result;
};

export const createNotificationWithBrowserPush = async (uid, payload = {}) => {
  ensureUid(uid);

  try {
    const result = await authenticatedNotificationRequest("/api/notifications", {
      method: "POST",
      body: JSON.stringify({
        notification: payload,
        idempotencyKey: payload.idempotencyKey,
      }),
    });
    return result.notification;
  } catch (error) {
    console.warn("Browser push notification could not be sent; saving in-app notification only:", error);
    return createNotification(uid, payload);
  }
};

export const createSuccessNotification = (uid, payload = {}) => createNotificationWithBrowserPush(uid, {
  ...payload,
  status: NOTIFICATION_STATUSES.success,
});

export const createFailureNotification = (uid, payload = {}) => createNotificationWithBrowserPush(uid, {
  ...payload,
  status: NOTIFICATION_STATUSES.failure,
  deliveryChannels: {
    inApp: true,
    browserPush: true,
    ...(payload.deliveryChannels || {}),
  },
});

export const createReminderNotification = (uid, payload = {}) => createNotificationWithBrowserPush(uid, {
  ...payload,
  category: NOTIFICATION_CATEGORIES.reminder,
  status: NOTIFICATION_STATUSES.reminder,
});

export const createQuizSuccessNotification = (uid, quiz, metadata = {}) => (
  createSuccessNotification(uid, {
    type: "quiz_success",
    title: "Quiz Generated Successfully",
    message: `Your "${quiz.title}" with ${quiz.totalQuestions || quiz.questions?.length || 0} questions is ready.`,
    entityType: "quiz",
    entityId: quiz.quizId,
    entityTitle: quiz.title,
    actionLabel: "View Quiz",
    actionUrl: `/quizzes/${quiz.quizId}`,
    metadata: {
      difficulty: quiz.difficulty,
      questionCount: quiz.totalQuestions || quiz.questions?.length || 0,
      sourceName: quiz.selectedMaterials?.[0]?.title || "",
      ...metadata,
    },
  })
);

export const createQuizFailureNotification = (uid, metadata = {}) => (
  createFailureNotification(uid, {
    type: "quiz_failure",
    title: "Quiz Generation Failed",
    message: "We could not generate your quiz. Please try again.",
    entityType: "quiz",
    entityId: metadata.idempotencyKey || "latest-generation",
    actionLabel: "Try Again",
    actionUrl: "/quiz-generator",
    idempotencyKey: metadata.idempotencyKey,
    metadata,
  })
);

export const createFlashcardSuccessNotification = (uid, collectionData, metadata = {}) => (
  createSuccessNotification(uid, {
    type: "flashcard_success",
    title: "Flashcards Generated Successfully",
    message: `${collectionData.cardCount || collectionData.analytics?.totalFlashCards || 0} flashcards were created from "${collectionData.selectedSources?.[0]?.title || collectionData.title}".`,
    entityType: "flashcardSet",
    entityId: collectionData.collectionId || collectionData.id,
    entityTitle: collectionData.title,
    actionLabel: "View Flashcards",
    actionUrl: `/flashcards/${collectionData.collectionId || collectionData.id}`,
    metadata,
  })
);

export const createFlashcardFailureNotification = (uid, metadata = {}) => (
  createFailureNotification(uid, {
    type: "flashcard_failure",
    title: "Flashcard Generation Failed",
    message: "Flashcards could not be generated from the selected study materials.",
    entityType: "flashcardSet",
    entityId: metadata.idempotencyKey || "latest-generation",
    actionLabel: "Try Again",
    actionUrl: "/flashcards",
    idempotencyKey: metadata.idempotencyKey,
    metadata,
  })
);

export const createPdfUploadSuccessNotification = (uid, pdf, context = {}) => (
  createSuccessNotification(uid, {
    type: "pdf_upload_success",
    title: "PDF Uploaded Successfully",
    message: `"${pdf.title}" was added to ${context.semesterTitle || "your semester"} / ${context.moduleTitle || "your module"}.`,
    entityType: "pdf",
    entityId: pdf.pdfId,
    entityTitle: pdf.title,
    actionLabel: "View PDF",
    actionUrl: `/pdfs/${pdf.pdfId}`,
    metadata: {
      storageProvider: pdf.storageProvider,
      size: pdf.size || 0,
      ...context,
    },
  })
);

export const createPdfUploadFailureNotification = (uid, fileName, metadata = {}) => (
  createFailureNotification(uid, {
    type: "pdf_upload_failure",
    title: "PDF Upload Failed",
    message: `"${fileName || "Selected PDF"}" could not be uploaded.`,
    entityType: "pdf",
    entityId: metadata.idempotencyKey || sanitizeIdPart(fileName || "latest-upload"),
    actionLabel: "Retry Upload",
    actionUrl: "/my-notes",
    idempotencyKey: metadata.idempotencyKey,
    metadata,
  })
);

export const subscribeToNotifications = (uid, onNext, onError, options = {}) => {
  ensureUid(uid);
  const maxItems = Number(options.maxItems || MAX_DROPDOWN_NOTIFICATIONS);
  const constraints = [
    where("isDeleted", "==", false),
    orderBy("createdAt", "desc"),
    limitQuery(Math.min(Math.max(maxItems, 1), MAX_PAGE_NOTIFICATIONS)),
  ];

  return onSnapshot(
    query(notificationsCollection(uid), ...constraints),
    (snapshot) => onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
};

export const subscribeToUnreadNotificationCount = (uid, onNext, onError) => {
  ensureUid(uid);
  return onSnapshot(
    query(
      notificationsCollection(uid),
      where("isRead", "==", false),
      where("isDeleted", "==", false),
    ),
    (snapshot) => onNext(snapshot.size),
    onError,
  );
};

export const getUnreadNotificationCount = async (uid) => {
  ensureUid(uid);
  const snapshot = await getDocs(query(
    notificationsCollection(uid),
    where("isRead", "==", false),
    where("isDeleted", "==", false),
  ));
  return snapshot.size;
};

export const markNotificationAsRead = async (uid, notificationId, isRead = true) => {
  ensureUid(uid);
  if (!notificationId) throw new Error("Notification id is required.");
  await updateDoc(notificationRef(uid, notificationId), {
    isRead,
    readAt: isRead ? serverTimestamp() : null,
  });
};

export const markAllNotificationsAsRead = async (uid) => {
  ensureUid(uid);
  const snapshot = await getDocs(query(
    notificationsCollection(uid),
    where("isRead", "==", false),
    where("isDeleted", "==", false),
  ));
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => {
    batch.update(item.ref, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return snapshot.size;
};

export const deleteNotification = async (uid, notificationId) => {
  ensureUid(uid);
  if (!notificationId) throw new Error("Notification id is required.");
  await updateDoc(notificationRef(uid, notificationId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  });
};

export const deleteNotifications = async (uid, notificationIds = []) => {
  ensureUid(uid);
  const batch = writeBatch(db);
  notificationIds.filter(Boolean).forEach((notificationId) => {
    batch.update(notificationRef(uid, notificationId), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

export const clearAllNotifications = async (uid) => {
  ensureUid(uid);
  const snapshot = await getDocs(query(notificationsCollection(uid), where("isDeleted", "==", false)));
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.update(item.ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  }));
  await batch.commit();
  return snapshot.size;
};

export const disableNotificationCategory = async (uid, type) => {
  ensureUid(uid);
  const preferenceKey = getPreferenceKeyForNotificationType(type);
  if (!preferenceKey) return null;
  const preferences = await getNotificationPreferences(uid);
  const nextPreferences = {
    ...preferences,
    [preferenceKey]: false,
  };
  await saveNotificationPreferences(uid, nextPreferences);
  return nextPreferences;
};

export const toNotificationDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

