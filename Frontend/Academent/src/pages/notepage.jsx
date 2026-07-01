import { useRef, useState } from 'react';
import FolderCreateModal from '../components/FolderCreateModal';
import FolderVaultCard from '../components/FolderVaultCard';
import NoteCreateModal from '../components/NoteCreateModal';
import NotesActionButton from '../components/NotesActionButton';
import NotesBreadcrumb from '../components/NotesBreadcrumb';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import { findFolderById } from '../Services/noteManagementUtils';
import useNoteManagement from '../Services/useNoteManagement';
import './notepage.css';

const EMPTY_SEMESTER_FORM = { title: '', subtitle: '', accent: 'cyan' };
const EMPTY_MODULE_FORM = { moduleId: '', title: '', subtitle: '', accent: 'cyan' };
const EMPTY_FOLDER_FORM = { title: '', subtitle: '', accent: 'cyan' };
const EMPTY_NOTE_FORM = { title: '', content: '' };

const toAccentColor = (accent) => accent ? `${accent.charAt(0).toUpperCase()}${accent.slice(1)}` : 'Cyan';
const toUiAccent = (accentColor) => (accentColor || 'Cyan').toLowerCase();

const countWorkspaceFiles = (workspace) => {
  if (!workspace) return 0;

  return [
    ...(workspace.pdfs || []),
    ...(workspace.notes || []),
    ...(workspace.folders || []).flatMap((folder) => Array(countWorkspaceFiles(folder)).fill(null)),
  ].length;
};

const mapSemesterForCard = (semester, index = 0) => ({
  ...semester,
  id: semester.semesterId,
  files: countWorkspaceFiles({ folders: (semester.modules || []).flatMap((module) => module.folders || []), pdfs: [], notes: [] })
    + (semester.modules || []).reduce((total, module) => total + (module.pdfs || []).length + (module.notes || []).length, 0),
  progress: Math.min(100, 35 + ((index + 1) * 9)),
  accent: toUiAccent(semester.accentColor),
  icon: 'auto_stories',
});

const mapModuleForCard = (module, index = 0) => ({
  ...module,
  id: module.moduleId,
  files: countWorkspaceFiles(module),
  progress: Math.min(100, 40 + ((index + 1) * 8)),
  accent: toUiAccent(module.accentColor),
  icon: 'topic',
});

const mapFolderForCard = (folder, index = 0) => ({
  ...folder,
  id: folder.folderId,
  workspaceKey: folder.folderId,
  files: countWorkspaceFiles(folder),
  progress: Math.min(100, 45 + ((index + 1) * 7)),
  accent: toUiAccent(folder.accentColor),
  icon: 'folder_special',
});

