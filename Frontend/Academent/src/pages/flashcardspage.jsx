import { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import useNoteManagement from '../Services/useNoteManagement';
import { FlashCardProvider, useFlashCards } from '../context/FlashCardContext';
import { toDate } from '../Services/flashCardService';
import './flashcardspage.css';

const cardTypes = [
  { label: 'Definition', value: 'definition' }, { label: 'Concept', value: 'concept' },
  { label: 'Formula', value: 'formula' }, { label: 'True/False', value: 'true_false' },
  { label: 'Fill in the Blank', value: 'fill_blank' }, { label: 'Process', value: 'process' },
  { label: 'Diagram-based', value: 'diagram' }, { label: 'Q&A', value: 'qa' },
];
const preferenceToggles = [
  { label: 'Include Examples', key: 'includeExamples' }, { label: 'Include Mnemonics', key: 'includeMnemonics' },
  { label: 'Include Images', key: 'includeImages' }, { label: 'Avoid Duplicates', key: 'avoidDuplicates' },
  { label: 'Adaptive Difficulty', key: 'adaptiveDifficulty' },
];
const colors = ['#24b47e', '#4D2B8C', '#85409D', '#EEA727', '#2f7dd3', '#b32652'];
const defaultPreferences = { cardCount: 35, difficulty: 'mixed', cardTypes: ['definition', 'concept', 'formula', 'qa'], includeExamples: true, includeMnemonics: false, includeImages: false, avoidDuplicates: true, adaptiveDifficulty: true };
const PAGE_SIZE = 6;

function ProgressRing({ value, size = 54, color = '#4D2B8C' }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * normalized) / 100;
  return <span className="flash-ring" style={{ width: size, height: size }}><svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={radius} /><circle cx={size / 2} cy={size / 2} r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }} /></svg><strong>{normalized}%</strong></span>;
}

function MiniChart({ values = [] }) {
  const nextValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  return <div className="flash-mini-chart" aria-hidden="true">{nextValues.slice(-7).map((height, index) => <span key={index} style={{ height: `${Math.max(8, Number(height || 0))}%` }} />)}</div>;
}

const formatDate = (value, fallback = 'Never') => {
  const date = toDate(value);
  if (!date) return fallback;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString([], { month: 'short', day: '2-digit' });
};
const formatDueDate = (value) => {
  const date = toDate(value);
  if (!date) return 'Today';
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: '2-digit' });
};
const formatBytes = (bytes = 0) => {
  const value = Number(bytes || 0);
  if (!value) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};
const labelCase = (value) => String(value || 'mixed').replace(/^./, (char) => char.toUpperCase());
const typeLabel = (value) => cardTypes.find((type) => type.value === value)?.label || 'Q&A';
const matches = (text, search) => String(text || '').toLowerCase().includes(search.toLowerCase());

