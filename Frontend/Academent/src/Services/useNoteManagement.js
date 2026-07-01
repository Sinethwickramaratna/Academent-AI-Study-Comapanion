import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  addFolder,
  addModule,
  addNote,
  addPdf,
  addSemester,
  createNoteManagementIfMissing,
  deleteFolder,
  deleteModule,
  deleteNote,
  deletePdf,
  deleteSemester,
  getNoteManagement,
  saveNoteManagement,
  updateFolder,
  updateModule,
  updateNote,
  updateSemester,
} from "./noteManagementService";

const ensureUser = (uid) => {
  if (!uid) throw new Error("You must be signed in to manage notes.");
};

export const useNoteManagement = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const [data, setData] = useState({ semesters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const runMutation = useCallback(async (mutation) => {
    ensureUser(uid);
    setError(null);

    try {
      const nextData = await mutation(uid);
      setData(nextData);
      return nextData;
    } catch (mutationError) {
      setError(mutationError);
      throw mutationError;
    }
  }, [uid]);

  const reload = useCallback(async () => {
    if (!uid) {
      setData({ semesters: [] });
      setLoading(false);
      return { semesters: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const existingData = await createNoteManagementIfMissing(uid);
      setData(existingData);
      return existingData;
    } catch (loadError) {
      setError(loadError);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    reload();
  }, [reload]);

  const methods = useMemo(() => ({
    reload,
    getNoteManagement: () => {
      ensureUser(uid);
      return getNoteManagement(uid);
    },
    saveNoteManagement: (nextData) => runMutation((userId) => saveNoteManagement(userId, nextData)),
    createNoteManagementIfMissing: () => runMutation((userId) => createNoteManagementIfMissing(userId)),
    addSemester: (semesterData) => runMutation((userId) => addSemester(userId, semesterData)),
    updateSemester: (semesterId, updatedData) => runMutation((userId) => updateSemester(userId, semesterId, updatedData)),
    deleteSemester: (semesterId) => runMutation((userId) => deleteSemester(userId, semesterId)),
    addModule: (semesterId, moduleData) => runMutation((userId) => addModule(userId, semesterId, moduleData)),
    updateModule: (semesterId, moduleId, updatedData) => runMutation((userId) => updateModule(userId, semesterId, moduleId, updatedData)),
    deleteModule: (semesterId, moduleId) => runMutation((userId) => deleteModule(userId, semesterId, moduleId)),
    addFolder: (semesterId, moduleId, parentFolderId, folderData) => runMutation((userId) => addFolder(userId, semesterId, moduleId, parentFolderId, folderData)),
    updateFolder: (semesterId, moduleId, folderId, updatedData) => runMutation((userId) => updateFolder(userId, semesterId, moduleId, folderId, updatedData)),
    deleteFolder: (semesterId, moduleId, folderId) => runMutation((userId) => deleteFolder(userId, semesterId, moduleId, folderId)),
    addPdf: (semesterId, moduleId, folderId, pdfData) => runMutation((userId) => addPdf(userId, semesterId, moduleId, folderId, pdfData)),
    deletePdf: (semesterId, moduleId, pdfId) => runMutation((userId) => deletePdf(userId, semesterId, moduleId, pdfId)),
    addNote: (semesterId, moduleId, folderId, noteData) => runMutation((userId) => addNote(userId, semesterId, moduleId, folderId, noteData)),
    updateNote: (semesterId, moduleId, noteId, updatedData) => runMutation((userId) => updateNote(userId, semesterId, moduleId, noteId, updatedData)),
    deleteNote: (semesterId, moduleId, noteId) => runMutation((userId) => deleteNote(userId, semesterId, moduleId, noteId)),
  }), [reload, runMutation, uid]);

  return {
    uid,
    data,
    loading,
    error,
    ...methods,
  };
};

export default useNoteManagement;