function NotePage({ profile, currentUser }) {
  const notes = useNoteManagement();
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeFolderTrail, setActiveFolderTrail] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [semesterForm, setSemesterForm] = useState(EMPTY_SEMESTER_FORM);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [folderForm, setFolderForm] = useState(EMPTY_FOLDER_FORM);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const pdfInputRef = useRef(null);

  const semesters = notes.data.semesters || [];
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const selectedSemester = semesters.find((semester) => semester.semesterId === activeSemester);
  const selectedModules = selectedSemester?.modules || [];
  const selectedModule = selectedModules.find((module) => module.moduleId === activeModuleId);
  const currentFolderId = activeFolderTrail.at(-1)?.folderId || null;
  const currentFolder = currentFolderId && selectedModule ? findFolderById(selectedModule.folders || [], currentFolderId) : null;
  const selectedWorkspace = currentFolder || selectedModule || { folders: [], notes: [], pdfs: [] };
  const isSemesterWorkspace = Boolean(activeSemester && !activeModuleId && !currentFolderId);
  const isModuleWorkspace = Boolean(activeModuleId && !currentFolderId);
  const isFolderWorkspace = activeFolderTrail.length > 0;
  const currentWorkspaceTitle = currentFolder?.title || selectedModule?.title || selectedSemester?.title || 'My Notes';

  const closeModal = () => {
    setModalType(null);
    setSemesterForm(EMPTY_SEMESTER_FORM);
    setModuleForm(EMPTY_MODULE_FORM);
    setFolderForm(EMPTY_FOLDER_FORM);
    setNoteForm(EMPTY_NOTE_FORM);
    setEditingFolder(null);
    setEditingSemester(null);
    setEditingModule(null);
  };

  const goToNotesHome = () => {
    setActiveSemester(null);
    setActiveModuleId(null);
    setActiveFolderTrail([]);
  };

  const goToSemesterRoot = () => {
    setActiveModuleId(null);
    setActiveFolderTrail([]);
  };

  const goToModuleRoot = () => setActiveFolderTrail([]);
  const goToFolderTrailIndex = (index) => setActiveFolderTrail((current) => current.slice(0, index + 1));
  const updateSemesterForm = (field, value) => setSemesterForm((current) => ({ ...current, [field]: value }));
  const updateModuleForm = (field, value) => setModuleForm((current) => ({ ...current, [field]: value }));
  const updateFolderForm = (field, value) => setFolderForm((current) => ({ ...current, [field]: value }));
  const updateNoteForm = (field, value) => setNoteForm((current) => ({ ...current, [field]: value }));

  const openEditSemester = (semester) => {
    setEditingSemester(semester);
    setSemesterForm({ title: semester.title, subtitle: semester.subtitle, accent: toUiAccent(semester.accentColor) });
    setModalType('editSemester');
  };

  const handleEditSemester = async (event) => {
    event.preventDefault();
    if (!editingSemester) return;

    await notes.updateSemester(editingSemester.semesterId, {
      title: semesterForm.title.trim(),
      subtitle: semesterForm.subtitle.trim(),
      accentColor: toAccentColor(semesterForm.accent),
    });
    closeModal();
  };

  const removeSemester = async (semesterToRemove) => {
    await notes.deleteSemester(semesterToRemove.semesterId);
    if (activeSemester === semesterToRemove.semesterId) goToNotesHome();
  };

  const openEditModule = (module) => {
    setEditingModule(module);
    setModuleForm({ moduleId: module.moduleId, title: module.title, subtitle: module.subtitle, accent: toUiAccent(module.accentColor) });
    setModalType('editModule');
  };

  const handleEditModule = async (event) => {
    event.preventDefault();
    if (!editingModule || !activeSemester) return;

    await notes.updateModule(activeSemester, editingModule.moduleId, {
      title: moduleForm.title.trim(),
      subtitle: moduleForm.subtitle.trim(),
      accentColor: toAccentColor(moduleForm.accent),
    });
    closeModal();
  };

  const removeModule = async (moduleToRemove) => {
    if (!activeSemester) return;

    await notes.deleteModule(activeSemester, moduleToRemove.moduleId);
    if (activeModuleId === moduleToRemove.moduleId) goToSemesterRoot();
  };

  const handleCreateSemester = async (event) => {
    event.preventDefault();

    await notes.addSemester({
      title: semesterForm.title.trim(),
      subtitle: semesterForm.subtitle.trim(),
      accentColor: toAccentColor(semesterForm.accent),
    });
    closeModal();
  };

  const handleCreateModule = async (event) => {
    event.preventDefault();
    if (!activeSemester) return;

    await notes.addModule(activeSemester, {
      moduleId: moduleForm.moduleId.trim().toUpperCase(),
      title: moduleForm.title.trim(),
      subtitle: moduleForm.subtitle.trim(),
      accentColor: toAccentColor(moduleForm.accent || 'violet'),
    });
    closeModal();
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!activeSemester || !activeModuleId) return;

    await notes.addFolder(activeSemester, activeModuleId, currentFolderId, {
      title: folderForm.title.trim(),
      subtitle: folderForm.subtitle.trim(),
      accentColor: toAccentColor(folderForm.accent || 'emerald'),
    });
    closeModal();
  };

  const openEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({ title: folder.title, subtitle: folder.subtitle, accent: toUiAccent(folder.accentColor) });
    setModalType('editFolder');
  };

  const handleEditFolder = async (event) => {
    event.preventDefault();
    if (!editingFolder || !activeSemester || !activeModuleId) return;

    const updatedFolder = {
      title: folderForm.title.trim(),
      subtitle: folderForm.subtitle.trim(),
      accentColor: toAccentColor(folderForm.accent),
    };

    await notes.updateFolder(activeSemester, activeModuleId, editingFolder.folderId, updatedFolder);
    setActiveFolderTrail((current) => current.map((folder) => (
      folder.folderId === editingFolder.folderId ? { ...folder, ...updatedFolder } : folder
    )));
    closeModal();
  };

  const removeFolder = async (folderToRemove) => {
    if (!activeSemester || !activeModuleId) return;
    await notes.deleteFolder(activeSemester, activeModuleId, folderToRemove.folderId);
  };

  const removeCurrentFolder = async () => {
    if (!currentFolder || !activeSemester || !activeModuleId) return;

    await notes.deleteFolder(activeSemester, activeModuleId, currentFolder.folderId);
    setActiveFolderTrail((current) => current.slice(0, -1));
  };

  const handleCreateNote = async (event) => {
    event.preventDefault();
    if (!activeSemester || !activeModuleId) return;

    await notes.addNote(activeSemester, activeModuleId, currentFolderId, {
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
    });
    closeModal();
  };

  const editNote = async (noteToEdit) => {
    if (!activeSemester || !activeModuleId) return;

    const title = window.prompt('Note title', noteToEdit.title);
    if (title === null) return;
    const content = window.prompt('Note content', noteToEdit.content);
    if (content === null) return;

    await notes.updateNote(activeSemester, activeModuleId, noteToEdit.noteId, {
      title: title.trim(),
      content: content.trim(),
    });
  };

  const removeNote = async (noteId) => {
    if (!activeSemester || !activeModuleId) return;
    await notes.deleteNote(activeSemester, activeModuleId, noteId);
  };

  const handleUploadPdfs = async (event) => {
    if (!activeSemester || !activeModuleId) return;

    const files = Array.from(event.target.files || []).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    for (const file of files) {
      const url = window.prompt(`Cloudinary URL for ${file.name}`);
      if (url) {
        await notes.addPdf(activeSemester, activeModuleId, currentFolderId, {
          title: file.name,
          url: url.trim(),
        });
      }
    }
    event.target.value = '';
  };

  const removePdf = async (pdfId) => {
    if (!activeSemester || !activeModuleId) return;
    await notes.deletePdf(activeSemester, activeModuleId, pdfId);
  };

  const openFolder = (folder) => setActiveFolderTrail((current) => [...current, folder]);

  const renderWorkspaceActions = () => (
    <div className="notes-header-actions">
      {isSemesterWorkspace ? (
        <NotesActionButton icon="create_new_folder" label="New Module" onClick={() => setModalType('module')} />
      ) : (
        <>
          <NotesActionButton icon="create_new_folder" label="New Folder" onClick={() => setModalType('folder')} />
          <NotesActionButton icon="upload_file" label="Upload PDF" onClick={() => pdfInputRef.current?.click()} />
          <NotesActionButton icon="note_add" label="New Note" onClick={() => setModalType('note')} />
        </>
      )}
      {(isSemesterWorkspace || isModuleWorkspace || isFolderWorkspace) && (
        <div className="workspace-actions-menu">
          <button className="workspace-actions-menu__trigger" type="button">
            <span className="material-symbols-outlined">more_horiz</span>
            Actions
          </button>
          <div className="workspace-actions-menu__content">
            {isSemesterWorkspace && selectedSemester && (
              <>
                <button type="button" onClick={() => openEditSemester(selectedSemester)}><span className="material-symbols-outlined">edit</span>Edit Semester</button>
                <button className="workspace-actions-menu__danger" type="button" onClick={() => removeSemester(selectedSemester)}><span className="material-symbols-outlined">delete</span>Remove Semester</button>
              </>
            )}
            {isModuleWorkspace && selectedModule && (
              <>
                <button type="button" onClick={() => openEditModule(selectedModule)}><span className="material-symbols-outlined">edit</span>Edit Module</button>
                <button className="workspace-actions-menu__danger" type="button" onClick={() => removeModule(selectedModule)}><span className="material-symbols-outlined">delete</span>Remove Module</button>
              </>
            )}
            {isFolderWorkspace && currentFolder && (
              <>
                <button type="button" onClick={() => openEditFolder(currentFolder)}><span className="material-symbols-outlined">edit</span>Edit Folder</button>
                <button className="workspace-actions-menu__danger" type="button" onClick={removeCurrentFolder}><span className="material-symbols-outlined">delete</span>Remove Folder</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderWorkspace = () => (
    <>
      {!isSemesterWorkspace && (
        <input ref={pdfInputRef} className="module-pdf-input" type="file" accept="application/pdf,.pdf" multiple onChange={handleUploadPdfs} />
      )}

      {isSemesterWorkspace && (
        <div className="module-workspace-panel">
          <div className="module-workspace-panel__heading"><div><h3>Modules</h3><p>Open a module or manage it from the dropdown menu.</p></div></div>
          <div className="folder-vault-grid modules-vault-grid">
            {selectedModules.map((module, index) => {
              const moduleCard = mapModuleForCard(module, index);
              return <FolderVaultCard key={module.moduleId} folder={moduleCard} kicker={module.moduleId} onClick={() => setActiveModuleId(module.moduleId)} onEdit={() => openEditModule(module)} onDelete={() => removeModule(module)} />;
            })}
          </div>
        </div>
      )}

      {!isSemesterWorkspace && (
        <>
          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>Folders</h3><p>Create nested folders for lectures, labs, weeks, or revision sets.</p></div></div>
            <div className="folder-vault-grid modules-vault-grid">
              {(selectedWorkspace.folders || []).map((folder, index) => {
                const folderCard = mapFolderForCard(folder, index);
                return <FolderVaultCard key={folder.folderId} folder={folderCard} kicker="FOLDER" onClick={() => openFolder(folder)} onEdit={() => openEditFolder(folder)} onDelete={() => removeFolder(folder)} />;
              })}
            </div>
          </div>

          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>PDFs</h3><p>Upload lecture slides, readings, handouts, and scanned materials.</p></div></div>
            <div className="module-file-grid">
              {(selectedWorkspace.pdfs || []).map((pdf) => (
                <article key={pdf.pdfId} className="module-pdf-card">
                  <div className="module-pdf-card__icon"><span className="material-symbols-outlined">picture_as_pdf</span></div>
                  <div className="module-pdf-card__content"><h4>{pdf.title}</h4><p>{pdf.url}</p></div>
                  <div className="file-card-menu">
                    <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${pdf.title}`}><span className="material-symbols-outlined">more_horiz</span></button>
                    <div className="file-card-menu__content">
                      <a href={pdf.url} target="_blank" rel="noreferrer"><span className="material-symbols-outlined">open_in_new</span>Open</a>
                      <button className="file-card-menu__danger" type="button" onClick={() => removePdf(pdf.pdfId)}><span className="material-symbols-outlined">delete</span>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>Notes</h3><p>Capture quick summaries, formulas, reminders, and study prompts.</p></div></div>
            <div className="module-note-grid">
              {(selectedWorkspace.notes || []).map((note) => (
                <article key={note.noteId} className="module-note-card">
                  <div className="module-note-card__icon"><span className="material-symbols-outlined">description</span></div>
                  <div><h4>{note.title}</h4><p>{note.content}</p></div>
                  <div className="file-card-menu">
                    <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${note.title}`}><span className="material-symbols-outlined">more_horiz</span></button>
                    <div className="file-card-menu__content">
                      <button type="button" onClick={() => editNote(note)}><span className="material-symbols-outlined">edit</span>Edit</button>
                      <button className="file-card-menu__danger" type="button" onClick={() => removeNote(note.noteId)}><span className="material-symbols-outlined">delete</span>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl notes-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search your knowledge base..." />
      {notes.loading && <p>Loading notes...</p>}
      {notes.error && <p>{notes.error.message}</p>}

      {!notes.loading && (activeSemester ? (
        <section>
          <NotesBreadcrumb
            items={[
              { label: 'My Notes', onClick: goToNotesHome },
              { label: selectedSemester?.title || 'Semester', active: isSemesterWorkspace, onClick: isSemesterWorkspace ? undefined : goToSemesterRoot },
              ...(activeModuleId ? [{ label: selectedModule?.title || activeModuleId, active: isModuleWorkspace, onClick: isModuleWorkspace ? undefined : goToModuleRoot }] : []),
              ...activeFolderTrail.map((folder, index) => ({
                label: findFolderById(selectedModule?.folders || [], folder.folderId)?.title || folder.title,
                active: index === activeFolderTrail.length - 1,
                onClick: index === activeFolderTrail.length - 1 ? undefined : () => goToFolderTrailIndex(index),
              })),
            ]}
          />

          <NotesSectionHeader
            title={currentWorkspaceTitle}
            description={isSemesterWorkspace ? 'Semester workspace for modules' : isModuleWorkspace ? 'Module workspace for folders, PDFs, and notes' : 'Folder workspace for nested folders, PDFs, and notes'}
            backAction={<NotesActionButton className="back-button" icon="chevron_left" label="Back" onClick={isSemesterWorkspace ? goToNotesHome : isModuleWorkspace ? goToSemesterRoot : () => setActiveFolderTrail((current) => current.slice(0, -1))} />}
            action={renderWorkspaceActions()}
          />

          {renderWorkspace()}
        </section>
      ) : (
        <section>
          <NotesBreadcrumb items={[{ label: 'My Notes' }]} />
          <NotesSectionHeader title="My Notes" description="Your personal knowledge base" action={<NotesActionButton icon="create_new_folder" label="New Semester" onClick={() => setModalType('semester')} />} />
          <div className="folder-vault-grid">
            {semesters.map((semester, index) => {
              const semesterCard = mapSemesterForCard(semester, index);
              return <FolderVaultCard key={semester.semesterId} folder={semesterCard} kicker={`S${(index + 1).toString().padStart(2, '0')} NODE`} onClick={() => setActiveSemester(semester.semesterId)} onEdit={() => openEditSemester(semester)} onDelete={() => removeSemester(semester)} />;
            })}
          </div>
        </section>
      ))}

      {modalType === 'semester' && <FolderCreateModal type="semester" values={semesterForm} onChange={updateSemesterForm} onClose={closeModal} onSubmit={handleCreateSemester} />}
      {modalType === 'editSemester' && <FolderCreateModal type="semester" mode="edit" values={semesterForm} onChange={updateSemesterForm} onClose={closeModal} onSubmit={handleEditSemester} />}
      {modalType === 'module' && <FolderCreateModal type="module" values={moduleForm} onChange={updateModuleForm} onClose={closeModal} onSubmit={handleCreateModule} />}
      {modalType === 'editModule' && <FolderCreateModal type="module" mode="edit" values={moduleForm} onChange={updateModuleForm} onClose={closeModal} onSubmit={handleEditModule} />}
      {modalType === 'folder' && <FolderCreateModal type="folder" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleCreateFolder} />}
      {modalType === 'editFolder' && <FolderCreateModal type="folder" mode="edit" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleEditFolder} />}
      {modalType === 'note' && <NoteCreateModal values={noteForm} onChange={updateNoteForm} onClose={closeModal} onSubmit={handleCreateNote} />}
    </main>
  );
}

export default NotePage;