function StudyMaterialTree({ semesters, selectedIds, expandedIds, search, onToggleExpanded, onToggleSelected }) {
  const hasSearch = Boolean(search.trim());
  const renderMaterial = (item, path) => {
    const material = { id: `${item.type}-${item.id}`, sourceId: item.id, type: item.type, title: item.title, path, icon: item.type === 'pdf' ? 'picture_as_pdf' : 'description' };
    const preview = item.type === 'note' ? String(item.content || '').slice(0, 180) : '';
    const meta = item.type === 'pdf' ? [formatBytes(item.size), item.pageCount ? `${item.pageCount} pages` : ''].filter(Boolean).join(' - ') : preview || 'Note preview unavailable';
    if (hasSearch && !matches(`${material.title} ${path} ${meta}`, search)) return null;
    return <label key={material.id} className="flash-tree-item flash-tree-file" title={item.type === 'note' ? meta : undefined}><input checked={selectedIds.includes(material.id)} type="checkbox" onChange={() => onToggleSelected(material)} /><span className="material-symbols-outlined">{material.icon}</span><span>{material.title}<small>{meta}</small></span></label>;
  };
  const renderFolder = (folder, path) => {
    const folderId = `folder-${folder.folderId}`;
    const folderPath = `${path} / ${folder.title}`;
    const isOpen = expandedIds.includes(folderId) || hasSearch;
    const folderMaterial = { id: folderId, sourceId: folder.folderId, type: 'folder', title: folder.title, path, icon: 'folder' };
    const children = [...(folder.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, folderPath)), ...(folder.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, folderPath)), ...(folder.folders || []).map((child) => renderFolder(child, folderPath))].filter(Boolean);
    if (hasSearch && !matches(folder.title, search) && !children.length) return null;
    return <div key={folderId} className="flash-tree-branch"><div className="flash-tree-row"><button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(folderId)}><span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span></button><label className="flash-tree-item"><input checked={selectedIds.includes(folderId)} type="checkbox" onChange={() => onToggleSelected(folderMaterial)} /><span className="material-symbols-outlined">folder</span><span>{folder.title}</span></label></div>{isOpen && <div className="flash-tree-children">{children}</div>}</div>;
  };
  if (!semesters.length) return <div className="flash-tree-empty"><span className="material-symbols-outlined">source_environment</span><p>Create semesters, modules, notes, or PDFs in My Notes to generate flash cards from your own material.</p></div>;
  return <div className="flash-tree">{semesters.map((semester) => {
    const semesterId = `semester-${semester.semesterId}`;
    const semesterOpen = expandedIds.includes(semesterId) || hasSearch;
    const semesterMaterial = { id: semesterId, sourceId: semester.semesterId, type: 'semester', title: semester.title, path: 'Academent', icon: 'auto_stories' };
    const modules = (semester.modules || []).map((module) => {
      const moduleId = `module-${module.moduleId}`;
      const moduleOpen = expandedIds.includes(moduleId) || hasSearch;
      const moduleTitle = module.title || module.moduleId;
      const modulePath = `${semester.title} / ${moduleTitle}`;
      const moduleMaterial = { id: moduleId, sourceId: module.moduleId, type: 'module', title: moduleTitle, path: semester.title, icon: 'topic' };
      const children = [...(module.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, modulePath)), ...(module.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, modulePath)), ...(module.folders || []).map((folder) => renderFolder(folder, modulePath))].filter(Boolean);
      if (hasSearch && !matches(moduleTitle, search) && !children.length) return null;
      return <div key={moduleId} className="flash-tree-branch"><div className="flash-tree-row"><button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(moduleId)}><span className="material-symbols-outlined">{moduleOpen ? 'expand_more' : 'chevron_right'}</span></button><label className="flash-tree-item"><input checked={selectedIds.includes(moduleId)} type="checkbox" onChange={() => onToggleSelected(moduleMaterial)} /><span className="material-symbols-outlined">topic</span><span>{moduleTitle}</span></label></div>{moduleOpen && <div className="flash-tree-children">{children}</div>}</div>;
    }).filter(Boolean);
    if (hasSearch && !matches(semester.title, search) && !modules.length) return null;
    return <div key={semesterId} className="flash-tree-branch"><div className="flash-tree-row flash-tree-root"><button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(semesterId)}><span className="material-symbols-outlined">{semesterOpen ? 'expand_more' : 'chevron_right'}</span></button><label className="flash-tree-item"><input checked={selectedIds.includes(semesterId)} type="checkbox" onChange={() => onToggleSelected(semesterMaterial)} /><span className="material-symbols-outlined">auto_stories</span><span>{semester.title}</span></label></div>{semesterOpen && <div className="flash-tree-children">{modules}</div>}</div>;
  })}</div>;
}

