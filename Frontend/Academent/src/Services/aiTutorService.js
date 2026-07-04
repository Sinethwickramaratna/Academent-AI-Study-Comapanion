import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getKnowledgeForMaterial } from "./quizService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const getMaterialId = (material = {}) => material.sourceId || material.id || material.noteId || material.pdfId;
const isDemoMaterial = (material = {}) => String(getMaterialId(material) || "").startsWith("demo-");

const hasInlineKnowledge = (material = {}) => (
  Boolean(String(material.knowledge || material.content || material.extractedText || "").trim())
);

const getInlineKnowledge = (material = {}) => (
  material.knowledge || material.content || material.extractedText || ""
);

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use AI Tutor conversations.");
};

const conversationCollection = (uid) => collection(db, "users", uid, "aiTutorConversations");
const conversationRef = (uid, conversationId) => doc(db, "users", uid, "aiTutorConversations", conversationId);
const messageCollection = (uid, conversationId) => collection(db, "users", uid, "aiTutorConversations", conversationId, "messages");

const toDate = (value) => value?.toDate?.() || value || null;

const cleanTitleWord = (word) => word.replace(/[^a-zA-Z0-9+#.-]/g, "").trim();

export const generateConversationTitle = (message = "") => {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with", "about", "please", "can", "you", "me", "my", "i", "want", "need", "help"]);
  const words = String(message)
    .split(/\s+/)
    .map(cleanTitleWord)
    .filter((word) => word && !stopWords.has(word.toLowerCase()))
    .slice(0, 6);

  const title = words.join(" ").trim() || String(message).trim().slice(0, 42) || "New AI Tutor Chat";
  return title.length > 52 ? `${title.slice(0, 49)}...` : title;
};

const materialSummary = (items = []) => items.map((item) => ({
  id: getMaterialId(item),
  type: item.type,
  title: item.title || "Untitled material",
  path: item.path || "",
})).filter((item) => item.id);

const normalizeConversation = (snapshot) => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    conversationId: snapshot.id,
    createdAtDate: toDate(data.createdAt),
    updatedAtDate: toDate(data.updatedAt),
  };
};

const normalizeMessage = (snapshot) => {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    messageId: snapshot.id,
    sender: data.sender || data.role || "ai",
    createdAtDate: toDate(data.createdAt),
  };
};

export const subscribeTutorConversations = (uid, onNext, onError) => {
  ensureUid(uid);
  const conversationsQuery = query(conversationCollection(uid), orderBy("updatedAt", "desc"), limit(60));
  return onSnapshot(
    conversationsQuery,
    (snapshot) => onNext(snapshot.docs.map(normalizeConversation)),
    onError,
  );
};

export const subscribeTutorMessages = (uid, conversationId, onNext, onError) => {
  ensureUid(uid);
  if (!conversationId) return () => {};

  const messagesQuery = query(messageCollection(uid, conversationId), orderBy("createdAt", "asc"), limit(120));
  return onSnapshot(
    messagesQuery,
    (snapshot) => onNext(snapshot.docs.map(normalizeMessage)),
    onError,
  );
};

export const createTutorConversation = async (uid, { firstMessage = "", selectedItems = [] } = {}) => {
  ensureUid(uid);
  const conversationDoc = doc(conversationCollection(uid));
  const payload = {
    conversationId: conversationDoc.id,
    title: generateConversationTitle(firstMessage),
    preview: firstMessage.trim() || "New AI Tutor Chat",
    selectedMaterials: materialSummary(selectedItems),
    messageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(conversationDoc, payload);
  return { ...payload, id: conversationDoc.id };
};

export const saveTutorMessage = async (uid, conversationId, message) => {
  ensureUid(uid);
  if (!conversationId) throw new Error("A conversation id is required to save AI Tutor messages.");

  const text = String(message.text || "").trim();
  const payload = {
    sender: message.sender || "ai",
    text,
    citations: message.citations || [],
    contextMaterialIds: message.contextMaterialIds || [],
    createdAt: serverTimestamp(),
  };

  const messageDoc = await addDoc(messageCollection(uid, conversationId), payload);
  await updateDoc(conversationRef(uid, conversationId), {
    preview: text.slice(0, 180),
    lastSender: payload.sender,
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
  });

  return { ...payload, id: messageDoc.id };
};

export const updateTutorConversationAfterMessage = async (uid, conversationId, patch = {}) => {
  ensureUid(uid);
  if (!conversationId) return;

  await setDoc(conversationRef(uid, conversationId), {
    ...patch,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const deleteTutorConversation = async (uid, conversationId) => {
  ensureUid(uid);
  if (!conversationId) return;

  const messages = await getDocs(messageCollection(uid, conversationId));
  await Promise.all(messages.docs.map((message) => deleteDoc(message.ref)));
  await deleteDoc(conversationRef(uid, conversationId));
};

export const loadTutorContextMaterials = async (uid, selectedItems = []) => {
  if (!selectedItems.length) return [];

  return Promise.all(selectedItems.map(async (item) => {
    const materialId = getMaterialId(item);

    if ((!uid || isDemoMaterial(item)) && hasInlineKnowledge(item)) {
      return {
        id: materialId,
        type: item.type,
        title: item.title,
        path: item.path,
        knowledge: getInlineKnowledge(item),
      };
    }

    const record = await getKnowledgeForMaterial(uid, item);
    return {
      id: materialId,
      type: record.type || item.type,
      title: record.title || item.title,
      path: record.path || item.path,
      knowledge: record.knowledge,
    };
  }));
};

export const sendTutorMessage = async ({ message, contextMaterials = [], history = [] }) => {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, contextMaterials, history }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.error || result.message || "AI Tutor request failed");
  }

  return result.response || "";
};

