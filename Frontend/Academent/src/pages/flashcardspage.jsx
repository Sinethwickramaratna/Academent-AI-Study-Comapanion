import { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import useNoteManagement from '../Services/useNoteManagement';
import './flashcardspage.css';

const collectionsSeed = [
  {
    id: 'biology',
    icon: 'biotech',
    name: 'Biology',
    cards: 35,
    lastStudied: 'Today, 8:40 AM',
    progress: 78,
    difficulty: 'Mixed',
    studyTime: '18 min',
    color: '#24b47e',
  },
  {
    id: 'database',
    icon: 'database',
    name: 'Database Systems',
    cards: 42,
    lastStudied: 'Yesterday',
    progress: 64,
    difficulty: 'Medium',
    studyTime: '24 min',
    color: '#4D2B8C',
  },
  {
    id: 'software',
    icon: 'integration_instructions',
    name: 'Software Engineering',
    cards: 28,
    lastStudied: 'Jul 03',
    progress: 52,
    difficulty: 'Easy',
    studyTime: '14 min',
    color: '#85409D',
  },
  {
    id: 'algorithms',
    icon: 'hub',
    name: 'Algorithms',
    cards: 31,
    lastStudied: 'Jun 30',
    progress: 41,
    difficulty: 'Hard',
    studyTime: '22 min',
    color: '#EEA727',
  },
  {
    id: 'mathematics',
    icon: 'functions',
    name: 'Mathematics',
    cards: 56,
    lastStudied: 'Jun 29',
    progress: 83,
    difficulty: 'Mixed',
    studyTime: '30 min',
    color: '#2f7dd3',
  },
];

const flashCardsSeed = [
  {
    id: 'bio-1',
    front: 'What is the role of mitochondria in cellular respiration?',
    back: 'Mitochondria generate ATP by oxidizing glucose-derived molecules through the Krebs cycle and oxidative phosphorylation.',
    difficulty: 'Medium',
    tags: ['Cell Biology', 'ATP'],
    createdFrom: 'Biology Lecture 04.pdf',
    reviewStatus: 'Due today',
    lastReviewed: '2h ago',
    mastery: 82,
    pinned: true,
    nextReview: 'Today, 6:00 PM',
    interval: '2 days',
    ease: '2.6',
    retention: '91%',
    stage: 'Review',
  },
  {
    id: 'bio-2',
    front: 'Define normalization in relational database design.',
    back: 'Normalization organizes data to reduce redundancy and dependency issues, commonly through normal forms such as 1NF, 2NF, and 3NF.',
    difficulty: 'Hard',
    tags: ['DBMS', 'Schema'],
    createdFrom: 'Database Systems Notes',
    reviewStatus: 'Learning',
    lastReviewed: 'Yesterday',
    mastery: 48,
    pinned: false,
    nextReview: 'Tomorrow',
    interval: '1 day',
    ease: '2.1',
    retention: '74%',
    stage: 'Learning',
  },
  {
    id: 'bio-3',
    front: 'What does Big O notation describe?',
    back: 'Big O expresses how an algorithm scales as input size grows, focusing on upper-bound time or space complexity.',
    difficulty: 'Easy',
    tags: ['Algorithms', 'Complexity'],
    createdFrom: 'Algorithms Week 02',
    reviewStatus: 'Mastered',
    lastReviewed: 'Jul 02',
    mastery: 94,
    pinned: false,
    nextReview: 'Jul 09',
    interval: '7 days',
    ease: '3.0',
    retention: '96%',
    stage: 'Mastered',
  },
];

const kpis = [
  { label: 'Total Flash Cards', value: '192', delta: '+18', icon: 'style', progress: 76 },
  { label: 'Mastered Cards', value: '118', delta: '+9', icon: 'verified', progress: 61 },
  { label: 'Learning Cards', value: '47', delta: '-6', icon: 'school', progress: 44 },
  { label: "Today's Reviews", value: '23', delta: '8 due', icon: 'event_repeat', progress: 82 },
  { label: 'Current Streak', value: '12d', delta: '+2d', icon: 'local_fire_department', progress: 88 },
  { label: 'Weekly Progress', value: '74%', delta: '+11%', icon: 'monitoring', progress: 74 },
  { label: 'Retention Rate', value: '91%', delta: '+4%', icon: 'psychology_alt', progress: 91 },
  { label: 'Average Recall Score', value: '86', delta: '+7', icon: 'speed', progress: 86 },
];

const reviewGroups = [
  { label: 'Today', count: 23, items: ['Cellular respiration', 'Normal forms', 'Hash tables'], urgent: true },
  { label: 'Tomorrow', count: 17, items: ['SOLID principles', 'Eigenvectors'], urgent: false },
  { label: 'This Week', count: 68, items: ['Sorting proofs', 'ER diagrams'], urgent: false },
  { label: 'Overdue', count: 6, items: ['TCP handshake', 'Calculus limits'], urgent: true },
];

const cardTypes = ['Definition', 'Concept', 'Formula', 'True/False', 'Fill in the Blank', 'Process', 'Diagram-based', 'Q&A'];
const preferenceToggles = ['Include examples', 'Include mnemonics', 'Include images', 'Avoid duplicates', 'Adaptive difficulty'];

function ProgressRing({ value, size = 54, color = '#4D2B8C' }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * value) / 100;

  return (
    <span className="flash-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} />
        <circle cx={size / 2} cy={size / 2} r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <strong>{value}%</strong>
    </span>
  );
}

