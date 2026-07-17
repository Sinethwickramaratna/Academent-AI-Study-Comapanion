import { useEffect, useMemo, useRef, useState } from 'react';
import FolderCreateModal from '../components/FolderCreateModal';
import FolderVaultCard from '../components/FolderVaultCard';
import NoteCreateModal from '../components/NoteCreateModal';
import NoteViewModal from '../components/NoteViewModal';
import PdfViewModal from '../components/PdfViewModal';
import NotesActionButton from '../components/NotesActionButton';
import LoadingEffect from '../components/LoadingEffect';
import NotesBreadcrumb from '../components/NotesBreadcrumb';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import { findFolderById } from '../Services/noteManagementUtils';
import { uploadPdfToCloudinary } from '../Services/pdfUploadService';
import { createPdfUploadFailureNotification } from '../Services/notificationService';
import { logErrorEvent } from '../Services/loggingService';
import { useNotificationToasts } from '../components/notifications/NotificationToastProvider';
import useNoteManagement from '../Services/useNoteManagement';
import './notepage.css';

const EMPTY_SEMESTER_FORM = { title: '', subtitle: '', accent: 'cyan' };
const EMPTY_MODULE_FORM = { moduleId: '', title: '', subtitle: '', accent: 'cyan' };
const EMPTY_FOLDER_FORM = { title: '', subtitle: '', accent: 'cyan' };
const EMPTY_NOTE_FORM = { title: '', content: '' };
const NOTES_OPEN_REQUEST_STORAGE_KEY = 'academent_notes_open_request';

const isHexAccent = (accent) => /^#[0-9a-f]{6}$/i.test(accent || '');
const toAccentColor = (accent) => {
  if (!accent) return 'Cyan';
  return isHexAccent(accent) ? accent : `${accent.charAt(0).toUpperCase()}${accent.slice(1)}`;
};
const toUiAccent = (accentColor) => (accentColor || 'Cyan').toLowerCase();

const countWorkspaceFiles = (workspace) => {
  if (!workspace) return 0;

  return [
    ...(workspace.pdfs || []),
    ...(workspace.notes || []),
    ...(workspace.folders || []).flatMap((folder) => Array(countWorkspaceFiles(folder)).fill(null)),
  ].length;
};

const normalizeSearchTerm = (value) => String(value || '').trim().toLowerCase();

const hasSearchMatch = (term, ...values) => !term || values
  .flat(Infinity)
  .some((value) => String(value || '').toLowerCase().includes(term));

const noteMatchesSearch = (note, term) => hasSearchMatch(term, note?.title, note?.content, note?.noteId);
const pdfMatchesSearch = (pdf, term) => hasSearchMatch(term, pdf?.title, pdf?.originalName, pdf?.url, pdf?.extractedText, pdf?.pdfId);
const folderOwnMatchesSearch = (folder, term) => hasSearchMatch(term, folder?.title, folder?.subtitle, folder?.folderId);
const folderMatchesSearch = (folder, term) => !term
  || folderOwnMatchesSearch(folder, term)
  || (folder?.notes || []).some((note) => noteMatchesSearch(note, term))
  || (folder?.pdfs || []).some((pdf) => pdfMatchesSearch(pdf, term))
  || (folder?.folders || []).some((child) => folderMatchesSearch(child, term));
const moduleOwnMatchesSearch = (module, term) => hasSearchMatch(term, module?.title, module?.subtitle, module?.moduleId);
const moduleMatchesSearch = (module, term) => !term
  || moduleOwnMatchesSearch(module, term)
  || (module?.notes || []).some((note) => noteMatchesSearch(note, term))
  || (module?.pdfs || []).some((pdf) => pdfMatchesSearch(pdf, term))
  || (module?.folders || []).some((folder) => folderMatchesSearch(folder, term));
const semesterOwnMatchesSearch = (semester, term) => hasSearchMatch(term, semester?.title, semester?.subtitle, semester?.semesterId);
const semesterMatchesSearch = (semester, term) => !term
  || semesterOwnMatchesSearch(semester, term)
  || (semester?.modules || []).some((module) => moduleMatchesSearch(module, term));

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

