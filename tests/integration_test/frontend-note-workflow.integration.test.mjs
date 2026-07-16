import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addItemToFolder,
  createFolder,
  createModule,
  createNote,
  createPdf,
  createSemester,
  deleteItemFromFolders,
  findFolderById,
  updateFolderById,
  updateItemInFolders,
  updateModuleTree,
} from "../../Frontend/Academent/src/Services/noteManagementUtils.js";

test("note management workflow builds and updates a semester module folder tree", () => {
  const semester = createSemester({
    semesterId: "semester-1",
    title: "Semester 1",
    modules: [
      createModule({
        moduleId: "module-db",
        title: "Database Systems",
        folders: [
          createFolder({
            folderId: "folder-normalization",
            title: "Normalization",
          }),
        ],
      }),
    ],
  });

  let data = { semesters: [semester] };

  data = updateModuleTree(data, "semester-1", "module-db", (module) => ({
    ...module,
    folders: addItemToFolder(
      module.folders,
      "folder-normalization",
      "pdfs",
      createPdf({
        pdfId: "pdf-lecture-1",
        title: "Normalization lecture",
        url: "https://example.test/normalization.pdf",
        size: 2048,
      }),
    ),
  }));

  data = updateModuleTree(data, "semester-1", "module-db", (module) => ({
    ...module,
    folders: addItemToFolder(
      module.folders,
      "folder-normalization",
      "notes",
      createNote({
        noteId: "note-bcnf",
        title: "BCNF summary",
        content: "BCNF removes dependency anomalies.",
      }),
    ),
  }));

  data = updateModuleTree(data, "semester-1", "module-db", (module) => ({
    ...module,
    folders: updateFolderById(module.folders, "folder-normalization", {
      subtitle: "Lecture notes and extracted PDFs",
    }),
  }));

  data = updateModuleTree(data, "semester-1", "module-db", (module) => ({
    ...module,
    folders: updateItemInFolders(module.folders, "notes", "noteId", "note-bcnf", {
      content: "BCNF requires every determinant to be a candidate key.",
    }),
  }));

  const module = data.semesters[0].modules[0];
  const folder = findFolderById(module.folders, "folder-normalization");

  assert.equal(folder.subtitle, "Lecture notes and extracted PDFs");
  assert.equal(folder.pdfs[0].storageProvider, "cloudinary");
  assert.equal(folder.pdfs[0].fileType, "application/pdf");
  assert.equal(folder.notes[0].content, "BCNF requires every determinant to be a candidate key.");

  const withoutPdf = updateModuleTree(data, "semester-1", "module-db", (currentModule) => ({
    ...currentModule,
    folders: deleteItemFromFolders(currentModule.folders, "pdfs", "pdfId", "pdf-lecture-1"),
  }));

  assert.equal(findFolderById(withoutPdf.semesters[0].modules[0].folders, "folder-normalization").pdfs.length, 0);
});

