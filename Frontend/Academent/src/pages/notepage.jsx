import { useRef, useState } from 'react';
import FolderCreateModal from '../components/FolderCreateModal';
import FolderVaultCard from '../components/FolderVaultCard';
import NoteCreateModal from '../components/NoteCreateModal';
import NotesActionButton from '../components/NotesActionButton';
import NotesBreadcrumb from '../components/NotesBreadcrumb';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import './notepage.css';

const INITIAL_SEMESTERS = [
  { id: 1, title: "Semester 1", subtitle: "Foundation archive", files: 18, progress: 82, accent: "cyan", icon: "neurology" },
  { id: 2, title: "Semester 2", subtitle: "Core systems", files: 24, progress: 64, accent: "violet", icon: "hub" },
  { id: 3, title: "Semester 3", subtitle: "Research stack", files: 31, progress: 48, accent: "emerald", icon: "science" },
  { id: 4, title: "Semester 4", subtitle: "Exam capsule", files: 16, progress: 91, accent: "amber", icon: "auto_stories" },
  { id: 5, title: "Semester 5", subtitle: "Project vault", files: 27, progress: 36, accent: "rose", icon: "token" },
];

const INITIAL_SEMESTER_MODULES = [
  {
    semesterId: 1,
    modules: [
      { moduleId: "MATH101", title: "Mathematics", subtitle: "Calculus and vectors", files: 5, progress: 78, accent: "cyan", icon: "functions" },
      { moduleId: "PHYS101", title: "Physics", subtitle: "Motion lab notes", files: 3, progress: 62, accent: "violet", icon: "speed" },
      { moduleId: "CHEM101", title: "Chemistry", subtitle: "Atomic systems", files: 4, progress: 70, accent: "emerald", icon: "science" },
    ],
  },
  {
    semesterId: 2,
    modules: [
      { moduleId: "CS201", title: "Computer Science", subtitle: "Logic and code", files: 6, progress: 74, accent: "violet", icon: "terminal" },
      { moduleId: "ENG201", title: "English Literature", subtitle: "Critical essays", files: 4, progress: 51, accent: "rose", icon: "history_edu" },
      { moduleId: "HIST201", title: "History", subtitle: "Timeline archive", files: 5, progress: 66, accent: "amber", icon: "account_balance" },
    ],
  },
  {
    semesterId: 3,
    modules: [
      { moduleId: "BIO301", title: "Biology", subtitle: "Cell systems", files: 7, progress: 84, accent: "emerald", icon: "biotech" },
      { moduleId: "CHEM301", title: "Advanced Chemistry", subtitle: "Reaction network", files: 5, progress: 58, accent: "amber", icon: "experiment" },
      { moduleId: "PHYS301", title: "Advanced Physics", subtitle: "Quantum notes", files: 6, progress: 46, accent: "cyan", icon: "orbit" },
    ],
  },
  {
    semesterId: 4,
    modules: [
      { moduleId: "CS401", title: "Algorithms", subtitle: "Complexity vault", files: 8, progress: 88, accent: "violet", icon: "schema" },
      { moduleId: "MATH401", title: "Linear Algebra", subtitle: "Matrix systems", files: 5, progress: 72, accent: "cyan", icon: "grid_on" },
      { moduleId: "STAT401", title: "Statistics", subtitle: "Probability engine", files: 4, progress: 63, accent: "rose", icon: "monitoring" },
    ],
  },
  {
    semesterId: 5,
    modules: [
      { moduleId: "CS501", title: "Machine Learning", subtitle: "Model training", files: 9, progress: 81, accent: "emerald", icon: "model_training" },
      { moduleId: "AI501", title: "Artificial Intelligence", subtitle: "Neural workspace", files: 7, progress: 76, accent: "violet", icon: "psychology" },
      { moduleId: "DATA501", title: "Data Science", subtitle: "Dataset capsule", files: 6, progress: 69, accent: "amber", icon: "database" },
    ],
  },
];

const createEmptyWorkspace = () => ({ folders: [], notes: [], pdfs: [] });