function GeneratorModal({ uid, semesters, noteManagement, working, error, onClose, onGenerate }) {
  const storageKey = uid ? `academent.flashcards.generator.${uid}` : 'academent.flashcards.generator.guest';
  const savedState = useMemo(() => { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; } }, [storageKey]);
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState(savedState.selectedItems || []);
  const [expandedIds, setExpandedIds] = useState(() => savedState.expandedIds || [semesters[0] && `semester-${semesters[0].semesterId}`, semesters[0]?.modules?.[0] && `module-${semesters[0].modules[0].moduleId}`].filter(Boolean));
  const [preferences, setPreferences] = useState({ ...defaultPreferences, ...(savedState.preferences || {}) });
  const [search, setSearch] = useState('');
  const selectedIds = selectedItems.map((item) => item.id);
  const toggleExpanded = (id) => setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleSelected = (item) => setSelectedItems((current) => current.some((selected) => selected.id === item.id) ? current.filter((selected) => selected.id !== item.id) : [...current, item]);
  const toggleType = (type) => setPreferences((current) => ({ ...current, cardTypes: current.cardTypes.includes(type) ? current.cardTypes.filter((item) => item !== type) : [...current.cardTypes, type] }));
  const togglePreference = (key) => setPreferences((current) => ({ ...current, [key]: !current[key] }));
  const submit = async () => {
    localStorage.setItem(storageKey, JSON.stringify({ selectedItems, expandedIds, preferences }));
    await onGenerate({ selectedItems, preferences, noteManagement });
  };
  return <div className="flash-modal-backdrop"><section className="flash-generator-modal" role="dialog" aria-modal="true" aria-labelledby="flash-generator-title">
    <header className="flash-modal-header"><div><p>AI flash card generator</p><h3 id="flash-generator-title">Create Flash Cards</h3><span>Step {step} of 3</span></div><button className="flash-icon-button" type="button" onClick={onClose} aria-label="Close generator"><span className="material-symbols-outlined">close</span></button></header>
    <div className="flash-stepper" aria-label="Generator progress">{[1, 2, 3].map((item) => <span key={item} className={step >= item ? 'is-active' : ''} />)}</div>
    <div className="flash-generator-body">
      {error && <div className="flash-error-banner"><span className="material-symbols-outlined">error</span>{error.message || String(error)}</div>}
      {step === 1 && <section className="flash-generator-grid"><div className="flash-generator-panel flash-tree-panel"><div className="flash-panel-heading"><h4>Choose Study Material</h4><p>Select semesters, modules, folders, PDFs, and notes from Notes Management.</p></div><label className="flash-search-field"><span className="material-symbols-outlined">search</span><input value={search} placeholder="Search tree" onChange={(event) => setSearch(event.target.value)} /></label><StudyMaterialTree semesters={semesters} selectedIds={selectedIds} expandedIds={expandedIds} search={search} onToggleExpanded={toggleExpanded} onToggleSelected={toggleSelected} /></div><aside className="flash-generator-panel"><div className="flash-panel-heading"><h4>Selected Sources</h4><p>{selectedItems.length} hierarchy selections remembered for generation</p></div><div className="flash-selected-sources">{selectedItems.length ? selectedItems.map((item) => <div key={item.id}><span className="material-symbols-outlined">{item.icon}</span><div><strong>{item.title}</strong><small>{item.path}</small></div></div>) : <p>Select at least one source to build grounded flash cards.</p>}</div></aside></section>}
      {step === 2 && <section className="flash-generator-panel"><div className="flash-panel-heading"><h4>Flash Card Preferences</h4><p>Tune the amount, depth, and card format.</p></div><div className="flash-preference-grid"><label className="flash-range-field"><span>Number of cards</span><input min="1" max="100" type="number" value={preferences.cardCount} onChange={(event) => setPreferences((current) => ({ ...current, cardCount: Number(event.target.value) }))} /><strong>{preferences.cardCount || 35}</strong></label><fieldset className="flash-segmented"><legend>Difficulty</legend>{['easy', 'medium', 'hard', 'mixed'].map((level) => <label key={level}><input checked={preferences.difficulty === level} type="radio" name="flashDifficulty" onChange={() => setPreferences((current) => ({ ...current, difficulty: level }))} /><span>{labelCase(level)}</span></label>)}</fieldset></div><div className="flash-choice-grid">{cardTypes.map((type) => <button key={type.value} type="button" className={preferences.cardTypes.includes(type.value) ? 'is-selected' : ''} onClick={() => toggleType(type.value)}><span className="material-symbols-outlined">{preferences.cardTypes.includes(type.value) ? 'check_circle' : 'radio_button_unchecked'}</span>{type.label}</button>)}</div><div className="flash-toggle-list">{preferenceToggles.map((toggle) => <label key={toggle.key}><input checked={Boolean(preferences[toggle.key])} type="checkbox" onChange={() => togglePreference(toggle.key)} /><span>{toggle.label}</span></label>)}</div></section>}
      {step === 3 && <section className="flash-generator-grid"><div className="flash-generator-panel"><div className="flash-panel-heading"><h4>Generation Preview</h4><p>Academent will extract, rank, generate, validate, dedupe, and save.</p></div><div className="flash-preview-metrics"><div><span>Requested cards</span><strong>{preferences.cardCount}</strong></div><div><span>Sources selected</span><strong>{selectedItems.length}</strong></div><div><span>Difficulty</span><strong>{labelCase(preferences.difficulty)}</strong></div></div><div className="flash-coverage"><div><span style={{ width: `${Math.min(100, preferences.cardTypes.length * 12)}%` }} /></div><p>{preferences.cardTypes.map(typeLabel).join(', ')} cards with selected options respected by the generation pipeline.</p></div></div><aside className="flash-generator-panel"><div className="flash-panel-heading"><h4>Generation Pipeline</h4><p>Only academic, meaningful concepts are used.</p></div><div className="flash-topic-cloud">{['Knowledge extraction', 'Concept ranking', 'Deduplication', 'SM-2 scheduling', 'Analytics refresh', 'Firestore save'].map((topic) => <span key={topic}>{topic}</span>)}</div></aside></section>}
    </div>
    <footer className="flash-modal-actions"><button className="flash-button flash-button--ghost" type="button" disabled={working} onClick={step === 1 ? onClose : () => setStep((current) => current - 1)}>{step === 1 ? 'Cancel' : 'Previous'}</button><button className="flash-button flash-button--primary" type="button" disabled={step === 3 ? (!selectedItems.length || !preferences.cardTypes.length || working) : (step === 1 && !selectedItems.length)} onClick={step === 3 ? submit : () => setStep((current) => current + 1)}><span className="material-symbols-outlined">{working ? 'hourglass_top' : step === 3 ? 'auto_awesome' : 'arrow_forward'}</span>{working ? 'Generating...' : step === 3 ? 'Generate Flash Cards' : 'Continue'}</button></footer>
  </section></div>;
}

