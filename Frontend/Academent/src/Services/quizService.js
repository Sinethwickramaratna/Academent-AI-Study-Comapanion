import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getApiErrorMessage } from "./apiErrorUtils";
import { createQuizFailureNotification, createQuizSuccessNotification } from "./notificationService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use quizzes.");
};

const normalizeDifficulty = (difficulty) => String(difficulty || "medium").toLowerCase();

const normalizeType = (type) => {
  const normalized = String(type || "").toUpperCase().replace(/[\s/-]+/g, "_");
  if (normalized === "TRUE_FALSE" || normalized === "TRUE/FALSE") return "TRUE_FALSE";
  if (normalized === "FILL_IN_THE_BLANK" || normalized === "FILL_BLANK") return "FILL_BLANK";
  if (normalized === "SCENARIO_BASED") return "SCENARIO";
  return normalized || "MCQ";
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeOptions = (options) => (
  Array.isArray(options)
    ? options.map((option) => String(option || "").trim()).filter(Boolean)
    : []
);

const uniqueByLowercase = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = String(item || "").trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildFillBlankOptions = (question, answerBank = [], index = 0) => {
  const correctAnswer = String(question.answer || "").trim();
  const existingOptions = normalizeOptions(question.options);
  const candidates = uniqueByLowercase([
    correctAnswer,
    ...existingOptions,
    ...answerBank,
    "None of the above",
    "All of the above",
    "Cannot be determined",
  ]).filter(Boolean);

  const selected = [correctAnswer, ...candidates.filter((option) => option.toLowerCase() !== correctAnswer.toLowerCase())]
    .filter(Boolean)
    .slice(0, 4);

  while (selected.length < 4) selected.push(`Option ${selected.length + 1}`);

  const offset = index % selected.length;
  return [...selected.slice(offset), ...selected.slice(0, offset)];
};

const getAnswerBank = (questions = []) => uniqueByLowercase(
  questions.flatMap((question) => [
    question.answer,
    ...(Array.isArray(question.answers) ? question.answers : []),
    ...(Array.isArray(question.options) ? question.options : []),
  ]),
);
const normalizeClozeText = (question, answers = []) => {
  const text = String(question || "");
  if (text.includes("________")) return text;

  const answerList = answers.filter(Boolean).map(String);
  let nextText = text;
  let blankCount = 0;

  answerList.forEach((answer) => {
    const pattern = new RegExp(escapeRegExp(answer), "i");
    if (pattern.test(nextText)) {
      nextText = nextText.replace(pattern, "________");
      blankCount += 1;
    }
  });

  const missingBlanks = Math.max(answerList.length - blankCount, answerList.length ? 0 : 1);
  if (!missingBlanks) return nextText;

  return `${nextText.trim()} ${Array.from({ length: missingBlanks }, () => "________").join(" ")}`.trim();
};
export const normalizeQuestion = (question, index, answerBank = []) => {
  const questionNumber = Number(question.question_number || question.questionNumber || index + 1);
  const type = normalizeType(question.type);
  const answers = Array.isArray(question.answers) ? question.answers : [];
  const options = type === "FILL_BLANK" ? buildFillBlankOptions(question, answerBank, index) : normalizeOptions(question.options);

  return {
    ...question,
    questionId: question.questionId || `q-${questionNumber}`,
    question_number: questionNumber,
    type,
    question: type === "CLOZE" ? normalizeClozeText(question.question, answers) : question.question || "",
    options,
    answer: question.answer ?? "",
    answers,
    explanation: question.explanation || question.reason || "",
    marks: 1,
  };
};

export const normalizeGeneratedQuestions = (payload) => {
  const questions = Array.isArray(payload?.quiz)
    ? payload.quiz
    : Array.isArray(payload?.questions)
      ? payload.questions
      : Array.isArray(payload)
        ? payload
        : [];

  const answerBank = getAnswerBank(questions);
  return questions.map((question, index) => normalizeQuestion(question, index, answerBank));
};

const quizCollection = (uid) => collection(db, "users", uid, "quizzes");
const attemptCollection = (uid) => collection(db, "users", uid, "quizAttempts");
const quizRef = (uid, quizId) => doc(db, "users", uid, "quizzes", quizId);
const attemptRef = (uid, attemptId) => doc(db, "users", uid, "quizAttempts", attemptId);
const knowledgeRef = (uid, materialId) => doc(db, "users", uid, "quizKnowledge", materialId);

const getMaterialId = (material = {}) => material.sourceId || material.id || material.noteId || material.pdfId;

const hasExtractedKnowledge = (knowledge) => {
  if (Array.isArray(knowledge)) return knowledge.length > 0;
  if (knowledge && typeof knowledge === "object") return Object.keys(knowledge).length > 0;
  return Boolean(String(knowledge || "").trim());
};

const callQuizApi = async (path, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(getApiErrorMessage(result, "Quiz request could not be completed. Please try again."));
  }

  return result.data ?? result;
};

