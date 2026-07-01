import { useState } from 'react';
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

const INITIAL_MODULE_WORKSPACES = {
  MATH101: {
    folders: [
      { id: 1, title: "Lecture Notes", subtitle: "Core formulas", files: 3, progress: 74, accent: "cyan", icon: "folder_special" },
      { id: 2, title: "Practice Sets", subtitle: "Weekly drills", files: 2, progress: 58, accent: "violet", icon: "folder_open" },
    ],
    notes: [
      { id: 1, title: "Limits quick review", content: "Focus on one-sided limits, continuity checks, and substitution traps." },
      { id: 2, title: "Vector identities", content: "Dot product measures projection. Cross product gives a perpendicular vector and area scale." },
    ],
  },
  PHYS101: {
    folders: [
      { id: 1, title: "Lab Records", subtitle: "Motion experiments", files: 2, progress: 66, accent: "violet", icon: "folder_special" },
    ],
    notes: [
      { id: 1, title: "Newton laws", content: "Net force changes acceleration. Keep units consistent before solving." },
    ],
  },
  CHEM101: {
    folders: [
      { id: 1, title: "Reactions", subtitle: "Atomic basics", files: 2, progress: 62, accent: "emerald", icon: "folder_special" },
    ],
    notes: [
      { id: 1, title: "Periodic trends", content: "Atomic radius decreases across a period and increases down a group." },
    ],
  },
};

const EMPTY_SEMESTER_FORM = { title: "", subtitle: "", accent: "cyan" };
const EMPTY_MODULE_FORM = { moduleId: "", title: "", subtitle: "", accent: "cyan" };
const EMPTY_FOLDER_FORM = { title: "", subtitle: "", accent: "cyan" };
const EMPTY_NOTE_FORM = { title: "", content: "" };

