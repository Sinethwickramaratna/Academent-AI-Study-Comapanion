import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  DEFAULT_NOTE_MANAGEMENT,
  addItemToFolder,
  createFolder,
  createModule,
  createNote,
  createPdf,
  createSemester,
  deleteFolderById,
  deleteItemFromFolders,
  updateFolderById,
  updateItemInFolders,
  updateModuleTree,
} from "./noteManagementUtils";

const noteManagementRef = (uid) => doc(db, "users", uid, "noteManagement", "structure");

const getExistingData = async (uid) => {
  const data = await getNoteManagement(uid);
  return data || { ...DEFAULT_NOTE_MANAGEMENT };
};

export const getNoteManagement = async (uid) => {
  if (!uid) throw new Error("A Firebase user UID is required.");

  const snapshot = await getDoc(noteManagementRef(uid));
  if (!snapshot.exists()) return null;

  return {
    ...DEFAULT_NOTE_MANAGEMENT,
    ...snapshot.data(),
  };
};

export const saveNoteManagement = async (uid, data) => {
  if (!uid) throw new Error("A Firebase user UID is required.");

  const payload = {
    ...DEFAULT_NOTE_MANAGEMENT,
    ...data,
    semesters: data?.semesters || [],
  };

  await setDoc(noteManagementRef(uid), payload, { merge: true });
  return payload;
};

export const createNoteManagementIfMissing = async (uid) => {
  const existing = await getNoteManagement(uid);
  if (existing) return existing;

  await setDoc(noteManagementRef(uid), DEFAULT_NOTE_MANAGEMENT);
  return { ...DEFAULT_NOTE_MANAGEMENT };
};

export const addSemester = async (uid, semesterData) => {
  const data = await getExistingData(uid);
  const nextData = {
    ...data,
    semesters: [...(data.semesters || []), createSemester(semesterData)],
  };

  return saveNoteManagement(uid, nextData);
};

export const updateSemester = async (uid, semesterId, updatedData) => {
  const data = await getExistingData(uid);
  const nextData = {
    ...data,
    semesters: (data.semesters || []).map((semester) => (
      semester.semesterId === semesterId ? { ...semester, ...updatedData } : semester
    )),
  };

  return saveNoteManagement(uid, nextData);
};

export const deleteSemester = async (uid, semesterId) => {
  const data = await getExistingData(uid);
  const nextData = {
    ...data,
    semesters: (data.semesters || []).filter((semester) => semester.semesterId !== semesterId),
  };

  return saveNoteManagement(uid, nextData);
};

export const addModule = async (uid, semesterId, moduleData) => {
  const data = await getExistingData(uid);
  const nextData = {
    ...data,
    semesters: (data.semesters || []).map((semester) => (
      semester.semesterId === semesterId
        ? { ...semester, modules: [...(semester.modules || []), createModule(moduleData)] }
        : semester
    )),
  };

  return saveNoteManagement(uid, nextData);
};

export const updateModule = async (uid, semesterId, moduleId, updatedData) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({ ...module, ...updatedData }));

  return saveNoteManagement(uid, nextData);
};

export const deleteModule = async (uid, semesterId, moduleId) => {
  const data = await getExistingData(uid);
  const nextData = {
    ...data,
    semesters: (data.semesters || []).map((semester) => (
      semester.semesterId === semesterId
        ? { ...semester, modules: (semester.modules || []).filter((module) => module.moduleId !== moduleId) }
        : semester
    )),
  };

  return saveNoteManagement(uid, nextData);
};

export const addFolder = async (uid, semesterId, moduleId, parentFolderId, folderData) => {
  const data = await getExistingData(uid);
  const folder = createFolder(folderData);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => {
    if (!parentFolderId) {
      return { ...module, folders: [...(module.folders || []), folder] };
    }

    return {
      ...module,
      folders: addItemToFolder(module.folders || [], parentFolderId, "folders", folder),
    };
  });

  return saveNoteManagement(uid, nextData);
};

export const updateFolder = async (uid, semesterId, moduleId, folderId, updatedData) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({
    ...module,
    folders: updateFolderById(module.folders || [], folderId, updatedData),
  }));

  return saveNoteManagement(uid, nextData);
};

export const deleteFolder = async (uid, semesterId, moduleId, folderId) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({
    ...module,
    folders: deleteFolderById(module.folders || [], folderId),
  }));

  return saveNoteManagement(uid, nextData);
};

export const addPdf = async (uid, semesterId, moduleId, folderId, pdfData) => {
  const data = await getExistingData(uid);
  const pdf = createPdf(pdfData);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => {
    if (!folderId) {
      return { ...module, pdfs: [...(module.pdfs || []), pdf] };
    }

    return {
      ...module,
      folders: addItemToFolder(module.folders || [], folderId, "pdfs", pdf),
    };
  });

  return saveNoteManagement(uid, nextData);
};

export const deletePdf = async (uid, semesterId, moduleId, pdfId) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({
    ...module,
    pdfs: (module.pdfs || []).filter((pdf) => pdf.pdfId !== pdfId),
    folders: deleteItemFromFolders(module.folders || [], "pdfs", "pdfId", pdfId),
  }));

  return saveNoteManagement(uid, nextData);
};

export const addNote = async (uid, semesterId, moduleId, folderId, noteData) => {
  const data = await getExistingData(uid);
  const note = createNote(noteData);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => {
    if (!folderId) {
      return { ...module, notes: [...(module.notes || []), note] };
    }

    return {
      ...module,
      folders: addItemToFolder(module.folders || [], folderId, "notes", note),
    };
  });

  return saveNoteManagement(uid, nextData);
};

export const updateNote = async (uid, semesterId, moduleId, noteId, updatedData) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({
    ...module,
    notes: (module.notes || []).map((note) => (
      note.noteId === noteId ? { ...note, ...updatedData } : note
    )),
    folders: updateItemInFolders(module.folders || [], "notes", "noteId", noteId, updatedData),
  }));

  return saveNoteManagement(uid, nextData);
};

export const deleteNote = async (uid, semesterId, moduleId, noteId) => {
  const data = await getExistingData(uid);
  const nextData = updateModuleTree(data, semesterId, moduleId, (module) => ({
    ...module,
    notes: (module.notes || []).filter((note) => note.noteId !== noteId),
    folders: deleteItemFromFolders(module.folders || [], "notes", "noteId", noteId),
  }));

  return saveNoteManagement(uid, nextData);
};
