import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addItemToFolder,
  createFolder,
  createModule,
  createNote,
  createPdf,
  createSemester,
  deleteFolderById,
  deleteItemFromFolders,
  findFolderById,
  updateFolderById,
  updateItemInFolders,
  updateModuleTree,
} from "../../Frontend/Academent/src/Services/noteManagementUtils.js";

const folderTree = () => [
  {
    folderId: "root",
    title: "Root",
    folders: [
      {
        folderId: "child",
        title: "Child",
        notes: [{ noteId: "note-1", title: "Old title" }],
        pdfs: [{ pdfId: "pdf-1", title: "Old PDF" }],
        folders: [{ folderId: "grandchild", title: "Grandchild" }],
      },
    ],
    notes: [],
    pdfs: [],
  },
];

test("findFolderById searches nested folders recursively", () => {
  assert.equal(findFolderById(folderTree(), "grandchild")?.title, "Grandchild");
  assert.equal(findFolderById(folderTree(), "missing"), null);
});

test("updateFolderById updates matching nested folders without mutating the original tree", () => {
  const original = folderTree();
  const updated = updateFolderById(original, "child", { title: "Updated child" });

  assert.equal(findFolderById(updated, "child").title, "Updated child");
  assert.equal(findFolderById(original, "child").title, "Child");
});

test("deleteFolderById removes folders at any depth", () => {
  const updated = deleteFolderById(folderTree(), "grandchild");

  assert.equal(findFolderById(updated, "grandchild"), null);
  assert.equal(findFolderById(updated, "child")?.title, "Child");
});

test("folder item helpers add, update, and delete nested collection items", () => {
  const added = addItemToFolder(folderTree(), "child", "notes", { noteId: "note-2", title: "New note" });
  assert.equal(findFolderById(added, "child").notes.length, 2);

  const updated = updateItemInFolders(added, "notes", "noteId", "note-2", { title: "Updated note" });
  assert.equal(findFolderById(updated, "child").notes[1].title, "Updated note");

  const deleted = deleteItemFromFolders(updated, "notes", "noteId", "note-1");
  assert.deepEqual(
    findFolderById(deleted, "child").notes.map((note) => note.noteId),
    ["note-2"],
  );
});

test("factory helpers preserve supplied ids and fill default values", () => {
  assert.deepEqual(createSemester({ semesterId: "sem-1", title: "Year 1" }), {
    semesterId: "sem-1",
    title: "Year 1",
    subtitle: "",
    accentColor: "Cyan",
    modules: [],
  });

  assert.equal(createModule({ moduleId: "mod-1", accent: "Blue" }).accentColor, "Blue");
  assert.equal(createFolder({ folderId: "folder-1" }).accentColor, "Emerald");
  assert.equal(createPdf({ pdfId: "pdf-1", title: "Lecture" }).fileType, "application/pdf");
  assert.deepEqual(createNote({ noteId: "note-1", content: "Body" }), {
    noteId: "note-1",
    title: "",
    content: "Body",
  });
});

test("updateModuleTree applies updates only to the requested semester and module", () => {
  const data = {
    semesters: [
      {
        semesterId: "sem-1",
        modules: [
          { moduleId: "mod-1", title: "Before" },
          { moduleId: "mod-2", title: "Untouched" },
        ],
      },
      {
        semesterId: "sem-2",
        modules: [{ moduleId: "mod-1", title: "Other semester" }],
      },
    ],
  };

  const updated = updateModuleTree(data, "sem-1", "mod-1", (module) => ({
    ...module,
    title: "After",
  }));

  assert.equal(updated.semesters[0].modules[0].title, "After");
  assert.equal(updated.semesters[0].modules[1].title, "Untouched");
  assert.equal(updated.semesters[1].modules[0].title, "Other semester");
});

