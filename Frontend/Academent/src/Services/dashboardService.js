import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { DEFAULT_NOTE_MANAGEMENT } from "./noteManagementUtils";

export const DEFAULT_DASHBOARD_DATA = {
  profile: null,
  noteManagement: { ...DEFAULT_NOTE_MANAGEMENT },
  quizzes: [],
  plannerEvents: [],
  flashCardCollections: [],
  tutorConversations: [],
};

const ensureUid = (uid) => {
  if (!uid) throw new Error("A Firebase user UID is required to load dashboard data.");
};

export const subscribeDashboardData = (uid, onNext, onError) => {
  ensureUid(uid);

  let state = { ...DEFAULT_DASHBOARD_DATA };
  const updateState = (patch) => {
    state = { ...state, ...patch };
    onNext(state);
  };

  const handleError = (error) => {
    if (onError) onError(error);
  };

  const unsubscribers = [
    onSnapshot(
      doc(db, "users", uid),
      (snapshot) => updateState({ profile: snapshot.exists() ? snapshot.data() : null }),
      handleError,
    ),
    onSnapshot(
      doc(db, "users", uid, "noteManagement", "structure"),
      (snapshot) => updateState({
        noteManagement: snapshot.exists()
          ? { ...DEFAULT_NOTE_MANAGEMENT, ...snapshot.data() }
          : { ...DEFAULT_NOTE_MANAGEMENT },
      }),
      handleError,
    ),
    onSnapshot(
      query(collection(db, "users", uid, "quizzes"), orderBy("createdAt", "desc")),
      (snapshot) => updateState({ quizzes: snapshot.docs.map((item) => item.data()) }),
      handleError,
    ),
    onSnapshot(
      query(collection(db, "users", uid, "studyPlannerEvents"), orderBy("date", "asc")),
      (snapshot) => updateState({
        plannerEvents: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      }),
      handleError,
    ),
    onSnapshot(
      query(collection(db, "users", uid, "flashCardCollections"), orderBy("createdAt", "desc")),
      (snapshot) => updateState({
        flashCardCollections: snapshot.docs.map((item) => ({
          id: item.id,
          collectionId: item.id,
          ...item.data(),
        })),
      }),
      handleError,
    ),
    onSnapshot(
      query(collection(db, "users", uid, "aiTutorConversations"), orderBy("updatedAt", "desc"), limit(8)),
      (snapshot) => updateState({
        tutorConversations: snapshot.docs.map((item) => ({
          id: item.id,
          conversationId: item.id,
          ...item.data(),
        })),
      }),
      handleError,
    ),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};