function CardEditorModal({ card, onClose }) {
  return <div className="flash-modal-backdrop"><section className="flash-editor-modal" role="dialog" aria-modal="true" aria-labelledby="flash-editor-title"><header className="flash-modal-header"><div><p>Card details</p><h3 id="flash-editor-title">Flash Card</h3></div><button className="flash-icon-button" type="button" onClick={onClose}><span className="material-symbols-outlined">close</span></button></header><div className="flash-editor-body"><label><span>Front</span><textarea readOnly value={card?.front || ''} /></label><label><span>Back</span><textarea readOnly value={card?.back || ''} /></label><label><span>Type</span><input readOnly value={typeLabel(card?.type)} /></label><label><span>Difficulty</span><input readOnly value={labelCase(card?.difficulty)} /></label><label><span>Example</span><textarea readOnly value={card?.example || ''} /></label><label><span>Mnemonic</span><textarea readOnly value={card?.mnemonic || ''} /></label><label><span>Image Description</span><textarea readOnly value={card?.imageDescription || ''} /></label><div className="flash-rich-editor"><p>{card?.explanation || 'No additional explanation was generated for this card.'}</p></div></div><footer className="flash-modal-actions"><button className="flash-button flash-button--primary" type="button" onClick={onClose}>Done</button></footer></section></div>;
}

