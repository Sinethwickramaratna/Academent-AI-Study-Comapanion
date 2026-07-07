import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use Study Planner.");
};

const eventsCollection = (uid) => collection(db, "users", uid, "studyPlannerEvents");
const eventRef = (uid, eventId) => doc(db, "users", uid, "studyPlannerEvents", eventId);

const normalizeReminder = (reminder = {}) => ({
  enabled: Boolean(reminder.enabled),
  beforeMinutes: Number(reminder.beforeMinutes || 0),
});

export const subscribeStudyPlannerEvents = (uid, onNext, onError) => {
  ensureUid(uid);
  const eventsQuery = query(eventsCollection(uid), orderBy("date", "asc"));

  return onSnapshot(
    eventsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
};

export const saveStudyPlannerEvent = async (uid, eventData, eventId = null) => {
  ensureUid(uid);
  const eventDoc = eventId ? eventRef(uid, eventId) : doc(eventsCollection(uid));
  const finalEventId = eventId || eventDoc.id;
  const isUpdate = Boolean(eventId);

  const payload = {
    eventId: finalEventId,
    userId: uid,
    title: String(eventData.title || "").trim(),
    type: eventData.type,
    semesterId: eventData.semesterId || "",
    moduleId: eventData.moduleId || "",
    folderId: eventData.folderId || "",
    folderPath: Array.isArray(eventData.folderPath) ? eventData.folderPath : [],
    selectedNoteIds: Array.isArray(eventData.selectedNoteIds) ? eventData.selectedNoteIds : [],
    selectedPdfIds: Array.isArray(eventData.selectedPdfIds) ? eventData.selectedPdfIds : [],
    date: eventData.date,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    priority: eventData.priority || "medium",
    repeat: eventData.repeat || "none",
    reminder: normalizeReminder(eventData.reminder),
    description: eventData.description || "",
    status: eventData.status || "pending",
    studyTopic: eventData.studyTopic || "",
    studyGoals: eventData.studyGoals || "",
    durationMinutes: Number(eventData.durationMinutes || 0),
    updatedAt: serverTimestamp(),
  };

  if (!isUpdate) payload.createdAt = serverTimestamp();

  await setDoc(eventDoc, payload, { merge: isUpdate });
  return payload;
};

export const deleteStudyPlannerEvent = async (uid, eventId) => {
  ensureUid(uid);
  if (!eventId) throw new Error("An event id is required to delete a Study Planner event.");
  await deleteDoc(eventRef(uid, eventId));
};

export const markStudyPlannerEventCompleted = async (uid, eventId) => {
  ensureUid(uid);
  if (!eventId) throw new Error("An event id is required to complete a Study Planner event.");

  await updateDoc(eventRef(uid, eventId), {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
};

