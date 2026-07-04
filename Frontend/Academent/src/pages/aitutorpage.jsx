import { useEffect, useMemo, useRef, useState } from 'react';
import useNoteManagement from '../Services/useNoteManagement';
import './aitutorpage.css';

const conversationGroups = [
  {
    label: 'Today',
    items: [
      {
        id: 'photosynthesis',
        title: 'Photosynthesis review',
        time: '11:42 AM',
        preview: 'Explain the light-dependent reaction in simple terms.',
      },
      {
        id: 'calculus',
        title: 'Calculus limits',
        time: '9:15 AM',
        preview: 'Help me compare one-sided and two-sided limits.',
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        id: 'ethics',
        title: 'Bioethics essay plan',
        time: '8:04 PM',
        preview: 'Create an outline about informed consent.',
      },
    ],
  },
  {
    label: 'Last 7 Days',
    items: [
      {
        id: 'organic',
        title: 'Organic chemistry mechanisms',
        time: 'Mon',
        preview: 'Why do nucleophiles attack electrophiles?',
      },
      {
        id: 'physics',
        title: 'Newton laws practice',
        time: 'Sun',
        preview: 'Give me a real-world example for F = ma.',
      },
    ],
  },
  {
    label: 'Last 30 Days',
    items: [
      {
        id: 'cells',
        title: 'Cell structure comparison',
        time: 'Jun 18',
        preview: 'Compare mitochondria and chloroplasts in a table.',
      },
    ],
  },
  {
    label: 'Older',
    items: [
      {
        id: 'history',
        title: 'World history revision',
        time: 'May 02',
        preview: 'Summarize causes of the Industrial Revolution.',
      },
    ],
  },
];

const suggestionCards = [
  { title: 'Explain Photosynthesis', icon: 'eco', prompt: 'Explain photosynthesis like I am preparing for an exam.' },
  { title: 'Summarize Chapter 5', icon: 'menu_book', prompt: 'Summarize Chapter 5 into key concepts, definitions, and likely exam questions.' },
  { title: 'Create a Quiz', icon: 'quiz', prompt: 'Create a 10-question quiz from my selected study materials.' },
  { title: 'Generate Flashcards', icon: 'style', prompt: 'Generate flashcards for the most important terms in my selected notes.' },
  { title: 'Explain this Formula', icon: 'functions', prompt: 'Explain this formula step by step and show when to use it: ' },
  { title: 'Compare Two Concepts', icon: 'compare_arrows', prompt: 'Compare these two concepts in a table: ' },
];

const quickActions = [
  { label: 'Generate Quiz', icon: 'quiz' },
  { label: 'Generate Flashcards', icon: 'style' },
  { label: 'Summarize', icon: 'summarize' },
  { label: 'Explain Simply', icon: 'psychology' },
  { label: 'Practice Questions', icon: 'rule' },
];

const sampleMessages = {
  photosynthesis: [
    {
      id: 1,
      sender: 'user',
      text: 'Explain the light-dependent reaction in simple terms.',
    },
    {
      id: 2,
      sender: 'ai',
      text: 'The light-dependent reaction is the first stage of photosynthesis. It happens in the thylakoid membranes, where chlorophyll absorbs light energy and converts it into ATP and NADPH.\n\n- Water is split to replace lost electrons.\n- Oxygen is released as a byproduct.\n- ATP and NADPH power the Calvin cycle.\n\n| Input | Output |\n| Water, light, ADP, NADP+ | Oxygen, ATP, NADPH |',
      citations: ['Biology Notes', 'Chapter 4.pdf'],
    },
  ],
  calculus: [
    {
      id: 1,
      sender: 'user',
      text: 'Help me compare one-sided and two-sided limits.',
    },
    {
      id: 2,
      sender: 'ai',
      text: 'A one-sided limit checks what a function approaches from only the left or the right. A two-sided limit exists only when both one-sided limits approach the same value.\n\n```txt\nlim x->a f(x) exists if:\nlim x->a- f(x) = lim x->a+ f(x)\n```\n\nThis is useful when graphs have jumps, holes, or piecewise definitions.',
      citations: ['Calculus Module'],
    },
  ],
};