export const subscribeToQuizzes = (uid, onNext, onError) => {
  ensureUid(uid);
  const quizzesQuery = query(quizCollection(uid), orderBy("createdAt", "desc"));

  return onSnapshot(
    quizzesQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => item.data())),
    onError,
  );
};

export const extractKnowledgeFromApi = (content) => callQuizApi("/api/quiz/extract-knowledge", { content });

export const generateQuizFromApi = ({ knowledge, numQuestions, difficulty }) => (
  callQuizApi("/api/quiz/generate-quiz", {
    knowledge,
    numQuestions,
    difficulty: normalizeDifficulty(difficulty),
  })
);

export const evaluateShortAnswerFromApi = ({ question, correctAnswer, userAnswer }) => (
  callQuizApi("/api/quiz/evaluate-short-answer", {
    question,
    correctAnswer,
    userAnswer,
  })
);

export const saveExtractedKnowledge = async (uid, material) => {
  ensureUid(uid);
  const materialId = getMaterialId(material);
  if (!materialId) throw new Error("A material id is required to save extracted knowledge.");

  const payload = {
    materialId,
    type: material.type,
    title: material.title || "",
    path: material.path || "",
    knowledge: material.knowledge,
    extractedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(knowledgeRef(uid, materialId), payload, { merge: true });
  return payload;
};

export const extractAndSaveKnowledge = async (uid, material) => {
  const materialId = getMaterialId(material);
  const content = material.content || material.text || material.url || material.title;
  if (!materialId || !content) return null;

  const knowledge = await extractKnowledgeFromApi(content);
  return saveExtractedKnowledge(uid, {
    ...material,
    id: materialId,
    knowledge,
  });
};

export const getKnowledgeForMaterial = async (uid, material) => {
  ensureUid(uid);
  const materialId = getMaterialId(material);
  if (!materialId) throw new Error(`A material id is required to load extracted knowledge for ${material.title || "this material"}.`);

  const snapshot = await getDoc(knowledgeRef(uid, materialId));
  if (!snapshot.exists()) {
    throw new Error(`No extracted knowledge found in Firestore for ${material.title || "this material"}. Open or re-add it from My Notes so Academent can extract knowledge first.`);
  }

  const record = snapshot.data();
  if (!hasExtractedKnowledge(record?.knowledge)) {
    throw new Error(`The saved knowledge for ${record?.title || material.title || "this material"} is empty. Re-add or update the material to extract knowledge again.`);
  }

  return record;
};

export const createGeneratedQuizFromKnowledge = async (uid, payload) => {
  ensureUid(uid);
  const selectedItems = payload.selectedItems || [];
  const selectedMaterials = selectedItems.map((item) => ({
    id: getMaterialId(item),
    type: item.type,
    title: item.title,
    path: item.path,
  })).filter((item) => item.id);

  const difficulty = normalizeDifficulty(payload.difficulty);
  const knowledgeRecords = payload.knowledgeRecords?.length
    ? payload.knowledgeRecords
    : await Promise.all(selectedItems.map((item) => getKnowledgeForMaterial(uid, item)));

  const knowledge = knowledgeRecords
    .map((record) => record?.knowledge ?? record)
    .filter((item) => hasExtractedKnowledge(item));

  if (!knowledge.length) throw new Error("No extracted knowledge was available to generate the quiz.");

  const generated = await generateQuizFromApi({
    knowledge,
    numQuestions: payload.questionCount,
    difficulty,
  });
  const questions = normalizeGeneratedQuestions(generated);
  if (!questions.length) throw new Error("The AI did not return any quiz questions.");

  const quizDoc = doc(quizCollection(uid));
  const quiz = {
    quizId: quizDoc.id,
    title: payload.title?.trim() || `${difficulty} AI Study Quiz`,
    difficulty,
    status: "not_attempted",
    selectedMaterialIds: selectedMaterials.map((item) => item.id),
    selectedMaterials,
    questions,
    totalQuestions: questions.length,
    score: null,
    percentage: null,
    correctCount: 0,
    incorrectCount: 0,
    partiallyCorrectCount: 0,
    source: payload.source || "quiz-generator",
    sourceConversationId: payload.conversationId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  };

  await setDoc(quizDoc, quiz);
  return {
    ...quiz,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

const buildQuizGenerationNotificationKey = (payload = {}) => [
  "quiz-generation",
  payload.title || "untitled",
  payload.difficulty || "medium",
  payload.questionCount || "auto",
  ...(payload.selectedItems || []).map((item) => item.sourceId || item.id || item.noteId || item.pdfId).filter(Boolean),
].join("|");

export const createGeneratedQuiz = async (uid, payload) => {
  const idempotencyKey = buildQuizGenerationNotificationKey(payload);
  try {
    const quiz = await createGeneratedQuizFromKnowledge(uid, {
      ...payload,
      source: payload.source || "quiz-generator",
    });
    await createQuizSuccessNotification(uid, quiz, { idempotencyKey }).catch((error) => {
      console.warn("Quiz success notification could not be created:", error);
    });
    return quiz;
  } catch (error) {
    await createQuizFailureNotification(uid, {
      idempotencyKey,
      difficulty: payload.difficulty,
      questionCount: payload.questionCount,
      sourceName: payload.selectedItems?.[0]?.title || "",
    }).catch((notificationError) => {
      console.warn("Quiz failure notification could not be created:", notificationError);
    });
    throw error;
  }
};
export const deleteQuiz = async (uid, quizId) => {
  ensureUid(uid);
  if (!quizId) throw new Error("A quiz id is required to delete a quiz.");

  const attemptsQuery = query(attemptCollection(uid), where("quizId", "==", quizId));
  const snapshot = await getDocs(attemptsQuery);
  await Promise.all(snapshot.docs.map((attempt) => deleteDoc(attempt.ref)));
  await deleteDoc(quizRef(uid, quizId));
};
export const getLatestInProgressAttempt = async (uid, quizId) => {
  ensureUid(uid);
  const attemptsQuery = query(
    attemptCollection(uid),
    where("quizId", "==", quizId),
    where("status", "==", "in_progress"),
  );
  const snapshot = await getDocs(attemptsQuery);
  if (snapshot.empty) return null;

  return snapshot.docs
    .map((item) => item.data())
    .sort((left, right) => {
      const leftTime = left.updatedAt?.toMillis?.() || 0;
      const rightTime = right.updatedAt?.toMillis?.() || 0;
      return rightTime - leftTime;
    })[0];
};

export const createQuizAttempt = async (uid, quizId) => {
  ensureUid(uid);
  const attemptDoc = doc(attemptCollection(uid));
  const attempt = {
    attemptId: attemptDoc.id,
    quizId,
    status: "in_progress",
    userAnswers: {},
    currentQuestionIndex: 0,
    score: null,
    percentage: null,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  };

  await setDoc(attemptDoc, attempt);
  await updateDoc(quizRef(uid, quizId), {
    status: "partially_attempted",
    updatedAt: serverTimestamp(),
  });

  return {
    ...attempt,
    startedAt: new Date(),
    updatedAt: new Date(),
  };
};

export const updateQuizAttemptProgress = async (uid, attemptId, patch) => {
  ensureUid(uid);
  await setDoc(attemptRef(uid, attemptId), {
    ...patch,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (patch.quizId) {
    await setDoc(quizRef(uid, patch.quizId), {
      status: "partially_attempted",
      progressPercentage: patch.progressPercentage ?? 0,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
};

const normalizeAnswerValue = (answer) => (
  Array.isArray(answer)
    ? answer.map((item) => String(item || "").trim().toLowerCase()).join("|")
    : String(answer || "").trim().toLowerCase()
);

const answerToDisplayText = (answer) => (
  Array.isArray(answer)
    ? answer.filter(Boolean).join(", ")
    : String(answer || "").trim()
);

const getQuestionConcept = (question) => String(question.question || "this question").replace(/_{3,}/g, "the missing term");

const buildAnswerExplanation = (question, answer, correctAnswer, isCorrect) => {
  const selectedText = answerToDisplayText(answer) || "No answer selected";
  const correctText = answerToDisplayText(correctAnswer) || "the expected answer";
  const concept = getQuestionConcept(question);

  if (isCorrect) {
    return {
      feedback: `Correct. You selected "${selectedText}", which matches the expected answer for: ${concept}`,
      correctExplanation: question.explanation || `"${correctText}" is correct because it is the answer required by the concept tested in this question.`,
    };
  }

  return {
    feedback: `Incorrect. You selected "${selectedText}", but that does not match the expected answer for: ${concept}`,
    correctExplanation: question.explanation || `The correct answer is "${correctText}" because it completes or answers the question accurately based on the quiz knowledge.`,
  };
};

const evaluateLocalQuestion = (question, answer) => {
  const correctAnswer = question.type === "CLOZE" ? question.answers : question.answer;
  const isCorrect = normalizeAnswerValue(answer) === normalizeAnswerValue(correctAnswer);
  const explanation = buildAnswerExplanation(question, answer, correctAnswer, isCorrect);

  return {
    answer: answer ?? "",
    isCorrect,
    marks: isCorrect ? 1 : 0,
    status: isCorrect ? "correct" : "incorrect",
    ...explanation,
  };
};

export const completeQuizAttempt = async (uid, quiz, attempt, userAnswers) => {
  ensureUid(uid);
  const evaluatedAnswers = {};

  for (const question of quiz.questions || []) {
    const answer = userAnswers?.[question.questionId]?.answer ?? userAnswers?.[question.question_number]?.answer ?? "";

    if (question.type === "SHORT_ANSWER") {
      const result = await evaluateShortAnswerFromApi({
        question: question.question,
        correctAnswer: question.answer,
        userAnswer: answer,
      });
      evaluatedAnswers[question.questionId] = {
        answer,
        isCorrect: result.status === "correct",
        marks: Number(result.marks || 0),
        feedback: result.feedback || `Your answer was marked ${result.status || "incorrect"}.`,
        correctExplanation: question.explanation || `The expected answer is "${answerToDisplayText(question.answer)}" because it is the rubric answer for this short-answer question.`,
        status: result.status || "incorrect",
      };
    } else {
      evaluatedAnswers[question.questionId] = evaluateLocalQuestion(question, answer);
    }
  }

  const totalQuestions = quiz.questions?.length || 1;
  const totalMarks = Object.values(evaluatedAnswers).reduce((sum, item) => sum + Number(item.marks || 0), 0);
  const percentage = Math.round((totalMarks / totalQuestions) * 100);
  const correctCount = Object.values(evaluatedAnswers).filter((item) => Number(item.marks) >= 1).length;
  const partiallyCorrectCount = Object.values(evaluatedAnswers).filter((item) => Number(item.marks) > 0 && Number(item.marks) < 1).length;
  const incorrectCount = totalQuestions - correctCount - partiallyCorrectCount;

  await updateDoc(attemptRef(uid, attempt.attemptId), {
    status: "completed",
    userAnswers: evaluatedAnswers,
    currentQuestionIndex: totalQuestions - 1,
    score: totalMarks,
    percentage,
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  });

  await updateDoc(quizRef(uid, quiz.quizId), {
    status: "completed",
    score: totalMarks,
    percentage,
    correctCount,
    incorrectCount,
    partiallyCorrectCount,
    progressPercentage: 100,
    updatedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  });

  return {
    evaluatedAnswers,
    score: totalMarks,
    percentage,
    correctCount,
    incorrectCount,
    partiallyCorrectCount,
  };
};