function StudyMode({ collection, cards, onExit, onReview }) {
  const dueCards = useMemo(() => {
    const now = new Date();
    const due = cards.filter((card) => !toDate(card.nextReview) || toDate(card.nextReview) <= now);
    return due.length ? due : cards;
  }, [cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const activeCard = dueCards[index];
  const progress = dueCards.length ? Math.round(((index + 1) / dueCards.length) * 100) : 0;
  useEffect(() => { const handleKeyDown = (event) => { if (event.code === 'Space') { event.preventDefault(); setFlipped((current) => !current); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);
  const goTo = (nextIndex, event) => { setIndex(Math.min(Math.max(nextIndex, 0), dueCards.length - 1)); setFlipped(false); setCardStartedAt(event?.timeStamp || 0); };
  const rateCard = async (rating, event) => { if (!activeCard) return; const duration = cardStartedAt ? Math.max(0, event.timeStamp - cardStartedAt) : 0; await onReview(activeCard, rating, duration); if (index < dueCards.length - 1) goTo(index + 1, event); else onExit(); };
  if (!activeCard) return <main className="flash-study-mode"><section className="flash-empty-state"><h3>No cards ready</h3><p>This collection does not have loaded cards yet.</p><button className="flash-button flash-button--primary" type="button" onClick={onExit}>Back to Flash Cards</button></section></main>;
  return <main className="flash-study-mode"><header className="flash-study-topbar"><button className="flash-button flash-button--ghost" type="button" onClick={onExit}><span className="material-symbols-outlined">close</span>Exit Study</button><div className="flash-study-progress"><div><strong>Card {index + 1} of {dueCards.length}</strong><span>{collection.analytics?.currentStreak || 0} day streak - {collection.analytics?.dueToday || 0} due today</span></div><div className="flash-progress-track"><span style={{ width: `${progress}%` }} /></div></div><button className="flash-icon-button" type="button" onClick={() => setAiOpen((current) => !current)}><span className="material-symbols-outlined">right_panel_open</span></button></header><section className={aiOpen ? 'flash-study-layout' : 'flash-study-layout flash-study-layout--wide'}><div className="flash-study-center"><p className="flash-eyebrow">{collection.title} / {labelCase(activeCard.difficulty)}</p><article className={flipped ? 'flash-study-card is-flipped' : 'flash-study-card'}><div className="flash-study-card-inner"><section className="flash-study-face flash-study-face--front" aria-hidden={flipped}><span className="material-symbols-outlined">style</span><p>{typeLabel(activeCard.type)}</p><h1>{activeCard.front}</h1>{activeCard.imageDescription && <div className="flash-card-placeholder"><span className="material-symbols-outlined">insert_chart</span>{activeCard.imageDescription}</div>}<button className="flash-button flash-button--primary flash-flip-button" type="button" disabled={flipped} onClick={() => setFlipped(true)}><span className="material-symbols-outlined">flip</span>Flip</button><small>Space = Flip</small></section><section className="flash-study-face flash-study-face--back" aria-hidden={!flipped}><span className="material-symbols-outlined">task_alt</span><p>Answer</p><h2>{activeCard.back}</h2><div className="flash-answer-grid"><div><strong>Explanation</strong><span>{activeCard.explanation || activeCard.back}</span></div><div><strong>Example</strong><span>{activeCard.example || 'No example generated for this card.'}</span></div><div><strong>Mnemonic</strong><span>{activeCard.mnemonic || 'No mnemonic generated for this card.'}</span></div></div><div className="flash-rating"><p>How well did you know this?</p>{['Again', 'Hard', 'Good', 'Easy'].map((rating) => <button key={rating} className={`flash-rating-${rating.toLowerCase()}`} type="button" disabled={!flipped} onClick={(event) => rateCard(rating, event)}>{rating}</button>)}</div></section></div></article><footer className="flash-study-controls"><button className="flash-button flash-button--ghost" type="button" disabled={index === 0} onClick={(event) => goTo(index - 1, event)}><span className="material-symbols-outlined">chevron_left</span>Previous</button><button className="flash-button flash-button--ghost" type="button" onClick={() => setFlipped((current) => !current)}><span className="material-symbols-outlined">flip</span>Flip</button><button className="flash-button flash-button--primary" type="button" disabled={index === dueCards.length - 1} onClick={(event) => goTo(index + 1, event)}>Next<span className="material-symbols-outlined">chevron_right</span></button></footer></div>{aiOpen && <aside className="flash-ai-panel"><div className="flash-panel-heading"><h3>AI Context</h3><p>Generated card details and learning cues.</p></div><div className="flash-ai-actions">{[activeCard.explanation, activeCard.example, activeCard.mnemonic, ...(activeCard.keywords || [])].filter(Boolean).slice(0, 8).map((action) => <button key={action} type="button">{action}</button>)}</div></aside>}</section></main>;
}

const aggregateAnalytics = (collections) => {
  const totals = collections.reduce((sum, collection) => {
    const analytics = collection.analytics || {};
    return {
      totalFlashCards: sum.totalFlashCards + Number(analytics.totalFlashCards || collection.cardCount || 0),
      masteredCards: sum.masteredCards + Number(analytics.masteredCards || 0),
      learningCards: sum.learningCards + Number(analytics.learningCards || 0),
      todaysReviews: sum.todaysReviews + Number(analytics.todaysReviews || 0),
      currentStreak: Math.max(sum.currentStreak, Number(analytics.currentStreak || 0)),
      weeklyProgress: sum.weeklyProgress + Number(analytics.weeklyProgress || 0),
      retentionRate: sum.retentionRate + Number(analytics.retentionRate || 0),
      averageRecallScore: sum.averageRecallScore + Number(analytics.averageRecallScore || 0),
      dueToday: sum.dueToday + Number(analytics.dueToday || 0),
    };
  }, { totalFlashCards: 0, masteredCards: 0, learningCards: 0, todaysReviews: 0, currentStreak: 0, weeklyProgress: 0, retentionRate: 0, averageRecallScore: 0, dueToday: 0 });
  const count = collections.length || 1;
  return { ...totals, weeklyProgress: Math.round(totals.weeklyProgress / count), retentionRate: Math.round(totals.retentionRate / count), averageRecallScore: Math.round(totals.averageRecallScore / count) };
};

function FlashCardsWorkspace({ profile, currentUser }) {
  const notes = useNoteManagement();
  const flash = useFlashCards();
  const loadCards = flash.loadCards;
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [studyCollection, setStudyCollection] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [editorCard, setEditorCard] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const activeCollection = flash.collections.find((collection) => collection.id === activeCollectionId) || flash.collections[0] || null;
  const cardsForCollection = useMemo(() => (activeCollection ? (flash.cardsByCollection[activeCollection.id] || []) : []), [activeCollection, flash.cardsByCollection]);

  useEffect(() => { if (activeCollection?.id) loadCards(activeCollection.id).catch(() => {}); }, [activeCollection?.id, loadCards]);

  const filteredCollections = useMemo(() => {
    const sorted = [...flash.collections].sort((left, right) => {
      if (sort === 'title') return String(left.title || '').localeCompare(String(right.title || ''));
      if (sort === 'progress') return Number(right.analytics?.completionPercentage || 0) - Number(left.analytics?.completionPercentage || 0);
      if (sort === 'cards') return Number(right.cardCount || right.analytics?.totalFlashCards || 0) - Number(left.cardCount || left.analytics?.totalFlashCards || 0);
      return (toDate(right.createdAt)?.getTime() || 0) - (toDate(left.createdAt)?.getTime() || 0);
    });
    return sorted.filter((collection) => {
      const text = `${collection.title || ''} ${collection.description || ''} ${(collection.selectedSources || []).map((source) => source.title).join(' ')}`;
      if (search && !matches(text, search)) return false;
      if (filter === 'due') return Number(collection.analytics?.dueToday || 0) > 0 || Number(collection.analytics?.overdueCards || 0) > 0;
      if (filter === 'mastered') return Number(collection.analytics?.completionPercentage || 0) >= 80;
      if (filter === 'learning') return Number(collection.analytics?.learningCards || 0) > 0;
      return true;
    });
  }, [flash.collections, filter, search, sort]);

  const pagedCollections = filteredCollections.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / PAGE_SIZE));
  const analytics = useMemo(() => aggregateAnalytics(flash.collections), [flash.collections]);
  const kpis = [
    { label: 'Total Flash Cards', value: analytics.totalFlashCards, delta: `${flash.collections.length} collections`, icon: 'style', progress: Math.min(100, analytics.totalFlashCards) },
    { label: 'Mastered Cards', value: analytics.masteredCards, delta: `${analytics.learningCards} learning`, icon: 'verified', progress: analytics.totalFlashCards ? Math.round((analytics.masteredCards / analytics.totalFlashCards) * 100) : 0 },
    { label: 'Learning Cards', value: analytics.learningCards, delta: `${analytics.dueToday} due`, icon: 'school', progress: analytics.totalFlashCards ? Math.round((analytics.learningCards / analytics.totalFlashCards) * 100) : 0 },
    { label: "Today's Reviews", value: analytics.todaysReviews, delta: `${analytics.dueToday} due`, icon: 'event_repeat', progress: Math.min(100, analytics.todaysReviews * 10) },
    { label: 'Current Streak', value: `${analytics.currentStreak}d`, delta: 'from reviews', icon: 'local_fire_department', progress: Math.min(100, analytics.currentStreak * 8) },
    { label: 'Weekly Progress', value: `${analytics.weeklyProgress}%`, delta: '7-day activity', icon: 'monitoring', progress: analytics.weeklyProgress },
    { label: 'Retention Rate', value: `${analytics.retentionRate}%`, delta: 'good/easy recall', icon: 'psychology_alt', progress: analytics.retentionRate },
    { label: 'Average Recall Score', value: analytics.averageRecallScore, delta: 'review score', icon: 'speed', progress: analytics.averageRecallScore },
  ];

  const reviewGroups = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const groups = { Today: [], Tomorrow: [], 'This Week': [], Overdue: [] };
    cardsForCollection.forEach((card) => {
      const due = toDate(card.nextReview);
      if (!due) groups.Today.push(card);
      else if (due < todayStart) groups.Overdue.push(card);
      else if (due < todayEnd) groups.Today.push(card);
      else if (due < tomorrowEnd) groups.Tomorrow.push(card);
      else if (due < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)) groups['This Week'].push(card);
    });
    return Object.entries(groups).map(([label, items]) => ({ label, count: items.length, items: items.slice(0, 3).map((card) => card.front), urgent: label === 'Today' || label === 'Overdue' }));
  }, [cardsForCollection]);

  const startStudy = async (collection) => {
    const cards = await flash.loadCards(collection.id, { force: !flash.cardsByCollection[collection.id] });
    if (cards.length) setStudyCollection(collection);
  };
  const handleGenerate = async (payload) => {
    setIsGeneratorOpen(false);
    setIsGeneratingCards(true);

    try {
      const created = await flash.generateCollection(payload);
      setActiveCollectionId(created.id);
    } finally {
      setIsGeneratingCards(false);
    }
  };
  const removeCollection = async (collectionId) => { if (!window.confirm('Delete this flash card collection and all cards?')) return; await flash.removeCollection(collectionId); if (activeCollectionId === collectionId) setActiveCollectionId(null); };

  if (studyCollection) {
    const studyCards = flash.cardsByCollection[studyCollection.id] || [];
    return <StudyMode collection={studyCollection} cards={studyCards} onExit={() => setStudyCollection(null)} onReview={(card, rating, duration) => flash.reviewCard(studyCollection.id, card, rating, duration)} />;
  }

  return <main className="p-gutter md:p-margin-desktop space-y-xl flash-page">
    <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search flash cards, concepts, or tags..." />
    <section className="flash-header"><div><p className="flash-eyebrow">Dedicated study environment</p><h2>Flash Cards</h2><p>Generate, review, and master AI flash cards from your notes and PDFs.</p></div><div className="flash-header-actions"><label className="flash-search-field"><span className="material-symbols-outlined">search</span><input value={search} placeholder="Search flash cards" onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><select className="flash-select-control" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}><option value="all">All</option><option value="due">Due</option><option value="learning">Learning</option><option value="mastered">Mastered</option></select><select className="flash-select-control" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="recent">Recent</option><option value="title">Title</option><option value="progress">Progress</option><option value="cards">Cards</option></select><button className="flash-button flash-button--primary" type="button" onClick={() => setIsGeneratorOpen(true)}><span className="material-symbols-outlined">auto_awesome</span>Create Flash Cards</button></div></section>
    {(flash.error || notes.error) && <div className="flash-error-banner"><span className="material-symbols-outlined">error</span>{flash.error?.message || notes.error?.message}</div>}

    <section className="flash-kpi-grid" aria-label="Flash card statistics">{kpis.map((kpi) => <article key={kpi.label} className="flash-kpi-card"><div><span className="material-symbols-outlined">{kpi.icon}</span><p>{kpi.label}</p><h3>{kpi.value}</h3><small>{kpi.delta}</small></div><ProgressRing value={kpi.progress} size={48} color={kpi.progress > 80 ? '#24b47e' : '#4D2B8C'} /><MiniChart values={[kpi.progress, analytics.weeklyProgress, analytics.retentionRate, analytics.averageRecallScore]} /></article>)}</section>
    <div className="flash-workspace-grid"><div className="flash-main-column"><section><div className="flash-section-heading"><div><h3>Flash Card Collections</h3><p>{filteredCollections.length} collections from notes, PDFs, and generated cards.</p></div><span>{analytics.dueToday} cards due today</span></div>{flash.loading ? <div className="flash-skeleton-panel"><span /><span /><span /></div> : pagedCollections.length ? <><div className="flash-collection-grid">{pagedCollections.map((collection, index) => { const color = colors[index % colors.length]; const progress = Number(collection.analytics?.completionPercentage || 0); return <article key={collection.id} className={activeCollection?.id === collection.id ? 'flash-collection-card is-active' : 'flash-collection-card'} onClick={() => { setActiveCollectionId(collection.id); setPage(1); }}><div className="flash-collection-top"><span className="flash-collection-icon material-symbols-outlined" style={{ color }}>style</span><ProgressRing value={progress} size={58} color={color} /></div><h4>{collection.title}</h4><p>{collection.analytics?.totalFlashCards || collection.cardCount || 0} cards - Last studied {formatDate(collection.analytics?.lastStudyDate, 'Never')}</p><div className="flash-collection-meta"><span>{labelCase(collection.preferences?.difficulty)}</span><span><span className="material-symbols-outlined">schedule</span>{collection.analytics?.averageReviewTime || 0}s avg</span></div><div className="flash-collection-progress"><div><span>Progress</span><strong>{progress}%</strong></div><div className="flash-progress-track"><span style={{ width: `${progress}%` }} /></div></div><div className="flash-card-hover-actions" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => startStudy(collection)}>Study</button><button type="button" onClick={() => removeCollection(collection.id)}>Delete</button><button type="button" onClick={() => flash.duplicateCollection(collection)}>Duplicate</button></div></article>; })}</div><div className="flash-pagination"><button className="flash-button flash-button--ghost" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="flash-button flash-button--ghost" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></> : <section className="flash-empty-state"><div className="flash-empty-illustration"><span className="material-symbols-outlined">style</span><span className="material-symbols-outlined">auto_awesome</span><span className="material-symbols-outlined">school</span></div><h3>No Flash Card Collections Yet</h3><p>Generate AI-powered flash cards from your notes or PDFs.</p><div><button className="flash-button flash-button--primary" type="button" onClick={() => setIsGeneratorOpen(true)}>Generate Flash Cards</button></div></section>}</section>
    {activeCollection && <section className="flash-list-section"><div className="flash-section-heading"><div><h3>{activeCollection.title} Cards</h3><p>Review status, mastery, and spaced repetition signals.</p></div><button className="flash-button flash-button--primary" type="button" disabled={!cardsForCollection.length} onClick={() => startStudy(activeCollection)}><span className="material-symbols-outlined">play_arrow</span>Study</button></div><div className="flash-card-list">{cardsForCollection.length ? cardsForCollection.map((card) => { const mastery = Math.max(0, Math.min(100, Number(card.masteryLevel || 0))); return <article key={card.id} className="flash-card-row" onDoubleClick={(event) => { if (!event.target.closest('button')) setEditorCard(card); }} title="Double-click to view card details"><button className="flash-pin" type="button"><span className="material-symbols-outlined">style</span></button><div className="flash-card-front"><strong>{card.front}</strong><small>{(card.sourceTitles || activeCollection.selectedSources?.map((source) => source.title) || []).join(', ')}</small><div>{(card.tags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></div><span className={`flash-difficulty flash-difficulty--${card.difficulty}`}>{labelCase(card.difficulty)}</span><span className="flash-ai-badge"><span className="material-symbols-outlined">auto_awesome</span>{card.createdBy || 'AI'}</span><div className="flash-review-status"><strong>{formatDueDate(card.nextReview)}</strong><small>Last reviewed {formatDate(card.lastReviewed, 'never')}</small></div><div className="flash-srs-grid"><span>Next Review <strong>{formatDueDate(card.nextReview)}</strong></span><span>Interval <strong>{card.interval || 0}d</strong></span><span>Ease <strong>{Number(card.easeFactor || 2.5).toFixed(2)}</strong></span><span>Reviews <strong>{card.reviewCount || 0}</strong></span><span>Mastery <strong>{card.masteryLevel || 0}%</strong></span><span>Type <strong>{typeLabel(card.type)}</strong></span></div><div className="flash-card-mastery" style={{ '--mastery': `${mastery}%` }}><div><span>Progress</span><strong>{mastery}%</strong></div><div><span /></div></div><div className="flash-row-actions"><button type="button" onClick={() => startStudy(activeCollection)}><span className="material-symbols-outlined">play_arrow</span></button><button type="button" onClick={() => setEditorCard(card)}><span className="material-symbols-outlined">visibility</span></button></div></article>; }) : <div className="flash-tree-empty"><p>Cards are lazy-loading for this collection.</p></div>}</div></section>}</div>
    <aside className="flash-review-panel"><div className="flash-panel-heading"><h3>Review Calendar</h3><p>Upcoming spaced repetition reviews for the selected collection.</p></div>{reviewGroups.map((group) => <article key={group.label} className={group.urgent ? 'flash-review-group is-urgent' : 'flash-review-group'}><div><strong>{group.label}</strong><span>{group.count} cards</span></div><ul>{group.items.length ? group.items.map((item) => <li key={item}>{item}</li>) : <li>No cards scheduled</li>}</ul></article>)}{isGeneratingCards && <div className="flash-generation-banner" role="status" aria-live="polite" aria-busy="true"><span className="material-symbols-outlined">auto_awesome</span><div><strong>Generating new flash cards</strong><small>Using your selected study materials and saving the collection automatically.</small></div><div className="flash-generation-dots" aria-hidden="true"><span /><span /><span /></div></div>}</aside></div>
    {isGeneratorOpen && <GeneratorModal uid={flash.uid} semesters={notes.data.semesters || []} noteManagement={notes.data} working={flash.working} error={flash.error} onClose={() => setIsGeneratorOpen(false)} onGenerate={handleGenerate} />}
    {editorCard && <CardEditorModal card={editorCard} onClose={() => setEditorCard(null)} />}
  </main>;
}

function FlashCardsPage(props) {
  return <FlashCardProvider><FlashCardsWorkspace {...props} /></FlashCardProvider>;
}

export default FlashCardsPage;