const sampleHierarchy = [
  {
    semesterId: 'demo-semester-1',
    title: 'Semester 1',
    modules: [
      {
        moduleId: 'demo-biology',
        title: 'Biology 101',
        notes: [{ noteId: 'demo-bio-note', title: 'Biology Notes', content: 'Photosynthesis, cells, respiration.' }],
        pdfs: [{ pdfId: 'demo-bio-pdf', title: 'Chapter 4.pdf', url: '' }],
        folders: [
          {
            folderId: 'demo-bio-folder',
            title: 'Plant Systems',
            notes: [{ noteId: 'demo-lecture-02', title: 'Lecture 02', content: 'Chloroplasts and leaf structure.' }],
            pdfs: [],
            folders: [
              {
                folderId: 'demo-bio-nested',
                title: 'Exam Prep',
                notes: [{ noteId: 'demo-exam-guide', title: 'Midterm Guide', content: 'Likely biology exam topics.' }],
                pdfs: [{ pdfId: 'demo-review-pdf', title: 'Review Sheet.pdf', url: '' }],
                folders: [],
              },
            ],
          },
        ],
      },
      {
        moduleId: 'demo-physics',
        title: 'Physics Fundamentals',
        notes: [{ noteId: 'demo-motion-note', title: 'Motion Notes', content: 'Velocity, acceleration, force.' }],
        pdfs: [{ pdfId: 'demo-newton-pdf', title: 'Newton Laws.pdf', url: '' }],
        folders: [],
      },
    ],
  },
];

const flattenMaterials = (semesters = []) => {
  const materials = [];

  const visitFolder = (folder, path, semesterId, moduleId) => {
    const folderPath = `${path} / ${folder.title}`;

    (folder.notes || []).forEach((note) => materials.push({
      id: note.noteId,
      type: 'note',
      title: note.title,
      path: folderPath,
      semesterId,
      moduleId,
      icon: 'description',
    }));

    (folder.pdfs || []).forEach((pdf) => materials.push({
      id: pdf.pdfId,
      type: 'pdf',
      title: pdf.title,
      path: folderPath,
      semesterId,
      moduleId,
      icon: 'picture_as_pdf',
    }));

    (folder.folders || []).forEach((child) => visitFolder(child, folderPath, semesterId, moduleId));
  };

  semesters.forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

      (module.notes || []).forEach((note) => materials.push({
        id: note.noteId,
        type: 'note',
        title: note.title,
        path: modulePath,
        semesterId: semester.semesterId,
        moduleId: module.moduleId,
        icon: 'description',
      }));

      (module.pdfs || []).forEach((pdf) => materials.push({
        id: pdf.pdfId,
        type: 'pdf',
        title: pdf.title,
        path: modulePath,
        semesterId: semester.semesterId,
        moduleId: module.moduleId,
        icon: 'picture_as_pdf',
      }));

      (module.folders || []).forEach((folder) => visitFolder(folder, modulePath, semester.semesterId, module.moduleId));
    });
  });

  return materials;
};

function IconButton({ icon, label, onClick, active = false, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      className={`ai-tutor-icon-button ${active ? 'ai-tutor-icon-button--active' : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

function Avatar({ name, photoURL, variant = 'user' }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photoURL) && !failed && variant === 'user';

  if (showPhoto) {
    return <img className="ai-tutor-avatar" src={photoURL} alt="" onError={() => setFailed(true)} />;
  }

  return (
    <div className={`ai-tutor-avatar ai-tutor-avatar--${variant}`}>
      {variant === 'ai' ? <span className="material-symbols-outlined">psychology</span> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function MessageContent({ text }) {
  const blocks = String(text).split(/```/g);

  return (
    <div className="ai-message-richtext">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          return <pre key={index}><code>{block.replace(/^txt\n/, '')}</code></pre>;
        }

        return block.split('\n\n').map((section, sectionIndex) => {
          const lines = section.split('\n');
          const isList = lines.every((line) => line.trim().startsWith('- '));
          const isTable = lines.every((line) => line.includes('|')) && lines.length > 1;

          if (isList) {
            return (
              <ul key={`${index}-${sectionIndex}`}>
                {lines.map((line) => <li key={line}>{line.replace(/^- /, '')}</li>)}
              </ul>
            );
          }

          if (isTable) {
            return (
              <div key={`${index}-${sectionIndex}`} className="ai-message-table-wrap">
                <table>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line}>
                        {line.split('|').filter(Boolean).map((cell) => <td key={cell}>{cell.trim()}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return <p key={`${index}-${sectionIndex}`}>{section}</p>;
        });
      })}
    </div>
  );
}