const INITIAL_MODULE_WORKSPACES = {
  MATH101: {
    folders: [
      { id: 1, workspaceKey: "MATH101/folder-1", title: "Lecture Notes", subtitle: "Core formulas", files: 3, progress: 74, accent: "cyan", icon: "folder_special" },
      { id: 2, workspaceKey: "MATH101/folder-2", title: "Practice Sets", subtitle: "Weekly drills", files: 2, progress: 58, accent: "violet", icon: "folder_open" },
    ],
    notes: [
      { id: 1, title: "Limits quick review", content: "Focus on one-sided limits, continuity checks, and substitution traps." },
      { id: 2, title: "Vector identities", content: "Dot product measures projection. Cross product gives a perpendicular vector and area scale." },
    ],
    pdfs: [
      { id: 1, name: "Calculus_Formula_Sheet.pdf", size: 820000, uploadedAt: "Ready for review" },
    ],
  },
  "MATH101/folder-1": createEmptyWorkspace(),
  "MATH101/folder-2": createEmptyWorkspace(),
  PHYS101: {
    folders: [
      { id: 1, workspaceKey: "PHYS101/folder-1", title: "Lab Records", subtitle: "Motion experiments", files: 2, progress: 66, accent: "violet", icon: "folder_special" },
    ],
    notes: [
      { id: 1, title: "Newton laws", content: "Net force changes acceleration. Keep units consistent before solving." },
    ],
    pdfs: [],
  },
  "PHYS101/folder-1": createEmptyWorkspace(),
  CHEM101: {
    folders: [
      { id: 1, workspaceKey: "CHEM101/folder-1", title: "Reactions", subtitle: "Atomic basics", files: 2, progress: 62, accent: "emerald", icon: "folder_special" },
    ],
    notes: [
      { id: 1, title: "Periodic trends", content: "Atomic radius decreases across a period and increases down a group." },
    ],
    pdfs: [],
  },
  "CHEM101/folder-1": createEmptyWorkspace(),
};

