import { useEffect, useMemo, useRef, useState } from 'react';
import useNoteManagement from '../Services/useNoteManagement';
import { createTutorConversation, deleteTutorConversation, loadTutorContextMaterials, saveTutorMessage, sendTutorMessage, subscribeTutorConversations, subscribeTutorMessages, updateTutorConversationAfterMessage } from '../Services/aiTutorService';
import { createGeneratedQuizFromKnowledge } from '../Services/quizService';
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const isQuizGenerationRequest = (value = '') => /\b(generate|create|make|build)\b[\s\S]{0,40}\bquiz\b/i.test(value) || /\bquiz\b[\s\S]{0,30}\b(from|using|on|about)\b/i.test(value);

const getQuizQuestionCount = (value = '') => {
  const match = String(value).match(/(\d+)\s*(?:question|questions|q\b|-question)/i);
  return clamp(match ? Number(match[1]) : 6, 1, 20);
};

const getQuizDifficulty = (value = '') => {
  const normalized = String(value).toLowerCase();
  if (/\bhard|advanced|difficult\b/.test(normalized)) return 'hard';
  if (/\beasy|simple|basic\b/.test(normalized)) return 'easy';
  return 'medium';
};

const getQuizTitle = (value = '', selectedItems = []) => {
  const materialTitle = selectedItems[0]?.title;
  const trimmed = String(value).replace(/\s+/g, ' ').trim();
  if (materialTitle) return `AI Tutor Quiz - ${materialTitle}`;
  return trimmed ? `AI Tutor Quiz - ${trimmed.slice(0, 42)}` : 'AI Tutor Quiz';
};

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
        pdfs: [{ pdfId: 'demo-bio-pdf', title: 'Chapter 4.pdf', url: '', content: 'Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs light in chloroplasts.' }],
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
                pdfs: [{ pdfId: 'demo-review-pdf', title: 'Review Sheet.pdf', url: '', content: 'Review photosynthesis, respiration, cell organelles, and plant transport systems.' }],
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
        pdfs: [{ pdfId: 'demo-newton-pdf', title: 'Newton Laws.pdf', url: '', content: 'Newton second law: force equals mass times acceleration. F = ma.' }],
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
      sourceId: note.noteId,
      type: 'note',
      title: note.title,
      path: folderPath,
      semesterId,
      moduleId,
      content: note.content,
      icon: 'description',
    }));

    (folder.pdfs || []).forEach((pdf) => materials.push({
      id: pdf.pdfId,
      sourceId: pdf.pdfId,
      type: 'pdf',
      title: pdf.title,
      path: folderPath,
      semesterId,
      moduleId,
      content: pdf.extractedText || pdf.content || '',
      url: pdf.url,
      icon: 'picture_as_pdf',
    }));

    (folder.folders || []).forEach((child) => visitFolder(child, folderPath, semesterId, moduleId));
  };

  semesters.forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

      (module.notes || []).forEach((note) => materials.push({
        id: note.noteId,
        sourceId: note.noteId,
        type: 'note',
        title: note.title,
        path: modulePath,
        semesterId: semester.semesterId,
        moduleId: module.moduleId,
        content: note.content,
        icon: 'description',
      }));

      (module.pdfs || []).forEach((pdf) => materials.push({
        id: pdf.pdfId,
        sourceId: pdf.pdfId,
        type: 'pdf',
        title: pdf.title,
        path: modulePath,
        semesterId: semester.semesterId,
        moduleId: module.moduleId,
        content: pdf.extractedText || pdf.content || '',
        url: pdf.url,
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

function ResizeHandle({ side, onPointerDown }) {
  return (
    <button
      type="button"
      className={`ai-panel-resize-handle ai-panel-resize-handle--${side}`}
      onPointerDown={(event) => onPointerDown(side, event)}
      aria-label={`Resize ${side === 'left' ? 'chat history' : 'study context'} panel`}
      title={`Resize ${side === 'left' ? 'chat history' : 'study context'} panel`}
    >
      <span />
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

const renderInlineMarkdown = (value, keyPrefix = 'inline') => {
  const parts = String(value || '').split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter((part) => part !== '');

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="ai-inline-code">{part.slice(1, -1)}</code>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
};

const isSeparatorLine = (line = '') => /^[\s|:\-\t]+$/.test(line.trim()) && /-{2,}/.test(line);

const splitTableRow = (line = '') => {
  if (line.includes('\t')) return line.split('\t').map((cell) => cell.trim()).filter(Boolean);
  return line.split('|').map((cell) => cell.trim()).filter(Boolean);
};

const looksLikeTableRow = (line = '') => splitTableRow(line).length >= 2;

const renderTable = (lines, keyPrefix) => {
  const rows = lines
    .filter((line) => !isSeparatorLine(line))
    .map(splitTableRow)
    .filter((row) => row.length >= 2);

  if (!rows.length) return null;

  const [head, ...body] = rows;

  return (
    <div key={keyPrefix} className="ai-message-table-wrap">
      <table>
        <thead>
          <tr>{head.map((cell, index) => <th key={`${keyPrefix}-h-${index}`}>{renderInlineMarkdown(cell, `${keyPrefix}-h-${index}`)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={`${keyPrefix}-r-${rowIndex}`}>
              {row.map((cell, cellIndex) => <td key={`${keyPrefix}-c-${rowIndex}-${cellIndex}`}>{renderInlineMarkdown(cell, `${keyPrefix}-c-${rowIndex}-${cellIndex}`)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function MessageContent({ text }) {
  const normalizedText = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2');
  const blocks = normalizedText.split(/```/g);

  const renderMarkdownLines = (rawBlock, blockIndex) => {
    const lines = rawBlock.split('\n');
    const elements = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length + 1, 5);
        const HeadingTag = `h${level}`;
        elements.push(<HeadingTag key={`${blockIndex}-heading-${index}`}>{renderInlineMarkdown(headingMatch[2], `${blockIndex}-heading-${index}`)}</HeadingTag>);
        index += 1;
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        elements.push(<hr key={`${blockIndex}-hr-${index}`} />);
        index += 1;
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (index < lines.length && lines[index].trim().startsWith('>')) {
          quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
          index += 1;
        }
        elements.push(<blockquote key={`${blockIndex}-quote-${index}`}>{renderInlineMarkdown(quoteLines.join(' '), `${blockIndex}-quote-${index}`)}</blockquote>);
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
          index += 1;
        }
        elements.push(<ul key={`${blockIndex}-ul-${index}`}>{items.map((item, itemIndex) => <li key={`${blockIndex}-ul-${index}-${itemIndex}`}>{renderInlineMarkdown(item, `${blockIndex}-ul-${index}-${itemIndex}`)}</li>)}</ul>);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
          index += 1;
        }
        elements.push(<ol key={`${blockIndex}-ol-${index}`}>{items.map((item, itemIndex) => <li key={`${blockIndex}-ol-${index}-${itemIndex}`}>{renderInlineMarkdown(item, `${blockIndex}-ol-${index}-${itemIndex}`)}</li>)}</ol>);
        continue;
      }

      if (looksLikeTableRow(trimmed)) {
        const tableLines = [];
        while (index < lines.length && (looksLikeTableRow(lines[index]) || isSeparatorLine(lines[index]))) {
          tableLines.push(lines[index]);
          index += 1;
        }
        const table = renderTable(tableLines, `${blockIndex}-table-${index}`);
        if (table) elements.push(table);
        continue;
      }

      const paragraph = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current || /^(#{1,4})\s+/.test(current) || /^---+$/.test(current) || current.startsWith('>') || /^[-*]\s+/.test(current) || /^\d+\.\s+/.test(current) || looksLikeTableRow(current)) break;
        paragraph.push(current);
        index += 1;
      }
      elements.push(<p key={`${blockIndex}-p-${index}`}>{renderInlineMarkdown(paragraph.join(' '), `${blockIndex}-p-${index}`)}</p>);
    }

    return elements;
  };

  return (
    <div className="ai-message-richtext">
      {blocks.flatMap((block, index) => {
        if (index % 2 === 1) {
          return [<pre key={`code-${index}`}><code>{block.replace(/^\w+\n/, '')}</code></pre>];
        }

        return renderMarkdownLines(block, index);
      })}
    </div>
  );
}
const formatConversationTime = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date();
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(date);
};

const getConversationGroupLabel = (dateValue) => {
  if (!(dateValue instanceof Date)) return 'Older';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - target) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 Days';
  if (diffDays <= 30) return 'Last 30 Days';
  return 'Older';
};

const groupConversations = (conversations = []) => {
  const order = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Older'];
  const groups = conversations.reduce((result, conversation) => {
    const label = getConversationGroupLabel(conversation.updatedAtDate);
    if (!result[label]) result[label] = [];
    result[label].push({
      ...conversation,
      time: formatConversationTime(conversation.updatedAtDate),
    });
    return result;
  }, {});

  return order
    .filter((label) => groups[label]?.length)
    .map((label) => ({ label, items: groups[label] }));
};

function ConversationSidebar({ activeId, conversations, loading, onSelect, onNewChat, onDelete, userName, photoURL, email }) {
  const groups = groupConversations(conversations);

  return (
    <aside className="ai-chat-sidebar">
      <button className="ai-new-chat-button" type="button" onClick={onNewChat}>
        <span className="material-symbols-outlined">add</span>
        New Chat
      </button>

      <div className="ai-chat-history custom-scrollbar">
        {loading ? (
          <div className="ai-history-empty">Loading saved chats...</div>
        ) : groups.length ? groups.map((group) => (
          <section key={group.label} className="ai-history-group">
            <h3>{group.label}</h3>
            {group.items.map((item) => (
              <article
                key={item.conversationId || item.id}
                className={`ai-history-item ${activeId === (item.conversationId || item.id) ? 'ai-history-item--active' : ''}`}
                onClick={() => onSelect(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelect(item);
                }}
              >
                <div>
                  <div className="ai-history-title-row">
                    <strong>{item.title || 'New AI Tutor Chat'}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.preview || 'No messages yet'}</p>
                </div>
                <div className="ai-history-actions" aria-label="Conversation actions">
                  <IconButton
                    icon="delete"
                    label="Delete conversation"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.conversationId || item.id);
                    }}
                  />
                </div>
              </article>
            ))}
          </section>
        )) : (
          <div className="ai-history-empty">Start a new chat to save it here.</div>
        )}
      </div>

      <footer className="ai-sidebar-profile">
        <Avatar name={userName} photoURL={photoURL} />
        <div>
          <strong>{userName}</strong>
          <span>{email || 'student@academent.ai'}</span>
        </div>
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
      sourceId: id,
      type,
      title,
      path,
      semesterId,
      moduleId,
      content: item.content || item.extractedText || '',
      url: item.url,
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
        <button type="button" onClick={onOpenDrawer}>Selected Notes ({noteCount})</button>
        <button type="button" onClick={onOpenDrawer}>Selected PDFs ({pdfCount})</button>
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
            <p className="ai-panel-eyebrow">Recently attached</p>
            <div className="ai-panel-list">
              {recentItems.length ? recentItems.map((item) => (
                <article key={item.id}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.type.toUpperCase()}</small>
                  </div>
                </article>
              )) : <p className="ai-panel-muted">Attach notes or PDFs to see them here.</p>}
            </div>
          </section>

          <section>
            <p className="ai-panel-eyebrow">Referenced sources</p>
            {selectedItems.length ? (
              <div className="ai-source-pills">
                {selectedItems.slice(0, 6).map((item) => <span key={item.id}>{item.title}</span>)}
              </div>
            ) : <p className="ai-panel-muted">No sources selected yet.</p>}
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
  const { data: noteData, uid } = useNoteManagement();
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const email = currentUser?.email || '';
  const savedSemesters = noteData?.semesters || [];
  const semesters = savedSemesters.length ? savedSemesters : sampleHierarchy;
  const allMaterials = useMemo(() => flattenMaterials(semesters), [semesters]);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(Boolean(uid));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('Thinking...');
  const [conversationSearch, setConversationSearch] = useState('');
  const [chatSidebarWidth, setChatSidebarWidth] = useState(300);
  const [contextPanelWidth, setContextPanelWidth] = useState(300);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setConversationsLoading(false);
      return undefined;
    }

    setConversationsLoading(true);
    return subscribeTutorConversations(
      uid,
      (items) => {
        setConversations(items);
        setConversationsLoading(false);
      },
      (error) => {
        console.error('Failed to load AI Tutor conversations:', error);
        setConversationsLoading(false);
      },
    );
  }, [uid]);

  useEffect(() => {
    if (!uid || !activeConversationId) {
      setMessages([]);
      return undefined;
    }

    return subscribeTutorMessages(
      uid,
      activeConversationId,
      setMessages,
      (error) => console.error('Failed to load AI Tutor messages:', error),
    );
  }, [activeConversationId, uid]);

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

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => (
      `${conversation.title || ''} ${conversation.preview || ''}`.toLowerCase().includes(query)
    ));
  }, [conversationSearch, conversations]);
  const toggleSelected = (item) => {
    setSelectedItems((current) => {
      if (current.some((selected) => selected.id === item.id)) return current.filter((selected) => selected.id !== item.id);
      return [...current, item];
    });
  };

  const removeSelected = (id) => setSelectedItems((current) => current.filter((item) => item.id !== id));

  const sendMessage = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isGenerating) return;

    if (!uid) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID?.() || `msg-${Date.now()}`,
          sender: 'ai',
          text: 'Please sign in again before using AI Tutor conversations.',
        },
      ]);
      return;
    }

    const previousMessages = messages.slice(-8).map((message) => ({
      sender: message.sender,
      text: message.text,
    }));
    const userMessage = { id: crypto.randomUUID?.() || `msg-${Date.now()}`, sender: 'user', text };
    let conversationId = activeConversationId;

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsGenerating(true);
    setStatusText(selectedItems.length ? 'Loading selected study context...' : 'Thinking...');

    try {
      if (!conversationId) {
        const conversation = await createTutorConversation(uid, { firstMessage: text, selectedItems });
        conversationId = conversation.conversationId || conversation.id;
        setActiveConversationId(conversationId);
      }

      await saveTutorMessage(uid, conversationId, {
        sender: 'user',
        text,
        contextMaterialIds: selectedItems.map((item) => item.id),
      });

      const contextMaterials = await loadTutorContextMaterials(uid, selectedItems);

      if (isQuizGenerationRequest(text)) {
        if (!selectedItems.length) {
          const aiMessage = {
            id: crypto.randomUUID?.() || `msg-${Date.now() + 1}`,
            sender: 'ai',
            text: 'Select one or more notes or PDFs with the + button first, then ask me to generate a quiz. I will save it to the Quiz Generator window automatically.',
          };

          setMessages((current) => [...current, aiMessage]);
          await saveTutorMessage(uid, conversationId, aiMessage);
          return;
        }

        setStatusText('Generating and saving quiz...');
        const quiz = await createGeneratedQuizFromKnowledge(uid, {
          title: getQuizTitle(text, selectedItems),
          difficulty: getQuizDifficulty(text),
          questionCount: getQuizQuestionCount(text),
          selectedItems,
          knowledgeRecords: contextMaterials,
          source: 'ai-tutor',
          conversationId,
        });
        const aiMessage = {
          id: crypto.randomUUID?.() || `msg-${Date.now() + 1}`,
          sender: 'ai',
          text: `Done. I generated "${quiz.title}" with ${quiz.totalQuestions} questions and saved it in Firestore. Open the Quiz Generator window to attempt it.`,
          citations: quiz.selectedMaterials?.slice(0, 4).map((item) => item.title).filter(Boolean) || [],
        };

        setMessages((current) => [...current, aiMessage]);
        await saveTutorMessage(uid, conversationId, aiMessage);
        await updateTutorConversationAfterMessage(uid, conversationId, {
          generatedQuizId: quiz.quizId,
          selectedMaterials: quiz.selectedMaterials,
        });
        return;
      }

      setStatusText(contextMaterials.length ? 'Sending notes and PDFs to AI...' : 'Generating explanation...');

      const reply = await sendTutorMessage({
        message: text,
        contextMaterials,
        history: previousMessages,
      });
      const aiMessage = {
        id: crypto.randomUUID?.() || `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: reply,
        citations: contextMaterials.slice(0, 4).map((item) => item.title).filter(Boolean),
      };

      setMessages((current) => [...current, aiMessage]);
      await saveTutorMessage(uid, conversationId, aiMessage);
      await updateTutorConversationAfterMessage(uid, conversationId, {
        selectedMaterials: selectedItems.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          path: item.path,
        })),
      });
    } catch (error) {
      const errorMessage = {
        id: crypto.randomUUID?.() || `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `I couldn't generate a response yet. ${error.message || 'Please check the backend and try again.'}`,
        citations: selectedItems.slice(0, 3).map((item) => item.title),
      };

      setMessages((current) => [...current, errorMessage]);
      if (conversationId) {
        await saveTutorMessage(uid, conversationId, errorMessage).catch((saveError) => {
          console.error('Failed to save AI Tutor error message:', saveError);
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversationId(conversation.conversationId || conversation.id);
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!uid || !conversationId) return;
    await deleteTutorConversation(uid, conversationId);
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
  };

  const handleQuickAction = (label) => {
    setInput(`${label} from my selected study materials.`);
  };

  const startPanelResize = (side, event) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = side === 'left' ? chatSidebarWidth : contextPanelWidth;

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      if (side === 'left') {
        setChatSidebarWidth(clamp(startWidth + delta, 240, 430));
        return;
      }

      setContextPanelWidth(clamp(startWidth - delta, 240, 440));
    };

    const stopResize = () => {
      document.body.classList.remove('ai-resizing-panels');
      window.removeEventListener('pointermove', handlePointerMove);
    };

    document.body.classList.add('ai-resizing-panels');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize, { once: true });
  };

  const copyText = async (text) => {
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  };

  const readAloud = (text) => {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const shareText = async (text) => {
    if (!text) return;

    if (navigator.share) {
      await navigator.share({ title: 'Academent AI Tutor response', text });
      return;
    }

    await copyText(text);
  };

  const exportConversation = () => {
    if (!messages.length) return;

    const activeConversation = conversations.find((conversation) => conversation.conversationId === activeConversationId || conversation.id === activeConversationId);
    const title = activeConversation?.title || 'AI Tutor Conversation';
    const content = messages.map((message) => `${message.sender === 'user' ? 'You' : 'Academent AI'}:\n${message.text}`).join('\n\n---\n\n');
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '') || 'ai-tutor-conversation'}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const clearCurrentConversation = async () => {
    if (!messages.length && !activeConversationId) return;

    if (!activeConversationId) {
      setMessages([]);
      setInput('');
      return;
    }

    const confirmed = window.confirm('Delete this AI Tutor conversation? This will remove it from saved chats.');
    if (!confirmed) return;

    await handleDeleteConversation(activeConversationId);
    setInput('');
  };

  return (
    <main
      className="ai-tutor-page"
      style={{
        '--ai-chat-sidebar-width': `${chatSidebarWidth}px`,
        '--ai-context-panel-width': `${contextPanelWidth}px`,
      }}
    >
      <ConversationSidebar
        activeId={activeConversationId}
        conversations={filteredConversations}
        loading={conversationsLoading}
        onSelect={handleConversationSelect}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        userName={fullName}
        photoURL={photoURL}
        email={email}
      />

      <ResizeHandle side="left" onPointerDown={startPanelResize} />

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
              <input
                value={conversationSearch}
                placeholder="Search conversations"
                onChange={(event) => setConversationSearch(event.target.value)}
              />
            </label>
            <IconButton icon="ios_share" label="Export conversation" onClick={exportConversation} disabled={!messages.length} />
            <IconButton icon="mop" label="Clear conversation" onClick={clearCurrentConversation} disabled={!messages.length && !activeConversationId} />
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
                          <IconButton icon="content_copy" label="Copy response" onClick={() => copyText(message.text)} />
                          <IconButton icon="autorenew" label="Regenerate response" onClick={() => sendMessage(messages.findLast((item) => item.sender === 'user')?.text || '')} disabled={isGenerating} />
                          <IconButton icon="volume_up" label="Read aloud" onClick={() => readAloud(message.text)} />
                          <IconButton icon="share" label="Share response" onClick={() => shareText(message.text)} />
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

      <ResizeHandle side="right" onPointerDown={startPanelResize} />

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