function ConversationSidebar({ activeId, onSelect, onNewChat, userName, photoURL, email }) {
  return (
    <aside className="ai-chat-sidebar">
      <button className="ai-new-chat-button" type="button" onClick={onNewChat}>
        <span className="material-symbols-outlined">add</span>
        New Chat
      </button>

      <div className="ai-chat-history custom-scrollbar">
        {conversationGroups.map((group) => (
          <section key={group.label} className="ai-history-group">
            <h3>{group.label}</h3>
            {group.items.map((item) => (
              <article
                key={item.id}
                className={`ai-history-item ${activeId === item.id ? 'ai-history-item--active' : ''}`}
                onClick={() => onSelect(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelect(item);
                }}
              >
                <div>
                  <div className="ai-history-title-row">
                    <strong>{item.title}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.preview}</p>
                </div>
                <div className="ai-history-actions" aria-label="Conversation actions">
                  <IconButton icon="edit" label="Rename conversation" />
                  <IconButton icon="delete" label="Delete conversation" />
                  <IconButton icon="more_horiz" label="More conversation actions" />
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>

      <footer className="ai-sidebar-profile">
        <Avatar name={userName} photoURL={photoURL} />
        <div>
          <strong>{userName}</strong>
          <span>{email || 'student@academent.ai'}</span>
        </div>
        <IconButton icon="settings" label="Settings" />
        <IconButton icon="logout" label="Logout" />
      </footer>
    </aside>
  );
}

function StudyMaterialTree({
  semesters,
  selectedIds,
  expandedIds,
  onToggleExpanded,
  onToggleSelected,
  semesterFilter,
  moduleFilter,
  searchTerm,
}) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const renderMaterial = (item, path, semesterId, moduleId) => {
    const id = item.noteId || item.pdfId;
    const type = item.noteId ? 'note' : 'pdf';
    const title = item.title || 'Untitled material';
    const material = {
      id,
      type,
      title,
      path,
      semesterId,
      moduleId,
      icon: type === 'pdf' ? 'picture_as_pdf' : 'description',
    };
    const matchesSearch = !normalizedSearch || `${title} ${path}`.toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) return null;

    return (
      <label key={`${type}-${id}`} className="ai-material-file">
        <input checked={selectedIds.includes(id)} type="checkbox" onChange={() => onToggleSelected(material)} />
        <span className="material-symbols-outlined">{material.icon}</span>
        <span>{title}</span>
      </label>
    );
  };

  const renderFolder = (folder, path, semesterId, moduleId) => {
    const key = `folder-${folder.folderId}`;
    const isOpen = expandedIds.includes(key);
    const folderPath = `${path} / ${folder.title}`;

    return (
      <div key={folder.folderId} className="ai-material-branch">
        <button type="button" className="ai-material-node" onClick={() => onToggleExpanded(key)}>
          <span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span>
          <span className="material-symbols-outlined">folder</span>
          <span>{folder.title}</span>
        </button>
        {isOpen && (
          <div className="ai-material-children">
            {(folder.folders || []).map((child) => renderFolder(child, folderPath, semesterId, moduleId))}
            {(folder.pdfs || []).map((pdf) => renderMaterial(pdf, folderPath, semesterId, moduleId))}
            {(folder.notes || []).map((note) => renderMaterial(note, folderPath, semesterId, moduleId))}
          </div>
        )}
      </div>
    );
  };

  const filteredSemesters = semesters.filter((semester) => !semesterFilter || semester.semesterId === semesterFilter);

  if (!filteredSemesters.length) {
    return (
      <div className="ai-material-empty">
        <span className="material-symbols-outlined">source_environment</span>
        <p>No study materials match this filter.</p>
      </div>
    );
  }

  return (
    <div className="ai-material-tree">
      {filteredSemesters.map((semester) => {
        const semesterKey = `semester-${semester.semesterId}`;
        const semesterOpen = expandedIds.includes(semesterKey);

        return (
          <div key={semester.semesterId} className="ai-material-branch">
            <button type="button" className="ai-material-node ai-material-node--root" onClick={() => onToggleExpanded(semesterKey)}>
              <span className="material-symbols-outlined">{semesterOpen ? 'expand_more' : 'chevron_right'}</span>
              <span className="material-symbols-outlined">auto_stories</span>
              <span>{semester.title}</span>
            </button>
            {semesterOpen && (
              <div className="ai-material-children">
                {(semester.modules || [])
                  .filter((module) => !moduleFilter || module.moduleId === moduleFilter)
                  .map((module) => {
                    const moduleKey = `module-${module.moduleId}`;
                    const moduleOpen = expandedIds.includes(moduleKey);
                    const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

                    return (
                      <div key={module.moduleId} className="ai-material-branch">
                        <button type="button" className="ai-material-node" onClick={() => onToggleExpanded(moduleKey)}>
                          <span className="material-symbols-outlined">{moduleOpen ? 'expand_more' : 'chevron_right'}</span>
                          <span className="material-symbols-outlined">topic</span>
                          <span>{module.title || module.moduleId}</span>
                        </button>
                        {moduleOpen && (
                          <div className="ai-material-children">
                            {(module.folders || []).map((folder) => renderFolder(folder, modulePath, semester.semesterId, module.moduleId))}
                            {(module.pdfs || []).map((pdf) => renderMaterial(pdf, modulePath, semester.semesterId, module.moduleId))}
                            {(module.notes || []).map((note) => renderMaterial(note, modulePath, semester.semesterId, module.moduleId))}
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

function AttachmentDrawer({
  open,
  semesters,
  selectedItems,
  onToggleSelected,
  onRemoveSelected,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => {
    const firstSemester = semesters[0];
    const firstModule = firstSemester?.modules?.[0];
    return [firstSemester && `semester-${firstSemester.semesterId}`, firstModule && `module-${firstModule.moduleId}`].filter(Boolean);
  });


  const availableModules = useMemo(() => {
    const targetSemesters = semesterFilter ? semesters.filter((semester) => semester.semesterId === semesterFilter) : semesters;
    return targetSemesters.flatMap((semester) => semester.modules || []);
  }, [semesterFilter, semesters]);

  const selectedIds = selectedItems.map((item) => item.id);
  const selectedNotes = selectedItems.filter((item) => item.type === 'note').length;
  const selectedPdfs = selectedItems.filter((item) => item.type === 'pdf').length;

  if (!open) return null;

  return (
    <div className="ai-drawer-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="ai-attachment-drawer" role="dialog" aria-modal="true" aria-labelledby="attachment-drawer-title">
        <header className="ai-drawer-header">
          <div>
            <p>Study context</p>
            <h2 id="attachment-drawer-title">Attach Study Materials</h2>
          </div>
          <IconButton icon="close" label="Close attachments" onClick={onClose} />
        </header>

        <div className="ai-drawer-filters">
          <label>
            <span className="material-symbols-outlined">search</span>
            <input value={searchTerm} placeholder="Search files" onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <select value={semesterFilter} onChange={(event) => {
            setSemesterFilter(event.target.value);
            setModuleFilter('');
          }}>
            <option value="">All semesters</option>
            {semesters.map((semester) => <option key={semester.semesterId} value={semester.semesterId}>{semester.title}</option>)}
          </select>
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value="">All modules</option>
            {availableModules.map((module) => <option key={module.moduleId} value={module.moduleId}>{module.title || module.moduleId}</option>)}
          </select>
        </div>

        <div className="ai-drawer-body">
          <section className="ai-drawer-tree custom-scrollbar">
            <StudyMaterialTree
              semesters={semesters}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleExpanded={(id) => setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
              onToggleSelected={onToggleSelected}
              semesterFilter={semesterFilter}
              moduleFilter={moduleFilter}
              searchTerm={searchTerm}
            />
          </section>

          <aside className="ai-drawer-selected">
            <div>
              <h3>{selectedItems.length} selected</h3>
              <p>{selectedNotes} notes and {selectedPdfs} PDFs</p>
            </div>
            <div className="ai-selected-list custom-scrollbar">
              {selectedItems.length ? selectedItems.map((item) => (
                <article key={item.id} className="ai-selected-item">
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.path}</small>
                  </div>
                  <button type="button" onClick={() => onRemoveSelected(item.id)} aria-label={`Remove ${item.title}`}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </article>
              )) : (
                <div className="ai-selected-empty">Choose notes or PDFs to personalize the response.</div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Composer({
  input,
  setInput,
  onSend,
  selectedItems,
  onRemoveSelected,
  onOpenDrawer,
  isGenerating,
}) {
  const textareaRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  const noteCount = selectedItems.filter((item) => item.type === 'note').length;
  const pdfCount = selectedItems.filter((item) => item.type === 'pdf').length;

  return (
    <footer className="ai-composer-shell">
      <div className="ai-context-indicator">
        <span>AI is using</span>
        <button type="button">Selected Notes ({noteCount})</button>
        <button type="button">Selected PDFs ({pdfCount})</button>
        <div className="ai-context-chips">
          {selectedItems.slice(0, 4).map((item) => (
            <span key={item.id} className="ai-context-chip">
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.title}
              <button type="button" onClick={() => onRemoveSelected(item.id)} aria-label={`Remove ${item.title}`}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </span>
          ))}
          {selectedItems.length > 4 && <span className="ai-context-chip">+{selectedItems.length - 4} more</span>}
        </div>
      </div>

      <div className="ai-composer-label">
        <span className="material-symbols-outlined">edit_square</span>
        <span>Message Academent AI</span>
      </div>

      <form
        className={`ai-composer ${dragActive ? 'ai-composer--dragging' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          const file = event.dataTransfer.files?.[0];
          if (file) setInput((current) => `${current}${current ? '\n' : ''}Attached file: ${file.name}`);
        }}
      >
        <button className="ai-attach-button" type="button" onClick={onOpenDrawer} aria-label="Attach study materials">
          <span className="material-symbols-outlined">add</span>
        </button>

        <div className="ai-composer-input-wrap">
          <textarea
            ref={textareaRef}
            value={input}
            placeholder="Ask anything about your studies..."
            rows={1}
            onChange={(event) => setInput(event.target.value)}
            onPaste={(event) => {
              const image = Array.from(event.clipboardData.files || []).find((file) => file.type.startsWith('image/'));
              if (image) setInput((current) => `${current}${current ? '\n' : ''}Pasted image: ${image.name || 'image'}`);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
          />
          <div className="ai-composer-meta">
            <span>Markdown ready</span>
            <span>{input.length}/4000</span>
          </div>
        </div>

        <button className="ai-send-button" type="submit" disabled={!input.trim() || isGenerating} aria-label="Send message">
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </footer>
  );
}

function RightContextPanel({ collapsed, onToggle, selectedItems, onQuickAction }) {
  const recentItems = selectedItems.slice(0, 3);

  return (
    <aside className={`ai-context-panel ${collapsed ? 'ai-context-panel--collapsed' : ''}`}>
      <button type="button" className="ai-context-toggle" onClick={onToggle} aria-label={collapsed ? 'Open context panel' : 'Collapse context panel'}>
        <span className="material-symbols-outlined">{collapsed ? 'chevron_left' : 'chevron_right'}</span>
      </button>
      {!collapsed && (
        <>
          <section>
            <p className="ai-panel-eyebrow">Current materials</p>
            <h3>{selectedItems.length} in context</h3>
            <div className="ai-panel-list">
              {selectedItems.length ? selectedItems.slice(0, 5).map((item) => (
                <article key={item.id}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.type.toUpperCase()}</small>
                  </div>
                </article>
              )) : <p className="ai-panel-muted">No materials attached.</p>}
            </div>
          </section>

          <section>
            <p className="ai-panel-eyebrow">Recent uploads</p>
            <div className="ai-panel-list">
              {(recentItems.length ? recentItems : [
                { id: 'recent-1', title: 'Chapter 4.pdf', type: 'pdf', icon: 'picture_as_pdf' },
                { id: 'recent-2', title: 'Lecture 02', type: 'note', icon: 'description' },
              ]).map((item) => (
                <article key={item.id}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.type.toUpperCase()}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <p className="ai-panel-eyebrow">Conversation summary</p>
            <p className="ai-panel-muted">Focused on exam-ready explanations, source-backed summaries, and active recall.</p>
          </section>

          <section>
            <p className="ai-panel-eyebrow">Referenced sources</p>
            <div className="ai-source-pills">
              <span>Biology Notes</span>
              <span>Chapter 4.pdf</span>
              <span>Lecture 02</span>
            </div>
          </section>

          <section>
            <p className="ai-panel-eyebrow">Quick actions</p>
            <div className="ai-quick-actions">
              {quickActions.map((action) => (
                <button key={action.label} type="button" onClick={() => onQuickAction(action.label)}>
                  <span className="material-symbols-outlined">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </aside>
  );
}

function AITutorPage({ currentUser, profile }) {
  const { data: noteData } = useNoteManagement();
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const email = currentUser?.email || '';
  const savedSemesters = noteData?.semesters || [];
  const semesters = savedSemesters.length ? savedSemesters : sampleHierarchy;
  const allMaterials = useMemo(() => flattenMaterials(semesters), [semesters]);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedItems, setSelectedItems] = useState(() => allMaterials.slice(0, 2));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('Thinking...');
  const bottomRef = useRef(null);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (!isGenerating) return undefined;
    const statuses = ['Thinking...', 'Analyzing your notes...', 'Searching relevant concepts...', 'Generating explanation...'];
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % statuses.length;
      setStatusText(statuses[index]);
    }, 900);
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const noteCount = selectedItems.filter((item) => item.type === 'note').length;
  const pdfCount = selectedItems.filter((item) => item.type === 'pdf').length;

  const toggleSelected = (item) => {
    setSelectedItems((current) => {
      if (current.some((selected) => selected.id === item.id)) return current.filter((selected) => selected.id !== item.id);
      return [...current, item];
    });
  };

  const removeSelected = (id) => setSelectedItems((current) => current.filter((item) => item.id !== id));

  const generateReply = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes('quiz')) {
      return 'Here is a compact quiz based on your current study context:\n\n- What is the main purpose of ATP in photosynthesis?\n- Which stage releases oxygen?\n- How does chlorophyll help convert light energy?\n- Why does the Calvin cycle need NADPH?\n\nI can turn this into MCQs with answers if you want a test-ready version.';
    }

    if (lower.includes('flashcard')) {
      return 'I created a flashcard-style study set:\n\n- Front: What is photosynthesis?\n  Back: The process plants use to convert light energy into chemical energy.\n- Front: Where do light-dependent reactions occur?\n  Back: In the thylakoid membranes.\n- Front: What are ATP and NADPH used for?\n  Back: They power the Calvin cycle.';
    }

    if (lower.includes('formula')) {
      return 'A good way to learn a formula is to separate meaning from calculation:\n\n```txt\nF = m x a\nForce = mass x acceleration\n```\n\nIf mass increases and acceleration stays the same, force must increase. If force is fixed, a heavier object accelerates less.';
    }

    return `Here is a study-focused answer using ${noteCount} selected notes and ${pdfCount} selected PDFs.\n\n${text.trim()}\n\nStart with the core idea, then connect it to an example. For exam revision, I would remember it in three layers:\n\n- Definition: the precise meaning.\n- Mechanism: how or why it happens.\n- Application: how to solve or explain it in a question.\n\n| Study move | What to do |\n| Active recall | Close the notes and explain it aloud. |\n| Practice | Solve one fresh question. |\n| Review | Check gaps against the source material. |`;
  };

  const sendMessage = (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isGenerating) return;

    setMessages((current) => [...current, { id: Date.now(), sender: 'user', text }]);
    setInput('');
    setIsGenerating(true);
    setStatusText('Thinking...');

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: generateReply(text),
          citations: selectedItems.slice(0, 3).map((item) => item.title),
        },
      ]);
      setIsGenerating(false);
    }, 1100);
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversationId(conversation.id);
    setMessages(sampleMessages[conversation.id] || [
      { id: Date.now(), sender: 'user', text: conversation.preview },
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'I can continue from here. Share what level of detail you need, and I will shape the explanation for revision, assignments, or exam practice.',
        citations: selectedItems.slice(0, 2).map((item) => item.title),
      },
    ]);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
  };

  const handleQuickAction = (label) => {
    setInput(`${label} from my selected study materials.`);
  };

  return (
    <main className="ai-tutor-page">
      <ConversationSidebar
        activeId={activeConversationId}
        onSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        userName={fullName}
        photoURL={photoURL}
        email={email}
      />

      <section className="ai-tutor-main">
        <header className="ai-tutor-header">
          <div className="ai-tutor-title-group">
            <div className="ai-tutor-mark">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div>
              <h1>AI Tutor</h1>
              <p>Your intelligent study companion</p>
            </div>
          </div>
          <div className="ai-header-actions">
            <label className="ai-header-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search conversations" />
            </label>
            <IconButton icon="ios_share" label="Export conversation" />
            <IconButton icon="mop" label="Clear conversation" onClick={() => setMessages([])} />
            <IconButton icon="settings" label="Tutor settings" />
          </div>
        </header>

        <div className="ai-chat-shell">
          <section className="ai-chat-stage custom-scrollbar" aria-live="polite">
            {!messages.length ? (
              <div className="ai-empty-state">
                <div className="ai-hero-illustration" aria-hidden="true">
                  <div className="ai-orbit ai-orbit--one" />
                  <div className="ai-orbit ai-orbit--two" />
                  <div className="ai-hero-bot">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div className="ai-hero-card ai-hero-card--left">
                    <span className="material-symbols-outlined">functions</span>
                  </div>
                  <div className="ai-hero-card ai-hero-card--right">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                </div>
                <h2>How can I help you study today?</h2>
                <p>Ask questions about your notes, summarize chapters, explain concepts, solve problems, or prepare quizzes.</p>
                <div className="ai-suggestion-grid">
                  {suggestionCards.map((card) => (
                    <button key={card.title} type="button" onClick={() => setInput(card.prompt)}>
                      <span className="material-symbols-outlined">{card.icon}</span>
                      <strong>{card.title}</strong>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-message-list">
                {messages.map((message) => (
                  <article key={message.id} className={`ai-message ai-message--${message.sender}`}>
                    <Avatar name={fullName} photoURL={photoURL} variant={message.sender === 'ai' ? 'ai' : 'user'} />
                    <div className="ai-message-body">
                      <div className="ai-message-bubble">
                        <MessageContent text={message.text} />
                        {message.sender === 'ai' && message.citations?.length > 0 && (
                          <div className="ai-citations">
                            {message.citations.map((citation) => <span key={citation}>{citation}</span>)}
                          </div>
                        )}
                      </div>
                      {message.sender === 'ai' && (
                        <div className="ai-message-actions">
                          <IconButton icon="content_copy" label="Copy response" onClick={() => navigator.clipboard?.writeText(message.text)} />
                          <IconButton icon="thumb_up" label="Like response" />
                          <IconButton icon="thumb_down" label="Dislike response" />
                          <IconButton icon="autorenew" label="Regenerate response" onClick={() => sendMessage(messages.findLast((item) => item.sender === 'user')?.text || '')} />
                          <IconButton icon="volume_up" label="Read aloud" />
                          <IconButton icon="share" label="Share response" />
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {isGenerating && (
                  <article className="ai-message ai-message--ai ai-message--loading">
                    <Avatar name={fullName} photoURL={photoURL} variant="ai" />
                    <div className="ai-message-body">
                      <div className="ai-thinking">
                        <span>{statusText}</span>
                        <div>
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </section>

          <Composer
            input={input}
            setInput={setInput}
            onSend={() => sendMessage()}
            selectedItems={selectedItems}
            onRemoveSelected={removeSelected}
            onOpenDrawer={() => setDrawerOpen(true)}
            isGenerating={isGenerating}
          />
        </div>
      </section>

      <RightContextPanel
        collapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed((current) => !current)}
        selectedItems={selectedItems}
        onQuickAction={handleQuickAction}
      />

      <AttachmentDrawer
        open={drawerOpen}
        semesters={semesters}
        selectedItems={selectedItems}
        onToggleSelected={toggleSelected}
        onRemoveSelected={removeSelected}
        onClose={() => setDrawerOpen(false)}
      />
    </main>
  );
}

export default AITutorPage;