const findMaterialInWorkspace = (workspace, type, id, trail = []) => {
  const items = type === 'pdf' ? (workspace?.pdfs || []) : (workspace?.notes || []);
  const match = items.find((item) => (type === 'pdf' ? item.pdfId : item.noteId) === id);
  if (match) return { item: match, trail };

  for (const folder of workspace?.folders || []) {
    const found = findMaterialInWorkspace(folder, type, id, [...trail, folder]);
    if (found) return found;
  }

  return null;
};

function NotePage({ profile, currentUser }) {
  const notes = useNoteManagement();
  const { addToast } = useNotificationToasts();
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeFolderTrail, setActiveFolderTrail] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [semesterForm, setSemesterForm] = useState(EMPTY_SEMESTER_FORM);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [folderForm, setFolderForm] = useState(EMPTY_FOLDER_FORM);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pdfInputRef = useRef(null);

  const semesters = useMemo(() => notes.data.semesters || [], [notes.data.semesters]);
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
  const normalizedSearch = normalizeSearchTerm(searchQuery);
  const hasSearch = Boolean(normalizedSearch);
  const searchLabel = searchQuery.trim();
  const activeWorkspaceOwnMatches = hasSearch && (
    (isSemesterWorkspace && semesterOwnMatchesSearch(selectedSemester, normalizedSearch))
    || (isModuleWorkspace && moduleOwnMatchesSearch(selectedModule, normalizedSearch))
    || (isFolderWorkspace && folderOwnMatchesSearch(currentFolder, normalizedSearch))
  );
  const visibleSemesters = hasSearch ? semesters.filter((semester) => semesterMatchesSearch(semester, normalizedSearch)) : semesters;
  const visibleModules = !hasSearch || semesterOwnMatchesSearch(selectedSemester, normalizedSearch)
    ? selectedModules
    : selectedModules.filter((module) => moduleMatchesSearch(module, normalizedSearch));
  const visibleFolders = !hasSearch || activeWorkspaceOwnMatches
    ? (selectedWorkspace.folders || [])
    : (selectedWorkspace.folders || []).filter((folder) => folderMatchesSearch(folder, normalizedSearch));
  const visiblePdfs = !hasSearch || activeWorkspaceOwnMatches
    ? (selectedWorkspace.pdfs || [])
    : (selectedWorkspace.pdfs || []).filter((pdf) => pdfMatchesSearch(pdf, normalizedSearch));
  const visibleNotes = !hasSearch || activeWorkspaceOwnMatches
    ? (selectedWorkspace.notes || [])
    : (selectedWorkspace.notes || []).filter((note) => noteMatchesSearch(note, normalizedSearch));

  useEffect(() => {
    if (notes.loading || typeof window === 'undefined') return;

    const rawRequest = window.sessionStorage.getItem(NOTES_OPEN_REQUEST_STORAGE_KEY);
    if (!rawRequest) return;

    let request = null;
    try {
      request = JSON.parse(rawRequest);
    } catch (error) {
      console.warn('Could not read dashboard material open request:', error);
      window.sessionStorage.removeItem(NOTES_OPEN_REQUEST_STORAGE_KEY);
      return;
    }

    if (!request?.id || !['note', 'pdf'].includes(request.type)) {
      window.sessionStorage.removeItem(NOTES_OPEN_REQUEST_STORAGE_KEY);
      return;
    }

    const targetSemester = semesters.find((semester) => semester.semesterId === request.semesterId)
      || semesters.find((semester) => (semester.modules || []).some((module) => module.moduleId === request.moduleId));
    const targetModule = (targetSemester?.modules || []).find((module) => module.moduleId === request.moduleId);
    const foundMaterial = targetModule ? findMaterialInWorkspace(targetModule, request.type, request.id) : null;
    window.sessionStorage.removeItem(NOTES_OPEN_REQUEST_STORAGE_KEY);

    if (!targetSemester || !targetModule || !foundMaterial) return;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setActiveSemester(targetSemester.semesterId);
      setActiveModuleId(targetModule.moduleId);
      setActiveFolderTrail(foundMaterial.trail);
      setSearchQuery('');
      setViewingNote(request.type === 'note' ? foundMaterial.item : null);
      setViewingPdf(request.type === 'pdf' ? foundMaterial.item : null);
    });

    return () => { cancelled = true; };
  }, [notes.loading, semesters]);

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
    setSemesterForm({ title: semester.title, subtitle: semester.subtitle || '', accent: toUiAccent(semester.accentColor) });
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
    setModuleForm({ moduleId: module.moduleId, title: module.title, subtitle: module.subtitle || '', accent: toUiAccent(module.accentColor) });
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

    try {
      await notes.addSemester({
        title: semesterForm.title.trim(),
        subtitle: semesterForm.subtitle.trim(),
        accentColor: toAccentColor(semesterForm.accent),
      });
      closeModal();
    } catch (error) {
      console.error("Unable to create semester:", error);
    }
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
    setFolderForm({ title: folder.title, subtitle: folder.subtitle || '', accent: toUiAccent(folder.accentColor) });
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
    if (!files.length) return;

    setIsUploadingPdf(true);
    setUploadError(null);

    let failedFileName = files[0]?.name || 'Selected PDF';

    try {
      for (const file of files) {
        failedFileName = file.name;
        const uploadedPdf = await uploadPdfToCloudinary(file);
        await notes.addPdf(activeSemester, activeModuleId, currentFolderId, {
          title: uploadedPdf.title,
          url: uploadedPdf.url,
          publicId: uploadedPdf.publicId,
          extractedText: uploadedPdf.extractedText,
          size: uploadedPdf.size,
          storageProvider: uploadedPdf.storageProvider,
          fileType: uploadedPdf.fileType,
        });
      }
      addToast({ type: 'success', message: files.length === 1 ? 'PDF uploaded successfully.' : `${files.length} PDFs uploaded successfully.` });
    } catch (error) {
      console.error('Unable to upload PDF:', error);
      logErrorEvent(error, {
        action: 'PDF upload failed',
        failedFileName,
        fileCount: files.length,
        message: error.message || 'PDF upload failed.',
        moduleId: activeModuleId,
        semesterId: activeSemester,
        service: 'Notes',
      });
      setUploadError(error.message || 'PDF upload failed');
      addToast({ type: 'error', message: error.message || 'PDF upload failed.' });
      if (currentUser?.uid) {
        await createPdfUploadFailureNotification(currentUser.uid, failedFileName, {
          error: error.message || 'PDF upload failed',
          idempotencyKey: globalThis.crypto?.randomUUID?.() || `${failedFileName}-upload`,
        }).catch((notificationError) => {
          console.warn('PDF upload failure notification could not be created:', notificationError);
        });
      }
    } finally {
      setIsUploadingPdf(false);
      event.target.value = '';
    }
  };


  const openPdf = (pdf) => {
    if (!pdf?.url) return;
    setViewingPdf(pdf);
  };
  const removePdf = async (pdfId) => {
    if (!activeSemester || !activeModuleId) return;
    await notes.deletePdf(activeSemester, activeModuleId, pdfId);
  };

  const openFolder = (folder) => setActiveFolderTrail((current) => [...current, folder]);

  const renderEmptyState = ({ icon, title, description, action }) => (
    <div className="notes-empty-state">
      <span className="notes-empty-state__icon material-symbols-outlined">{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
  const renderSearchEmptyState = (label) => renderEmptyState({
    icon: 'search_off',
    title: `No matching ${label}`,
    description: `No results found for "${searchLabel}" in this workspace.`,
    action: <NotesActionButton icon="close" label="Clear Search" onClick={() => setSearchQuery('')} />,
  });
  const renderWorkspaceActions = () => (
    <div className="notes-header-actions">
      {isSemesterWorkspace ? (
        <NotesActionButton icon="create_new_folder" label="New Module" onClick={() => setModalType('module')} />
      ) : (
        <>
          <NotesActionButton icon="create_new_folder" label="New Folder" onClick={() => setModalType('folder')} />
          <NotesActionButton icon={isUploadingPdf ? "sync" : "upload_file"} label={isUploadingPdf ? "Extracting PDF..." : "Upload PDF"} onClick={() => !isUploadingPdf && pdfInputRef.current?.click()} />
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
          {visibleModules.length ? (
            <div className="folder-vault-grid modules-vault-grid">
              {visibleModules.map((module, index) => {
                const moduleCard = mapModuleForCard(module, index);
                return <FolderVaultCard key={module.moduleId} folder={moduleCard} kicker={module.moduleId} onClick={() => setActiveModuleId(module.moduleId)} onEdit={() => openEditModule(module)} onDelete={() => removeModule(module)} />;
              })}
            </div>
          ) : hasSearch ? renderSearchEmptyState('modules') : renderEmptyState({
            icon: "view_module",
            title: "No modules yet",
            description: "Create your first module to start organizing notes for this semester.",
            action: <NotesActionButton icon="add" label="New Module" onClick={() => setModalType('module')} />,
          })}
        </div>
      )}

      {!isSemesterWorkspace && (
        <>
          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>Folders</h3><p>Create nested folders for lectures, labs, weeks, or revision sets.</p></div></div>
            {visibleFolders.length ? (
              <div className="folder-vault-grid modules-vault-grid">
                {visibleFolders.map((folder, index) => {
                  const folderCard = mapFolderForCard(folder, index);
                  return <FolderVaultCard key={folder.folderId} folder={folderCard} kicker="FOLDER" onClick={() => openFolder(folder)} onEdit={() => openEditFolder(folder)} onDelete={() => removeFolder(folder)} />;
                })}
              </div>
            ) : hasSearch ? renderSearchEmptyState('folders') : renderEmptyState({
              icon: "folder",
              title: "No folders yet",
              description: "Create a folder when you want to group lectures, labs, weeks, or revision sets.",
              action: <NotesActionButton icon="create_new_folder" label="New Folder" onClick={() => setModalType('folder')} />,
            })}
          </div>

          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>PDFs</h3><p>Upload lecture slides, readings, handouts, and scanned materials.</p></div></div>
            {visiblePdfs.length ? (
              <div className="module-file-grid">
                {visiblePdfs.map((pdf) => (
                  <article key={pdf.pdfId} className="module-pdf-card module-pdf-card--clickable" role="button" tabIndex={0} onClick={() => openPdf(pdf)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openPdf(pdf); }}>
                    <div className="module-pdf-card__icon"><span className="material-symbols-outlined">picture_as_pdf</span></div>
                    <div className="module-pdf-card__content"><h4>{pdf.title}</h4><p>{pdf.url}</p></div>
                    <div className="file-card-menu" onClick={(event) => event.stopPropagation()}>
                      <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${pdf.title}`}><span className="material-symbols-outlined">more_horiz</span></button>
                      <div className="file-card-menu__content">
                        <a href={pdf.url} target="_blank" rel="noreferrer"><span className="material-symbols-outlined">open_in_new</span>Open Original</a>
                        <button className="file-card-menu__danger" type="button" onClick={() => removePdf(pdf.pdfId)}><span className="material-symbols-outlined">delete</span>Remove</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : hasSearch ? renderSearchEmptyState('PDFs') : renderEmptyState({
              icon: "picture_as_pdf",
              title: "No PDFs uploaded",
              description: "Upload lecture slides, readings, or handouts to keep them beside your notes.",
              action: <NotesActionButton icon="upload_file" label="Upload PDF" onClick={() => pdfInputRef.current?.click()} />,
            })}
          </div>

          <div className="module-workspace-panel">
            <div className="module-workspace-panel__heading"><div><h3>Notes</h3><p>Capture quick summaries, formulas, reminders, and study prompts.</p></div></div>
            {visibleNotes.length ? (
              <div className="module-note-grid">
                {visibleNotes.map((note) => (
                  <article key={note.noteId} className="module-note-card module-note-card--clickable" role="button" tabIndex={0} onClick={() => setViewingNote(note)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setViewingNote(note); }}>
                    <div className="module-note-card__icon"><span className="material-symbols-outlined">description</span></div>
                    <div className="module-note-card__content"><h4>{note.title}</h4><p>{note.content}</p></div>
                    <div className="file-card-menu" onClick={(event) => event.stopPropagation()}>
                      <button className="file-card-menu__trigger" type="button" aria-label={`Actions for ${note.title}`}><span className="material-symbols-outlined">more_horiz</span></button>
                      <div className="file-card-menu__content">
                        <button type="button" onClick={() => editNote(note)}><span className="material-symbols-outlined">edit</span>Edit</button>
                        <button className="file-card-menu__danger" type="button" onClick={() => removeNote(note.noteId)}><span className="material-symbols-outlined">delete</span>Remove</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : hasSearch ? renderSearchEmptyState('notes') : renderEmptyState({
              icon: "note_add",
              title: "No notes yet",
              description: "Create a note for summaries, formulas, reminders, or study prompts.",
              action: <NotesActionButton icon="note_add" label="New Note" onClick={() => setModalType('note')} />,
            })}
          </div>
        </>
      )}
    </>
  );
  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl notes-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search your knowledge base..." searchValue={searchQuery} onSearchChange={setSearchQuery} />
      {notes.loading && (
        <LoadingEffect
          icon="folder_open"
          title="Loading notes"
          message="Opening your semesters, modules, notes, and PDFs."
        />
      )}
      {notes.error && <p>{notes.error.message}</p>}
      {uploadError && <p>{uploadError}</p>}
      {isUploadingPdf && !notes.loading && (
        <LoadingEffect
          icon="picture_as_pdf"
          title="Uploading and extracting PDF"
          message="Reading the PDF text, extracting knowledge, and saving it to your quiz knowledge base."
        />
      )}

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
          {visibleSemesters.length ? (
            <div className="folder-vault-grid">
              {visibleSemesters.map((semester, index) => {
                const semesterCard = mapSemesterForCard(semester, index);
                return <FolderVaultCard key={semester.semesterId} folder={semesterCard} kicker={`S${(index + 1).toString().padStart(2, '0')} NODE`} onClick={() => setActiveSemester(semester.semesterId)} onEdit={() => openEditSemester(semester)} onDelete={() => removeSemester(semester)} />;
              })}
            </div>
          ) : hasSearch ? renderSearchEmptyState('semesters') : renderEmptyState({
            icon: "auto_stories",
            title: "Your notes space is ready",
            description: "Create a semester to begin building your study vault.",
          })}
        </section>
      ))}

      {modalType === 'semester' && <FolderCreateModal type="semester" values={semesterForm} onChange={updateSemesterForm} onClose={closeModal} onSubmit={handleCreateSemester} />}
      {modalType === 'editSemester' && <FolderCreateModal type="semester" mode="edit" values={semesterForm} onChange={updateSemesterForm} onClose={closeModal} onSubmit={handleEditSemester} />}
      {modalType === 'module' && <FolderCreateModal type="module" values={moduleForm} onChange={updateModuleForm} onClose={closeModal} onSubmit={handleCreateModule} />}
      {modalType === 'editModule' && <FolderCreateModal type="module" mode="edit" values={moduleForm} onChange={updateModuleForm} onClose={closeModal} onSubmit={handleEditModule} />}
      {modalType === 'folder' && <FolderCreateModal type="folder" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleCreateFolder} />}
      {modalType === 'editFolder' && <FolderCreateModal type="folder" mode="edit" values={folderForm} onChange={updateFolderForm} onClose={closeModal} onSubmit={handleEditFolder} />}
      {modalType === 'note' && <NoteCreateModal values={noteForm} onChange={updateNoteForm} onClose={closeModal} onSubmit={handleCreateNote} />}
      {viewingNote && <NoteViewModal note={viewingNote} onClose={() => setViewingNote(null)} onEdit={(note) => { setViewingNote(null); editNote(note); }} />}
      {viewingPdf && <PdfViewModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />}
    </main>
  );
}

export default NotePage;