function MiniChart() {
  return (
    <div className="flash-mini-chart" aria-hidden="true">
      {[42, 68, 54, 84, 72, 91, 79].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
    </div>
  );
}

function StudyMaterialTree({ semesters, selectedIds, expandedIds, onToggleExpanded, onToggleSelected }) {
  const renderMaterial = (item, path) => {
    const material = {
      id: `${item.type}-${item.id}`,
      sourceId: item.id,
      type: item.type,
      title: item.title,
      path,
      icon: item.type === 'pdf' ? 'picture_as_pdf' : 'description',
    };

    return (
      <label key={material.id} className="flash-tree-item flash-tree-file">
        <input checked={selectedIds.includes(material.id)} type="checkbox" onChange={() => onToggleSelected(material)} />
        <span className="material-symbols-outlined">{material.icon}</span>
        <span>{material.title}</span>
      </label>
    );
  };

  const renderFolder = (folder, path) => {
    const folderId = `folder-${folder.folderId}`;
    const folderPath = `${path} / ${folder.title}`;
    const isOpen = expandedIds.includes(folderId);
    const folderMaterial = { id: folderId, sourceId: folder.folderId, type: 'folder', title: folder.title, path, icon: 'folder' };

    return (
      <div key={folderId} className="flash-tree-branch">
        <div className="flash-tree-row">
          <button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(folderId)} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${folder.title}`}>
            <span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span>
          </button>
          <label className="flash-tree-item">
            <input checked={selectedIds.includes(folderId)} type="checkbox" onChange={() => onToggleSelected(folderMaterial)} />
            <span className="material-symbols-outlined">folder</span>
            <span>{folder.title}</span>
          </label>
        </div>
        {isOpen && (
          <div className="flash-tree-children">
            {(folder.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, folderPath))}
            {(folder.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, folderPath))}
            {(folder.folders || []).map((child) => renderFolder(child, folderPath))}
          </div>
        )}
      </div>
    );
  };

  if (!semesters.length) {
    return (
      <div className="flash-tree-empty">
        <span className="material-symbols-outlined">source_environment</span>
        <p>Create semesters, modules, notes, or PDFs in My Notes to generate flash cards from your own material.</p>
      </div>
    );
  }

  return (
    <div className="flash-tree">
      {semesters.map((semester) => {
        const semesterId = `semester-${semester.semesterId}`;
        const semesterOpen = expandedIds.includes(semesterId);
        const semesterMaterial = { id: semesterId, sourceId: semester.semesterId, type: 'semester', title: semester.title, path: 'Academent', icon: 'auto_stories' };

        return (
          <div key={semesterId} className="flash-tree-branch">
            <div className="flash-tree-row flash-tree-root">
              <button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(semesterId)} aria-label={`${semesterOpen ? 'Collapse' : 'Expand'} ${semester.title}`}>
                <span className="material-symbols-outlined">{semesterOpen ? 'expand_more' : 'chevron_right'}</span>
              </button>
              <label className="flash-tree-item">
                <input checked={selectedIds.includes(semesterId)} type="checkbox" onChange={() => onToggleSelected(semesterMaterial)} />
                <span className="material-symbols-outlined">auto_stories</span>
                <span>{semester.title}</span>
              </label>
            </div>
            {semesterOpen && (
              <div className="flash-tree-children">
                {(semester.modules || []).map((module) => {
                  const moduleId = `module-${module.moduleId}`;
                  const moduleOpen = expandedIds.includes(moduleId);
                  const moduleTitle = module.title || module.moduleId;
                  const modulePath = `${semester.title} / ${moduleTitle}`;
                  const moduleMaterial = { id: moduleId, sourceId: module.moduleId, type: 'module', title: moduleTitle, path: semester.title, icon: 'topic' };

                  return (
                    <div key={moduleId} className="flash-tree-branch">
                      <div className="flash-tree-row">
                        <button type="button" className="flash-tree-expand" onClick={() => onToggleExpanded(moduleId)} aria-label={`${moduleOpen ? 'Collapse' : 'Expand'} ${moduleTitle}`}>
                          <span className="material-symbols-outlined">{moduleOpen ? 'expand_more' : 'chevron_right'}</span>
                        </button>
                        <label className="flash-tree-item">
                          <input checked={selectedIds.includes(moduleId)} type="checkbox" onChange={() => onToggleSelected(moduleMaterial)} />
                          <span className="material-symbols-outlined">topic</span>
                          <span>{moduleTitle}</span>
                        </label>
                      </div>
                      {moduleOpen && (
                        <div className="flash-tree-children">
                          {(module.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, modulePath))}
                          {(module.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, modulePath))}
                          {(module.folders || []).map((folder) => renderFolder(folder, modulePath))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GeneratorModal({ semesters, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedIds, setExpandedIds] = useState(() => {
    const firstSemester = semesters[0];
    const firstModule = firstSemester?.modules?.[0];
    return [firstSemester && `semester-${firstSemester.semesterId}`, firstModule && `module-${firstModule.moduleId}`].filter(Boolean);
  });
  const [difficulty, setDifficulty] = useState('Mixed');
  const [cardCount, setCardCount] = useState(35);
  const [enabledTypes, setEnabledTypes] = useState(['Definition', 'Concept', 'Formula', 'Q&A']);
  const [enabledToggles, setEnabledToggles] = useState(['Include examples', 'Avoid duplicates', 'Adaptive difficulty']);

  const selectedIds = selectedItems.map((item) => item.id);
  const toggleExpanded = (id) => setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleSelected = (item) => setSelectedItems((current) => current.some((selected) => selected.id === item.id) ? current.filter((selected) => selected.id !== item.id) : [...current, item]);
  const toggleType = (type) => setEnabledTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  const togglePreference = (preference) => setEnabledToggles((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference]);

  return (
    <div className="flash-modal-backdrop">
      <section className="flash-generator-modal" role="dialog" aria-modal="true" aria-labelledby="flash-generator-title">
        <header className="flash-modal-header">
          <div>
            <p>AI flash card generator</p>
            <h3 id="flash-generator-title">Create Flash Cards</h3>
            <span>Step {step} of 3</span>
          </div>
          <button className="flash-icon-button" type="button" onClick={onClose} aria-label="Close generator">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flash-stepper" aria-label="Generator progress">
          {[1, 2, 3].map((item) => <span key={item} className={step >= item ? 'is-active' : ''} />)}
        </div>

        <div className="flash-generator-body">
          {step === 1 && (
            <section className="flash-generator-grid">
              <div className="flash-generator-panel flash-tree-panel">
                <div className="flash-panel-heading">
                  <h4>Choose Study Material</h4>
                  <p>Select folders, notes, and PDFs from Notes Management.</p>
                </div>
                <label className="flash-search-field">
                  <span className="material-symbols-outlined">search</span>
                  <input placeholder="Search tree" />
                </label>
                <StudyMaterialTree semesters={semesters} selectedIds={selectedIds} expandedIds={expandedIds} onToggleExpanded={toggleExpanded} onToggleSelected={toggleSelected} />
              </div>
              <aside className="flash-generator-panel">
                <div className="flash-panel-heading">
                  <h4>Selected Sources</h4>
                  <p>{selectedItems.length} items ready for generation</p>
                </div>
                <div className="flash-selected-sources">
                  {selectedItems.length ? selectedItems.map((item) => (
                    <div key={item.id}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.path}</small>
                      </div>
                    </div>
                  )) : <p>Select at least one source to build grounded flash cards.</p>}
                </div>
              </aside>
            </section>
          )}

          {step === 2 && (
            <section className="flash-generator-panel">
              <div className="flash-panel-heading">
                <h4>Flash Card Preferences</h4>
                <p>Tune the amount, depth, and card format.</p>
              </div>
              <div className="flash-preference-grid">
                <label className="flash-range-field">
                  <span>Number of cards</span>
                  <input min="10" max="80" type="range" value={cardCount} onChange={(event) => setCardCount(Number(event.target.value))} />
                  <strong>{cardCount}</strong>
                </label>
                <fieldset className="flash-segmented">
                  <legend>Difficulty</legend>
                  {['Easy', 'Medium', 'Hard', 'Mixed'].map((level) => (
                    <label key={level}>
                      <input checked={difficulty === level} type="radio" name="flashDifficulty" onChange={() => setDifficulty(level)} />
                      <span>{level}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <div className="flash-choice-grid">
                {cardTypes.map((type) => (
                  <button key={type} type="button" className={enabledTypes.includes(type) ? 'is-selected' : ''} onClick={() => toggleType(type)}>
                    <span className="material-symbols-outlined">{enabledTypes.includes(type) ? 'check_circle' : 'radio_button_unchecked'}</span>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flash-toggle-list">
                {preferenceToggles.map((toggle) => (
                  <label key={toggle}>
                    <input checked={enabledToggles.includes(toggle)} type="checkbox" onChange={() => togglePreference(toggle)} />
                    <span>{toggle}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="flash-generator-grid">
              <div className="flash-generator-panel">
                <div className="flash-panel-heading">
                  <h4>Generation Preview</h4>
                  <p>Review the estimated scope before creating cards.</p>
                </div>
                <div className="flash-preview-metrics">
                  <div><span>Estimated cards</span><strong>{cardCount}</strong></div>
                  <div><span>Generation time</span><strong>~45s</strong></div>
                  <div><span>Sources</span><strong>{Math.max(selectedItems.length, 1)}</strong></div>
                </div>
                <div className="flash-coverage">
                  <div><span style={{ width: '82%' }} /></div>
                  <p>Coverage graph: strongest in definitions, formulas, and exam-style Q&A.</p>
                </div>
              </div>
              <aside className="flash-generator-panel">
                <div className="flash-panel-heading">
                  <h4>Detected Concepts</h4>
                  <p>Knowledge areas AI will prioritize.</p>
                </div>
                <div className="flash-topic-cloud">
                  {['Core definitions', 'Process steps', 'Common mistakes', 'Formula recall', 'Applied examples', 'Related topics'].map((topic) => <span key={topic}>{topic}</span>)}
                </div>
              </aside>
            </section>
          )}
        </div>

        <footer className="flash-modal-actions">
          <button className="flash-button flash-button--ghost" type="button" onClick={step === 1 ? onClose : () => setStep((current) => current - 1)}>
            {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          <button className="flash-button flash-button--primary" type="button" onClick={step === 3 ? onClose : () => setStep((current) => current + 1)}>
            <span className="material-symbols-outlined">{step === 3 ? 'auto_awesome' : 'arrow_forward'}</span>
            {step === 3 ? 'Generate Flash Cards' : 'Continue'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function CardEditorModal({ onClose }) {
  return (
    <div className="flash-modal-backdrop">
      <section className="flash-editor-modal" role="dialog" aria-modal="true" aria-labelledby="flash-editor-title">
        <header className="flash-modal-header">
          <div>
            <p>Card editor</p>
            <h3 id="flash-editor-title">Edit Flash Card</h3>
          </div>
          <button className="flash-icon-button" type="button" onClick={onClose} aria-label="Close editor">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>
        <div className="flash-editor-body">
          <label><span>Front</span><textarea defaultValue="What does Big O notation describe?" /></label>
          <label><span>Back</span><textarea defaultValue="How an algorithm scales as input size grows, focusing on upper-bound time or space complexity." /></label>
          <label><span>Category</span><input defaultValue="Algorithms" /></label>
          <label><span>Tags</span><input defaultValue="Complexity, Analysis" /></label>
          <label><span>Difficulty</span><select defaultValue="Medium"><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
          <label><span>Notes</span><textarea defaultValue="Use merge sort and binary search as examples during review." /></label>
          <label className="flash-upload-field">
            <span>Image upload</span>
            <div><span className="material-symbols-outlined">add_photo_alternate</span> Drop image or browse</div>
          </label>
          <div className="flash-rich-editor">
            <div><button type="button">B</button><button type="button">I</button><button type="button"><span className="material-symbols-outlined">format_list_bulleted</span></button></div>
            <p>Rich text preview for formatted explanations, formulas, and diagrams.</p>
          </div>
        </div>
        <footer className="flash-modal-actions">
          <button className="flash-button flash-button--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="flash-button flash-button--ghost" type="button"><span className="material-symbols-outlined">auto_awesome</span>Generate with AI</button>
          <button className="flash-button flash-button--ghost" type="button"><span className="material-symbols-outlined">visibility</span>Preview</button>
          <button className="flash-button flash-button--primary" type="button" onClick={onClose}>Save</button>
        </footer>
      </section>
    </div>
  );
}

function StudyMode({ collection, cards, onExit }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const activeCard = cards[index] || cards[0];
  const progress = Math.round(((index + 1) / cards.length) * 100);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setFlipped((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goTo = (nextIndex) => {
    setIndex(Math.min(Math.max(nextIndex, 0), cards.length - 1));
    setFlipped(false);
  };

  return (
    <main className="flash-study-mode">
      <header className="flash-study-topbar">
        <button className="flash-button flash-button--ghost" type="button" onClick={onExit}><span className="material-symbols-outlined">close</span>Exit Study</button>
        <div className="flash-study-progress">
          <div>
            <strong>Card {index + 1} of {cards.length}</strong>
            <span>~12 min remaining - 12 streak</span>
          </div>
          <div className="flash-progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
        <button className="flash-icon-button" type="button" onClick={() => setAiOpen((current) => !current)} aria-label="Toggle AI assistant">
          <span className="material-symbols-outlined">side_panel_right</span>
        </button>
      </header>

      <section className={aiOpen ? 'flash-study-layout' : 'flash-study-layout flash-study-layout--wide'}>
        <div className="flash-study-center">
          <p className="flash-eyebrow">{collection.name} / {activeCard.difficulty}</p>
          <article className={flipped ? 'flash-study-card is-flipped' : 'flash-study-card'}>
            {!flipped ? (
              <>
                <span className="material-symbols-outlined">style</span>
                <p>Question</p>
                <h1>{activeCard.front}</h1>
                <div className="flash-card-placeholder">
                  <span className="material-symbols-outlined">insert_chart</span>
                  Diagram placeholder
                </div>
                <button className="flash-button flash-button--primary flash-flip-button" type="button" onClick={() => setFlipped(true)}>
                  <span className="material-symbols-outlined">flip</span>Flip
                </button>
                <small>Space = Flip</small>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">task_alt</span>
                <p>Answer</p>
                <h2>{activeCard.back}</h2>
                <div className="flash-answer-grid">
                  <div><strong>Explanation</strong><span>Connect the definition to a concrete example before moving on.</span></div>
                  <div><strong>Example</strong><span>Compare how the idea appears in lectures, notes, and practice questions.</span></div>
                  <div><strong>Related concept</strong><span>{activeCard.tags.join(', ')}</span></div>
                </div>
                <div className="flash-rating">
                  <p>How well did you know this?</p>
                  {['Again', 'Hard', 'Good', 'Easy'].map((rating) => <button key={rating} className={`flash-rating-${rating.toLowerCase()}`} type="button">{rating}</button>)}
                </div>
              </>
            )}
          </article>

          <footer className="flash-study-controls">
            <button className="flash-button flash-button--ghost" type="button" disabled={index === 0} onClick={() => goTo(index - 1)}><span className="material-symbols-outlined">chevron_left</span>Previous</button>
            <button className="flash-button flash-button--ghost" type="button" onClick={() => setFlipped((current) => !current)}><span className="material-symbols-outlined">flip</span>Flip</button>
            <button className="flash-button flash-button--primary" type="button" disabled={index === cards.length - 1} onClick={() => goTo(index + 1)}>Next<span className="material-symbols-outlined">chevron_right</span></button>
            <button className="flash-icon-button" type="button" aria-label="Shuffle"><span className="material-symbols-outlined">shuffle</span></button>
            <button className="flash-icon-button" type="button" aria-label="Auto play"><span className="material-symbols-outlined">play_circle</span></button>
            <button className="flash-icon-button" type="button" aria-label="Fullscreen"><span className="material-symbols-outlined">fullscreen</span></button>
          </footer>
        </div>

        {aiOpen && (
          <aside className="flash-ai-panel">
            <div className="flash-panel-heading">
              <h3>AI Assistant</h3>
              <p>Ask about the current flash card.</p>
            </div>
            <label className="flash-ai-input">
              <input placeholder="Ask AI about this card" />
              <button type="button" aria-label="Send"><span className="material-symbols-outlined">send</span></button>
            </label>
            <div className="flash-ai-actions">
              {['Explain concept', 'Generate mnemonic', 'Generate memory trick', 'Give real-world example', 'Generate practice question', 'Simplify explanation', 'Expand explanation', 'Show related topics'].map((action) => (
                <button key={action} type="button">{action}</button>
              ))}
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}

function FlashCardsPage({ profile, currentUser }) {
  const notes = useNoteManagement();
  const [collections, setCollections] = useState(collectionsSeed);
  const [activeCollection, setActiveCollection] = useState(null);
  const [studyCollection, setStudyCollection] = useState(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const filteredCollections = collections.filter((collection) => collection.name.toLowerCase().includes(search.toLowerCase()));
  const selectedCollection = activeCollection || filteredCollections[0];
  const dueToday = flashCardsSeed.filter((card) => card.reviewStatus === 'Due today').length;

  const cardsForCollection = useMemo(() => flashCardsSeed.map((card, index) => ({
    ...card,
    collectionId: selectedCollection?.id,
    id: `${selectedCollection?.id || 'card'}-${index}`,
  })), [selectedCollection?.id]);

  const duplicateCollection = (collection) => {
    setCollections((current) => [{ ...collection, id: `${collection.id}-${Date.now()}`, name: `${collection.name} Copy`, progress: Math.max(collection.progress - 8, 12) }, ...current]);
  };

  const deleteCollection = (collectionId) => {
    setCollections((current) => current.filter((collection) => collection.id !== collectionId));
    if (activeCollection?.id === collectionId) setActiveCollection(null);
  };

  if (studyCollection) {
    return <StudyMode collection={studyCollection} cards={cardsForCollection} onExit={() => setStudyCollection(null)} />;
  }

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl flash-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search flash cards, concepts, or tags..." />

      <section className="flash-header">
        <div>
          <p className="flash-eyebrow">Dedicated study environment</p>
          <h2>Flash Cards</h2>
          <p>Memorize concepts faster with AI-generated flash cards.</p>
        </div>
        <div className="flash-header-actions">
          <label className="flash-search-field">
            <span className="material-symbols-outlined">search</span>
            <input value={search} placeholder="Search flash cards" onChange={(event) => setSearch(event.target.value)} />
          </label>
          <button className="flash-icon-button" type="button" aria-label="Filter flash cards"><span className="material-symbols-outlined">filter_list</span></button>
          <button className="flash-icon-button" type="button" aria-label="Sort flash cards"><span className="material-symbols-outlined">sort</span></button>
          <button className="flash-button flash-button--primary" type="button" onClick={() => setIsGeneratorOpen(true)}><span className="material-symbols-outlined">auto_awesome</span>Create Flash Cards</button>
          <button className="flash-button flash-button--ghost" type="button"><span className="material-symbols-outlined">upload_file</span>Import Flash Cards</button>
        </div>
      </section>

      <section className="flash-kpi-grid" aria-label="Flash card statistics">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="flash-kpi-card">
            <div>
              <span className="material-symbols-outlined">{kpi.icon}</span>
              <p>{kpi.label}</p>
              <h3>{kpi.value}</h3>
              <small>{kpi.delta}</small>
            </div>
            <ProgressRing value={kpi.progress} size={48} color={kpi.progress > 80 ? '#24b47e' : '#4D2B8C'} />
            <MiniChart />
          </article>
        ))}
      </section>

      <div className="flash-workspace-grid">
        <div className="flash-main-column">
          <section>
            <div className="flash-section-heading">
              <div>
                <h3>Flash Card Collections</h3>
                <p>{collections.length} collections built from notes, PDFs, and manual cards.</p>
              </div>
              <span>{dueToday} cards due today</span>
            </div>

            {filteredCollections.length ? (
              <div className="flash-collection-grid">
                {filteredCollections.map((collection) => (
                  <article key={collection.id} className={selectedCollection?.id === collection.id ? 'flash-collection-card is-active' : 'flash-collection-card'} onClick={() => setActiveCollection(collection)}>
                    <div className="flash-collection-top">
                      <span className="flash-collection-icon material-symbols-outlined" style={{ color: collection.color }}>{collection.icon}</span>
                      <ProgressRing value={collection.progress} size={58} color={collection.color} />
                    </div>
                    <h4>{collection.name}</h4>
                    <p>{collection.cards} cards - Last studied {collection.lastStudied}</p>
                    <div className="flash-collection-meta">
                      <span>{collection.difficulty}</span>
                      <span><span className="material-symbols-outlined">schedule</span>{collection.studyTime}</span>
                    </div>
                    <div className="flash-card-hover-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => setStudyCollection(collection)}>Continue</button>
                      <button type="button" onClick={() => setIsEditorOpen(true)}>Edit</button>
                      <button type="button" onClick={() => deleteCollection(collection.id)}>Delete</button>
                      <button type="button" onClick={() => duplicateCollection(collection)}>Duplicate</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="flash-empty-state">
                <div className="flash-empty-illustration">
                  <span className="material-symbols-outlined">style</span>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3>No Flash Card Collections Yet</h3>
                <p>Generate AI-powered flash cards from your notes or create your own.</p>
                <div>
                  <button className="flash-button flash-button--primary" type="button" onClick={() => setIsGeneratorOpen(true)}>Generate Flash Cards</button>
                  <button className="flash-button flash-button--ghost" type="button" onClick={() => setIsEditorOpen(true)}>Create Manually</button>
                </div>
              </section>
            )}
          </section>

          {selectedCollection && (
            <section className="flash-list-section">
              <div className="flash-section-heading">
                <div>
                  <h3>{selectedCollection.name} Cards</h3>
                  <p>Review status, mastery, and spaced repetition signals.</p>
                </div>
                <button className="flash-button flash-button--primary" type="button" onClick={() => setStudyCollection(selectedCollection)}><span className="material-symbols-outlined">play_arrow</span>Study</button>
              </div>
              <div className="flash-card-list">
                {cardsForCollection.map((card) => (
                  <article key={card.id} className="flash-card-row">
                    <button className={card.pinned ? 'flash-pin is-pinned' : 'flash-pin'} type="button" aria-label={card.pinned ? 'Pinned card' : 'Pin card'}>
                      <span className="material-symbols-outlined">push_pin</span>
                    </button>
                    <div className="flash-card-front">
                      <strong>{card.front}</strong>
                      <small>Created from {card.createdFrom}</small>
                      <div>{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    </div>
                    <span className={`flash-difficulty flash-difficulty--${card.difficulty.toLowerCase()}`}>{card.difficulty}</span>
                    <span className="flash-ai-badge"><span className="material-symbols-outlined">auto_awesome</span>AI Generated</span>
                    <div className="flash-review-status">
                      <strong>{card.reviewStatus}</strong>
                      <small>Last reviewed {card.lastReviewed}</small>
                    </div>
                    <div className="flash-srs-grid">
                      <span>Next Review <strong>{card.nextReview}</strong></span>
                      <span>Interval <strong>{card.interval}</strong></span>
                      <span>Ease <strong>{card.ease}</strong></span>
                      <span>Retention <strong>{card.retention}</strong></span>
                      <span>Mastery <strong>{card.mastery}%</strong></span>
                      <span>Stage <strong>{card.stage}</strong></span>
                    </div>
                    <div className="flash-row-actions">
                      <button type="button" onClick={() => setStudyCollection(selectedCollection)} aria-label="Study card"><span className="material-symbols-outlined">play_arrow</span></button>
                      <button type="button" onClick={() => setIsEditorOpen(true)} aria-label="Edit card"><span className="material-symbols-outlined">edit</span></button>
                      <button type="button" aria-label="Delete card"><span className="material-symbols-outlined">delete</span></button>
                      <button type="button" aria-label="Duplicate card"><span className="material-symbols-outlined">content_copy</span></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="flash-review-panel">
          <div className="flash-panel-heading">
            <h3>Review Calendar</h3>
            <p>Upcoming spaced repetition reviews.</p>
          </div>
          {reviewGroups.map((group) => (
            <article key={group.label} className={group.urgent ? 'flash-review-group is-urgent' : 'flash-review-group'}>
              <div>
                <strong>{group.label}</strong>
                <span>{group.count} cards</span>
              </div>
              <ul>
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
          <div className="flash-skeleton-panel" aria-label="Skeleton loading preview">
            <span />
            <span />
            <span />
          </div>
        </aside>
      </div>

      {isGeneratorOpen && <GeneratorModal semesters={notes.data.semesters || []} onClose={() => setIsGeneratorOpen(false)} />}
      {isEditorOpen && <CardEditorModal onClose={() => setIsEditorOpen(false)} />}
    </main>
  );
}

export default FlashCardsPage;