function NotePage({ profile, currentUser }) {
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [semesters, setSemesters] = useState(INITIAL_SEMESTERS);
  const [semesterModules, setSemesterModules] = useState(INITIAL_SEMESTER_MODULES);
  const [moduleWorkspaces, setModuleWorkspaces] = useState(INITIAL_MODULE_WORKSPACES);
  const [modalType, setModalType] = useState(null);
  const [semesterForm, setSemesterForm] = useState(EMPTY_SEMESTER_FORM);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [folderForm, setFolderForm] = useState(EMPTY_FOLDER_FORM);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);

  const fullName = profile?.fullName || currentUser?.displayName || "Student";
  const photoURL = currentUser?.photoURL || profile?.photoURL || "";
  const selectedSemester = semesters.find((semester) => semester.id === activeSemester);
  const selectedModules = semesterModules.find((semester) => semester.semesterId === activeSemester)?.modules || [];
  const selectedModule = selectedModules.find((module) => module.moduleId === activeModuleId);
  const selectedWorkspace = moduleWorkspaces[activeModuleId] || { folders: [], notes: [] };

  const closeModal = () => {
    setModalType(null);
    setSemesterForm(EMPTY_SEMESTER_FORM);
    setModuleForm(EMPTY_MODULE_FORM);
    setFolderForm(EMPTY_FOLDER_FORM);
    setNoteForm(EMPTY_NOTE_FORM);
  };

  const goToNotesHome = () => {
    setActiveSemester(null);
    setActiveModuleId(null);
  };

  const goToSemesterModules = () => {
    setActiveModuleId(null);
  };

  const updateSemesterForm = (field, value) => {
    setSemesterForm((current) => ({ ...current, [field]: value }));
  };

  const updateModuleForm = (field, value) => {
    setModuleForm((current) => ({ ...current, [field]: value }));
  };

  const updateFolderForm = (field, value) => {
    setFolderForm((current) => ({ ...current, [field]: value }));
  };

  const updateNoteForm = (field, value) => {
    setNoteForm((current) => ({ ...current, [field]: value }));
  };

  const bumpActiveModuleFileCount = () => {
    setSemesterModules((current) => current.map((semester) => (
      semester.semesterId === activeSemester
        ? {
          ...semester,
          modules: semester.modules.map((module) => (
            module.moduleId === activeModuleId
              ? { ...module, files: module.files + 1, progress: Math.min(100, module.progress + 4) }
              : module
          )),
        }
        : semester
    )));

    setSemesters((current) => current.map((semester) => (
      semester.id === activeSemester
        ? { ...semester, files: semester.files + 1, progress: Math.min(100, semester.progress + 2) }
        : semester
    )));
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
    setModuleWorkspaces((current) => ({ ...current, [newModule.moduleId]: { folders: [], notes: [] } }));
    closeModal();
  };

  const handleCreateFolder = (event) => {
    event.preventDefault();
    if (!activeModuleId) return;

    const existingFolders = selectedWorkspace.folders;
    const nextFolderId = Math.max(0, ...existingFolders.map((folder) => folder.id)) + 1;
    const newFolder = {
      id: nextFolderId,
      title: folderForm.title.trim(),
      subtitle: folderForm.subtitle.trim(),
      files: 0,
      progress: 0,
      accent: folderForm.accent,
      icon: "folder_special",
    };

    setModuleWorkspaces((current) => {
      const workspace = current[activeModuleId] || { folders: [], notes: [] };
      return {
        ...current,
        [activeModuleId]: { ...workspace, folders: [...workspace.folders, newFolder] },
      };
    });
    closeModal();
  };

  const handleCreateNote = (event) => {
    event.preventDefault();
    if (!activeModuleId) return;

    const existingNotes = selectedWorkspace.notes;
    const nextNoteId = Math.max(0, ...existingNotes.map((note) => note.id)) + 1;
    const newNote = {
      id: nextNoteId,
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
    };

    setModuleWorkspaces((current) => {
      const workspace = current[activeModuleId] || { folders: [], notes: [] };
      return {
        ...current,
        [activeModuleId]: { ...workspace, notes: [...workspace.notes, newNote] },
      };
    });
    bumpActiveModuleFileCount();
    closeModal();
  };

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl notes-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search your knowledge base..." />

      {activeSemester && activeModuleId ? (
        <section>
          <NotesBreadcrumb
            items={[
              { label: "My Notes", onClick: goToNotesHome },
              { label: selectedSemester?.title || "Semester", onClick: goToSemesterModules },
              { label: selectedModule?.title || activeModuleId, active: true },
            ]}
          />

          <NotesSectionHeader
            title={selectedModule?.title || activeModuleId}
            description="Module workspace for folders and notes"
            backAction={(
              <NotesActionButton
                className="back-button"
                icon="chevron_left"
                label="Back to Modules"
                onClick={goToSemesterModules}
              />
            )}
            action={(
              <div className="notes-header-actions">
                <NotesActionButton
                  icon="create_new_folder"
                  label="New Folder"
                  onClick={() => setModalType("folder")}
                />
                <NotesActionButton
                  icon="note_add"
                  label="New Note"
                  onClick={() => setModalType("note")}
                />
              </div>
            )}
          />

          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading">
              <div>
                <h3>Folders</h3>
                <p>Organize notes by lectures, labs, weeks, or revision sets.</p>
              </div>
            </div>
            <div className="folder-vault-grid modules-vault-grid">
              {selectedWorkspace.folders.map((folder) => (
                <FolderVaultCard
                  key={folder.id}
                  folder={folder}
                  kicker="FOLDER"
                />
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
                </article>
              ))}
            </div>
          </div>
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
            backAction={(
              <NotesActionButton
                className="back-button"
                icon="chevron_left"
                label="Back"
                onClick={goToNotesHome}
              />
            )}
            action={(
              <NotesActionButton
                icon="create_new_folder"
                label="New Module"
                onClick={() => setModalType("module")}
              />
            )}
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
          <NotesBreadcrumb
            items={[
              { label: "My Notes" },
            ]}
          />

          <NotesSectionHeader
            title="My Notes"
            description="Your personal knowledge base"
            action={(
              <NotesActionButton
                icon="create_new_folder"
                label="New Semester"
                onClick={() => setModalType("semester")}
              />
            )}
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
        <FolderCreateModal
          type="semester"
          values={semesterForm}
          onChange={updateSemesterForm}
          onClose={closeModal}
          onSubmit={handleCreateSemester}
        />
      )}

      {modalType === "module" && (
        <FolderCreateModal
          type="module"
          values={moduleForm}
          onChange={updateModuleForm}
          onClose={closeModal}
          onSubmit={handleCreateModule}
        />
      )}

      {modalType === "folder" && (
        <FolderCreateModal
          type="folder"
          values={folderForm}
          onChange={updateFolderForm}
          onClose={closeModal}
          onSubmit={handleCreateFolder}
        />
      )}

      {modalType === "note" && (
        <NoteCreateModal
          values={noteForm}
          onChange={updateNoteForm}
          onClose={closeModal}
          onSubmit={handleCreateNote}
        />
      )}
    </main>
  );
}

export default NotePage;
