export const DEFAULT_NOTE_MANAGEMENT = {
  semesters: [],
};

export const createId = (prefix) => {
  const randomId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
};

export const findFolderById = (folders = [], folderId) => {
  for (const folder of folders) {
    if (folder.folderId === folderId) return folder;

    const nestedFolder = findFolderById(folder.folders || [], folderId);
    if (nestedFolder) return nestedFolder;
  }

  return null;
};

export const updateFolderById = (folders = [], folderId, updatedData) => (
  folders.map((folder) => {
    if (folder.folderId === folderId) {
      return { ...folder, ...updatedData };
    }

    return {
      ...folder,
      folders: updateFolderById(folder.folders || [], folderId, updatedData),
    };
  })
);

export const deleteFolderById = (folders = [], folderId) => (
  folders
    .filter((folder) => folder.folderId !== folderId)
    .map((folder) => ({
      ...folder,
      folders: deleteFolderById(folder.folders || [], folderId),
    }))
);

export const addItemToFolder = (folders = [], folderId, collectionName, item) => (
  folders.map((folder) => {
    if (folder.folderId === folderId) {
      return {
        ...folder,
        [collectionName]: [...(folder[collectionName] || []), item],
      };
    }

    return {
      ...folder,
      folders: addItemToFolder(folder.folders || [], folderId, collectionName, item),
    };
  })
);

export const updateItemInFolders = (folders = [], collectionName, idField, itemId, updatedData) => (
  folders.map((folder) => ({
    ...folder,
    [collectionName]: (folder[collectionName] || []).map((item) => (
      item[idField] === itemId ? { ...item, ...updatedData } : item
    )),
    folders: updateItemInFolders(folder.folders || [], collectionName, idField, itemId, updatedData),
  }))
);

export const deleteItemFromFolders = (folders = [], collectionName, idField, itemId) => (
  folders.map((folder) => ({
    ...folder,
    [collectionName]: (folder[collectionName] || []).filter((item) => item[idField] !== itemId),
    folders: deleteItemFromFolders(folder.folders || [], collectionName, idField, itemId),
  }))
);

export const createSemester = (semesterData) => ({
  semesterId: semesterData.semesterId || createId("semester"),
  title: semesterData.title || "",
  subtitle: semesterData.subtitle || "",
  accentColor: semesterData.accentColor || semesterData.accent || "Cyan",
  modules: semesterData.modules || [],
});

export const createModule = (moduleData) => ({
  moduleId: moduleData.moduleId || createId("module"),
  title: moduleData.title || "",
  subtitle: moduleData.subtitle || "",
  accentColor: moduleData.accentColor || moduleData.accent || "Violet",
  folders: moduleData.folders || [],
  pdfs: moduleData.pdfs || [],
  notes: moduleData.notes || [],
});

export const createFolder = (folderData) => ({
  folderId: folderData.folderId || createId("folder"),
  title: folderData.title || "",
  subtitle: folderData.subtitle || "",
  accentColor: folderData.accentColor || folderData.accent || "Emerald",
  folders: folderData.folders || [],
  pdfs: folderData.pdfs || [],
  notes: folderData.notes || [],
});

export const createPdf = (pdfData) => ({
  pdfId: pdfData.pdfId || createId("pdf"),
  title: pdfData.title || "",
  url: pdfData.url || "",
});

export const createNote = (noteData) => ({
  noteId: noteData.noteId || createId("note"),
  title: noteData.title || "",
  content: noteData.content || "",
});

export const updateModuleTree = (data, semesterId, moduleId, updater) => ({
  ...data,
  semesters: (data.semesters || []).map((semester) => {
    if (semester.semesterId !== semesterId) return semester;

    return {
      ...semester,
      modules: (semester.modules || []).map((module) => (
        module.moduleId === moduleId ? updater(module) : module
      )),
    };
  }),
});