const EMPTY_SEMESTER_FORM = { title: "", subtitle: "", accent: "cyan" };
const EMPTY_MODULE_FORM = { moduleId: "", title: "", subtitle: "", accent: "cyan" };
const EMPTY_FOLDER_FORM = { title: "", subtitle: "", accent: "cyan" };
const EMPTY_NOTE_FORM = { title: "", content: "" };

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function NotePage({ profile, currentUser }) {
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeFolderTrail, setActiveFolderTrail] = useState([]);
  const [semesters, setSemesters] = useState(INITIAL_SEMESTERS);
  const [semesterModules, setSemesterModules] = useState(INITIAL_SEMESTER_MODULES);
  const [moduleWorkspaces, setModuleWorkspaces] = useState(INITIAL_MODULE_WORKSPACES);
  const [modalType, setModalType] = useState(null);
  const [semesterForm, setSemesterForm] = useState(EMPTY_SEMESTER_FORM);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [folderForm, setFolderForm] = useState(EMPTY_FOLDER_FORM);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [editingFolder, setEditingFolder] = useState(null);
  const pdfInputRef = useRef(null);

  const fullName = profile?.fullName || currentUser?.displayName || "Student";
  const photoURL = currentUser?.photoURL || profile?.photoURL || "";
  const selectedSemester = semesters.find((semester) => semester.id === activeSemester);
  const selectedModules = semesterModules.find((semester) => semester.semesterId === activeSemester)?.modules || [];
  const selectedModule = selectedModules.find((module) => module.moduleId === activeModuleId);
  const currentWorkspaceKey = activeFolderTrail.at(-1)?.workspaceKey || activeModuleId;
  const selectedWorkspace = moduleWorkspaces[currentWorkspaceKey] || createEmptyWorkspace();
  const currentFolder = activeFolderTrail.at(-1);
  const currentWorkspaceTitle = currentFolder?.title || selectedModule?.title || activeModuleId;
  const isFolderWorkspace = activeFolderTrail.length > 0;

  const closeModal = () => {
    setModalType(null);
    setSemesterForm(EMPTY_SEMESTER_FORM);
    setModuleForm(EMPTY_MODULE_FORM);
    setFolderForm(EMPTY_FOLDER_FORM);
    setNoteForm(EMPTY_NOTE_FORM);
    setEditingFolder(null);
  };

  const goToNotesHome = () => {
    setActiveSemester(null);
    setActiveModuleId(null);
    setActiveFolderTrail([]);
  };

  const goToSemesterModules = () => {
    setActiveModuleId(null);
    setActiveFolderTrail([]);
  };

  const goToModuleRoot = () => {
    setActiveFolderTrail([]);
  };

  const goToFolderTrailIndex = (index) => {
    setActiveFolderTrail((current) => current.slice(0, index + 1));
  };

  const updateSemesterForm = (field, value) => setSemesterForm((current) => ({ ...current, [field]: value }));
  const updateModuleForm = (field, value) => setModuleForm((current) => ({ ...current, [field]: value }));
  const updateFolderForm = (field, value) => setFolderForm((current) => ({ ...current, [field]: value }));
  const updateNoteForm = (field, value) => setNoteForm((current) => ({ ...current, [field]: value }));

  const updateFolderEverywhere = (workspaceKey, updater) => {
    setModuleWorkspaces((current) => Object.fromEntries(Object.entries(current).map(([key, workspace]) => [
      key,
      { ...workspace, folders: workspace.folders.map((folder) => (folder.workspaceKey === workspaceKey ? updater(folder) : folder)) },
    ])));
  };

  const removeWorkspaceBranch = (workspaces, rootKey) => {
    const keysToRemove = new Set([rootKey]);
    const queue = [rootKey];

    while (queue.length) {
      const key = queue.shift();
      const workspace = workspaces[key];
      if (!workspace) continue;

      workspace.folders.forEach((folder) => {
        if (!keysToRemove.has(folder.workspaceKey)) {
          keysToRemove.add(folder.workspaceKey);
          queue.push(folder.workspaceKey);
        }
      });
    }

    return Object.fromEntries(Object.entries(workspaces).filter(([key]) => !keysToRemove.has(key)));
  };

  const bumpActiveContainerFileCount = (count = 1) => {
    if (!activeModuleId) return;

    setSemesterModules((current) => current.map((semester) => (
      semester.semesterId === activeSemester
        ? {
          ...semester,
          modules: semester.modules.map((module) => (
            module.moduleId === activeModuleId
              ? { ...module, files: Math.max(0, module.files + count), progress: Math.min(100, Math.max(0, module.progress + (4 * count))) }
              : module
          )),
        }
        : semester
    )));

    setSemesters((current) => current.map((semester) => (
      semester.id === activeSemester
        ? { ...semester, files: Math.max(0, semester.files + count), progress: Math.min(100, Math.max(0, semester.progress + (2 * count))) }
        : semester
    )));

    if (isFolderWorkspace) {
      updateFolderEverywhere(currentWorkspaceKey, (folder) => ({
        ...folder,
        files: Math.max(0, folder.files + count),
        progress: Math.min(100, Math.max(0, folder.progress + (5 * count))),
      }));
    }
  };

  const handleCreateSemester = (event) => {
    event.preventDefault();

    const nextSemesterId = Math.max(0, ...semesters.map((semester) => semester.id)) + 1;
    const newSemester = {
      id: nextSemesterId,
      title: semesterForm.title.trim(),
      subtitle: semesterForm.subtitle.trim(),
      files: 0,
      progress: 0,
      accent: semesterForm.accent,
      icon: "auto_stories",
    };

    setSemesters((current) => [...current, newSemester]);
    setSemesterModules((current) => [...current, { semesterId: nextSemesterId, modules: [] }]);
    closeModal();
  };

  const handleCreateModule = (event) => {
    event.preventDefault();
    if (!activeSemester) return;

    const newModule = {
      moduleId: moduleForm.moduleId.trim().toUpperCase(),
      title: moduleForm.title.trim(),
      subtitle: moduleForm.subtitle.trim(),
      files: 0,
      progress: 0,
      accent: moduleForm.accent,
      icon: "topic",
    };

    setSemesterModules((current) => current.map((semester) => (
      semester.semesterId === activeSemester
        ? { ...semester, modules: [...semester.modules, newModule] }
        : semester
    )));
    setModuleWorkspaces((current) => ({ ...current, [newModule.moduleId]: createEmptyWorkspace() }));
    closeModal();
  };

  const handleCreateFolder = (event) => {
    event.preventDefault();
    if (!currentWorkspaceKey) return;

    const existingFolders = selectedWorkspace.folders;
    const nextFolderId = Math.max(0, ...existingFolders.map((folder) => folder.id)) + 1;
    const workspaceKey = `${currentWorkspaceKey}/folder-${Date.now()}`;
    const newFolder = {
      id: nextFolderId,
      workspaceKey,
      title: folderForm.title.trim(),
      subtitle: folderForm.subtitle.trim(),
      files: 0,
      progress: 0,
      accent: folderForm.accent,
      icon: "folder_special",
    };

    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      return {
        ...current,
        [currentWorkspaceKey]: { ...workspace, folders: [...workspace.folders, newFolder] },
        [workspaceKey]: createEmptyWorkspace(),
      };
    });
    bumpActiveContainerFileCount();
    closeModal();
  };

  const handleEditFolder = (event) => {
    event.preventDefault();
    if (!editingFolder) return;

    updateFolderEverywhere(editingFolder.workspaceKey, (folder) => ({
      ...folder,
      title: folderForm.title.trim(),
      subtitle: folderForm.subtitle.trim(),
      accent: folderForm.accent,
    }));
    setActiveFolderTrail((current) => current.map((folder) => (
      folder.workspaceKey === editingFolder.workspaceKey
        ? { ...folder, title: folderForm.title.trim(), subtitle: folderForm.subtitle.trim(), accent: folderForm.accent }
        : folder
    )));
    closeModal();
  };

  const openEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({ title: folder.title, subtitle: folder.subtitle, accent: folder.accent });
    setModalType("editFolder");
  };

  const removeFolder = (folderToRemove) => {
    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      const updated = {
        ...current,
        [currentWorkspaceKey]: {
          ...workspace,
          folders: workspace.folders.filter((folder) => folder.workspaceKey !== folderToRemove.workspaceKey),
        },
      };
      return removeWorkspaceBranch(updated, folderToRemove.workspaceKey);
    });
    bumpActiveContainerFileCount(-1);
  };

  const removeCurrentFolder = () => {
    if (!currentFolder) return;
    const parentKey = activeFolderTrail.at(-2)?.workspaceKey || activeModuleId;

    setModuleWorkspaces((current) => {
      const parentWorkspace = current[parentKey] || createEmptyWorkspace();
      const updated = {
        ...current,
        [parentKey]: {
          ...parentWorkspace,
          folders: parentWorkspace.folders.filter((folder) => folder.workspaceKey !== currentFolder.workspaceKey),
        },
      };
      return removeWorkspaceBranch(updated, currentFolder.workspaceKey);
    });
    setActiveFolderTrail((current) => current.slice(0, -1));
    bumpActiveContainerFileCount(-1);
  };

  const handleCreateNote = (event) => {
    event.preventDefault();
    if (!currentWorkspaceKey) return;

    const existingNotes = selectedWorkspace.notes;
    const nextNoteId = Math.max(0, ...existingNotes.map((note) => note.id)) + 1;
    const newNote = {
      id: nextNoteId,
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
    };

    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      return {
        ...current,
        [currentWorkspaceKey]: { ...workspace, notes: [...workspace.notes, newNote] },
      };
    });
    bumpActiveContainerFileCount();
    closeModal();
  };

  const removeNote = (noteId) => {
    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      return {
        ...current,
        [currentWorkspaceKey]: { ...workspace, notes: workspace.notes.filter((note) => note.id !== noteId) },
      };
    });
    bumpActiveContainerFileCount(-1);
  };

  const handleUploadPdfs = (event) => {
    if (!currentWorkspaceKey) return;

    const files = Array.from(event.target.files || []).filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (!files.length) return;

    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      const nextPdfId = Math.max(0, ...workspace.pdfs.map((pdf) => pdf.id)) + 1;
      const uploadedPdfs = files.map((file, index) => ({
        id: nextPdfId + index,
        name: file.name,
        size: file.size,
        uploadedAt: "Uploaded just now",
      }));

      return {
        ...current,
        [currentWorkspaceKey]: { ...workspace, pdfs: [...workspace.pdfs, ...uploadedPdfs] },
      };
    });

    bumpActiveContainerFileCount(files.length);
    event.target.value = "";
  };

  const removePdf = (pdfId) => {
    setModuleWorkspaces((current) => {
      const workspace = current[currentWorkspaceKey] || createEmptyWorkspace();
      return {
        ...current,
        [currentWorkspaceKey]: { ...workspace, pdfs: workspace.pdfs.filter((pdf) => pdf.id !== pdfId) },
      };
    });
    bumpActiveContainerFileCount(-1);
  };

  const openFolder = (folder) => {
    setActiveFolderTrail((current) => [...current, folder]);
  };

  const renderWorkspace = () => (
    <>
      <input
        ref={pdfInputRef}
        className="module-pdf-input"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={handleUploadPdfs}
      />

      <div className="module-workspace-panel">
        <div className="module-workspace-panel__heading">
          <div>
            <h3>Folders</h3>
            <p>Create nested folders for lectures, labs, weeks, or revision sets.</p>
          </div>
        </div>
        <div className="folder-vault-grid modules-vault-grid">
          {selectedWorkspace.folders.map((folder) => (
            <FolderVaultCard
              key={folder.workspaceKey}
              folder={folder}
              kicker="FOLDER"
              onClick={() => openFolder(folder)}
              onEdit={() => openEditFolder(folder)}
              onDelete={() => removeFolder(folder)}
            />
          ))}
        </div>
      </div>

      <div className="module-workspace-panel">
        <div className="module-workspace-panel__heading">
          <div>
            <h3>PDFs</h3>
            <p>Upload lecture slides, readings, handouts, and scanned materials.</p>
          </div>
        </div>
        <div className="module-file-grid">
          {selectedWorkspace.pdfs.map((pdf) => (
            <article key={pdf.id} className="module-pdf-card">
              <div className="module-pdf-card__icon">
                <span className="material-symbols-outlined">picture_as_pdf</span>
              </div>
              <div className="module-pdf-card__content">
                <h4>{pdf.name}</h4>
                <p>{formatFileSize(pdf.size)} - {pdf.uploadedAt}</p>
              </div>
              <div className="file-card-menu">
                <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${pdf.name}`}>
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                <div className="file-card-menu__content">
                  <button className="file-card-menu__danger" type="button" onClick={() => removePdf(pdf.id)}>
                    <span className="material-symbols-outlined">delete</span>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="module-workspace-panel">
        <div className="module-workspace-panel__heading">
          <div>
            <h3>Notes</h3>
            <p>Capture quick summaries, formulas, reminders, and study prompts.</p>
          </div>
        </div>
        <div className="module-note-grid">
          {selectedWorkspace.notes.map((note) => (
            <article key={note.id} className="module-note-card">
              <div className="module-note-card__icon">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h4>{note.title}</h4>
                <p>{note.content}</p>
              </div>
              <div className="file-card-menu">
                <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${note.title}`}>
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                <div className="file-card-menu__content">
                  <button className="file-card-menu__danger" type="button" onClick={() => removeNote(note.id)}>
                    <span className="material-symbols-outlined">delete</span>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl notes-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search your knowledge base..." />

      {activeSemester && activeModuleId ? (
        <section>
          <NotesBreadcrumb
            items={[
              { label: "My Notes", onClick: goToNotesHome },
              { label: selectedSemester?.title || "Semester", onClick: goToSemesterModules },
              { label: selectedModule?.title || activeModuleId, onClick: goToModuleRoot },
              ...activeFolderTrail.map((folder, index) => ({
                label: folder.title,
                active: index === activeFolderTrail.length - 1,
                onClick: index === activeFolderTrail.length - 1 ? undefined : () => goToFolderTrailIndex(index),
              })),
            ]}
          />

          <NotesSectionHeader
            title={currentWorkspaceTitle}
            description={isFolderWorkspace ? "Folder workspace for nested folders, PDFs, and notes" : "Module workspace for folders, PDFs, and notes"}
            backAction={(
              <NotesActionButton
                className="back-button"
                icon="chevron_left"
                label={isFolderWorkspace ? "Back" : "Back to Modules"}
                onClick={isFolderWorkspace ? () => setActiveFolderTrail((current) => current.slice(0, -1)) : goToSemesterModules}
              />
            )}
            action={(
              <div className="notes-header-actions">
                <NotesActionButton icon="create_new_folder" label="New Folder" onClick={() => setModalType("folder")} />
                <NotesActionButton icon="upload_file" label="Upload PDF" onClick={() => pdfInputRef.current?.click()} />
                <NotesActionButton icon="note_add" label="New Note" onClick={() => setModalType("note")} />
                {isFolderWorkspace && (
                  <div className="workspace-actions-menu">
                    <button className="workspace-actions-menu__trigger" type="button">
                      <span className="material-symbols-outlined">more_horiz</span>
                      Folder Actions
                    </button>
                    <div className="workspace-actions-menu__content">
                      <button type="button" onClick={() => openEditFolder(currentFolder)}>
                        <span className="material-symbols-outlined">edit</span>
                        Edit Folder
                      </button>
                      <button className="workspace-actions-menu__danger" type="button" onClick={removeCurrentFolder}>
                        <span className="material-symbols-outlined">delete</span>
                        Remove Folder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          />

          {renderWorkspace()}
        </section>
      ) : activeSemester ? (
        <section>
          <NotesBreadcrumb
            items={[
              { label: "My Notes", onClick: goToNotesHome },
              { label: selectedSemester?.title || "Semester", active: true },
            ]}
          />

          <NotesSectionHeader
            title={`${selectedSemester?.title || "Semester"} Modules`}
            description="Module folders linked to this semester vault"
            backAction={<NotesActionButton className="back-button" icon="chevron_left" label="Back" onClick={goToNotesHome} />}
            action={<NotesActionButton icon="create_new_folder" label="New Module" onClick={() => setModalType("module")} />}
          />

          <div className="folder-vault-grid modules-vault-grid">
            {selectedModules.map((module) => (
              <FolderVaultCard
                key={module.moduleId}
                folder={module}
                kicker={module.moduleId}
                onClick={() => setActiveModuleId(module.moduleId)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <NotesBreadcrumb items={[{ label: "My Notes" }]} />

          <NotesSectionHeader
            title="My Notes"
            description="Your personal knowledge base"
            action={<NotesActionButton icon="create_new_folder" label="New Semester" onClick={() => setModalType("semester")} />}
          />

          <div className="folder-vault-grid">
            {semesters.map((semester) => (
              <FolderVaultCard
                key={semester.id}
                folder={semester}
                kicker={`S${semester.id.toString().padStart(2, '0')} NODE`}
                onClick={() => setActiveSemester(semester.id)}
              />
            ))}
          </div>
        </section>
      )}

      {modalType === "semester" && (
        <FolderCreateModal type="semester" values={semesterForm} onChange={updateSemesterForm} onClose={closeModal} onSubmit={handleCreateSemester} />
      )}

      {modalType === "module" && (
        <FolderCreateModal type="module" values={moduleForm} onChange={updateModuleForm} onClose={closeModal} onSubmit={handleCreateModule} />
      )}

      {modalType === "folder" && (
        <FolderCreateModal type="folder" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleCreateFolder} />
      )}

      {modalType === "editFolder" && (
        <FolderCreateModal type="folder" mode="edit" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleEditFolder} />
      )}

      {modalType === "note" && (
        <NoteCreateModal values={noteForm} onChange={updateNoteForm} onClose={closeModal} onSubmit={handleCreateNote} />
      )}
    </main>
  );
}

export default NotePage;

