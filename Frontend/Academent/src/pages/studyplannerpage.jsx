import { useEffect, useMemo, useState } from 'react';
import useNoteManagement from '../Services/useNoteManagement';
import {
  deleteStudyPlannerEvent,
  markStudyPlannerEventCompleted,
  saveStudyPlannerEvent,
  subscribeStudyPlannerEvents,
} from '../Services/studyPlannerService';
import './studyplannerpage.css';

const eventTypes = {
  exam: { label: 'Exam', plural: 'Exams', icon: 'school', color: '#D92D20', bg: '#FFF1F0' },
  assignment: { label: 'Assignment', plural: 'Assignments', icon: 'assignment', color: '#4D2B8C', bg: '#F1EAFF' },
  task: { label: 'Task', plural: 'Tasks', icon: 'check_circle', color: '#A86800', bg: '#FFF4D8' },
  studyPlan: { label: 'Study Plan', plural: 'Study Plans', icon: 'menu_book', color: '#087443', bg: '#E9F8EF' },
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];
const priorityOptions = [
  { value: 'low', label: 'Low', icon: 'keyboard_arrow_down' },
  { value: 'medium', label: 'Medium', icon: 'drag_handle' },
  { value: 'high', label: 'High', icon: 'priority_high' },
];
const repeatOptions = [
  { value: 'none', label: 'None', icon: 'event' },
  { value: 'daily', label: 'Daily', icon: 'today' },
  { value: 'weekly', label: 'Weekly', icon: 'date_range' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar_month' },
];
const reminderOptions = [
  { value: '0', label: 'No reminder', icon: 'notifications_off' },
  { value: '10', label: '10 minutes before', icon: 'notifications' },
  { value: '30', label: '30 minutes before', icon: 'notifications_active' },
  { value: '120', label: '2 hours before', icon: 'schedule' },
  { value: '1440', label: '1 day before', icon: 'event_upcoming' },
];
const typeOptions = Object.entries(eventTypes).map(([value, meta]) => ({ value, label: meta.label, icon: meta.icon }));
const filterOptions = [{ value: 'all', label: 'All', icon: 'select_all' }, ...typeOptions];

const toDateInput = (date) => {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};
const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const slotToTime = (slot = '09:00') => {
  if (slot.includes(':')) return slot;
  const [hourText, period] = slot.split(' ');
  let hour = parseInt(hourText, 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:00`;
};
const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date(2026, 0, 1, hours, mins + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfWeek = (date) => addDays(date, -date.getDay());
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const formatMonth = (date) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
const formatDay = (date) => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
const formatShortDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
const titleOrFallback = (item, fallback) => item?.title || item?.name || fallback;
const getMonthDays = (date) => {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(gridStart, index);
    return { date: day, currentMonth: day.getMonth() === first.getMonth(), today: sameDay(day, new Date()), key: day.toISOString() };
  });
};
const getWeekDays = (date) => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(date), index));
const emptyEventForm = (date = new Date(), type = 'studyPlan') => ({
  title: '', type, date: toDateInput(date), startTime: '09:00', endTime: '10:00', priority: 'medium', repeat: 'none', reminderMinutes: '30', description: '', semesterId: '', moduleId: '', folderId: '', folderPath: [], selectedNoteIds: [], selectedPdfIds: [], studyTopic: '', studyGoals: '', durationMinutes: '60', status: 'pending',
});

const flattenMaterials = (semesters = []) => {
  const materials = [];
  const modules = [];
  const pushMaterial = ({ item, type, semester, module, folder = null, folderPath = [], pathLabels = [] }) => {
    const id = type === 'note' ? item.noteId : item.pdfId;
    if (!id) return;
    materials.push({ id, type, title: titleOrFallback(item, type === 'note' ? 'Untitled note' : 'Untitled PDF'), semesterId: semester.semesterId, moduleId: module.moduleId, folderId: folder?.folderId || '', folderPath, pathLabels: [titleOrFallback(semester, 'Semester'), titleOrFallback(module, 'Module'), ...pathLabels] });
  };
  const visitFolder = (folder, semester, module, pathIds = [], pathLabels = []) => {
    const nextIds = [...pathIds, folder.folderId].filter(Boolean);
    const nextLabels = [...pathLabels, titleOrFallback(folder, 'Folder')];
    (folder.notes || []).forEach((note) => pushMaterial({ item: note, type: 'note', semester, module, folder, folderPath: nextIds, pathLabels: nextLabels }));
    (folder.pdfs || []).forEach((pdf) => pushMaterial({ item: pdf, type: 'pdf', semester, module, folder, folderPath: nextIds, pathLabels: nextLabels }));
    (folder.folders || []).forEach((child) => visitFolder(child, semester, module, nextIds, nextLabels));
  };
  semesters.forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      modules.push({ value: module.moduleId, label: titleOrFallback(module, 'Module'), semesterId: semester.semesterId, icon: 'view_module' });
      (module.notes || []).forEach((note) => pushMaterial({ item: note, type: 'note', semester, module }));
      (module.pdfs || []).forEach((pdf) => pushMaterial({ item: pdf, type: 'pdf', semester, module }));
      (module.folders || []).forEach((folder) => visitFolder(folder, semester, module));
    });
  });
  return { materials, modules };
};

function CustomSelect({ label, value, options, onChange, placeholder = 'Select an option', icon = 'expand_more', searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <label className="planner-field planner-custom-select">
      {label && <span className="planner-field-label">{label}</span>}
      <button type="button" className={`planner-select-trigger ${selected ? 'has-value' : ''} ${open ? 'is-open' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((state) => !state)}>
        <span className="material-symbols-outlined">{selected?.icon || icon}</span><strong>{selected?.label || placeholder}</strong><span className="material-symbols-outlined">expand_more</span>
      </button>
      {open && <div className="planner-select-menu" role="listbox">
        {searchable && <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search options" autoFocus />}
        {visibleOptions.length ? visibleOptions.map((option) => <button type="button" key={option.value} className={option.value === value ? 'selected' : ''} role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); setQuery(''); }}><span className="material-symbols-outlined">{option.icon || 'radio_button_unchecked'}</span><span>{option.label}</span></button>) : <p className="planner-select-empty">No options found</p>}
      </div>}
    </label>
  );
}

function NotesTree({ data, selectedNoteIds, selectedPdfIds, onToggle }) {
  const [expanded, setExpanded] = useState({});
  const toggleExpanded = (id) => setExpanded((state) => ({ ...state, [id]: !state[id] }));
  const renderMaterial = (item, type, context) => {
    const id = type === 'note' ? item.noteId : item.pdfId;
    const checked = type === 'note' ? selectedNoteIds.includes(id) : selectedPdfIds.includes(id);
    return <label className="planner-material-row" key={`${type}-${id}`}><input type="checkbox" checked={checked} onChange={() => onToggle({ item, type, ...context })} /><span className="material-symbols-outlined">{type === 'note' ? 'description' : 'picture_as_pdf'}</span><strong>{titleOrFallback(item, type === 'note' ? 'Untitled note' : 'Untitled PDF')}</strong></label>;
  };
  const renderFolder = (folder, context, depth = 0) => {
    const id = folder.folderId;
    const isOpen = expanded[id] ?? depth < 1;
    const nextContext = { ...context, folder, folderPath: [...context.folderPath, id].filter(Boolean), pathLabels: [...context.pathLabels, titleOrFallback(folder, 'Folder')] };
    return <div className="planner-tree-node" key={id} style={{ '--tree-depth': depth }}><button type="button" className="planner-tree-toggle" onClick={() => toggleExpanded(id)}><span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span><span className="material-symbols-outlined">folder</span><strong>{titleOrFallback(folder, 'Folder')}</strong></button>{isOpen && <div className="planner-tree-children">{(folder.notes || []).map((note) => renderMaterial(note, 'note', nextContext))}{(folder.pdfs || []).map((pdf) => renderMaterial(pdf, 'pdf', nextContext))}{(folder.folders || []).map((child) => renderFolder(child, nextContext, depth + 1))}</div>}</div>;
  };
  if (!(data.semesters || []).length) return <div className="planner-notes-empty"><span className="material-symbols-outlined">folder_off</span><strong>No notes available</strong><p>Create notes or upload PDFs in My Notes, then attach them to a study plan.</p></div>;
  return <div className="planner-notes-tree">{(data.semesters || []).map((semester) => {
    const semesterOpen = expanded[semester.semesterId] ?? true;
    return <div className="planner-tree-node" key={semester.semesterId}><button type="button" className="planner-tree-toggle semester" onClick={() => toggleExpanded(semester.semesterId)}><span className="material-symbols-outlined">{semesterOpen ? 'expand_more' : 'chevron_right'}</span><span className="material-symbols-outlined">school</span><strong>{titleOrFallback(semester, 'Semester')}</strong></button>{semesterOpen && (semester.modules || []).map((module) => {
      const moduleOpen = expanded[module.moduleId] ?? true;
      const context = { semester, module, folder: null, folderPath: [], pathLabels: [] };
      return <div className="planner-tree-node" key={module.moduleId}><button type="button" className="planner-tree-toggle module" onClick={() => toggleExpanded(module.moduleId)}><span className="material-symbols-outlined">{moduleOpen ? 'expand_more' : 'chevron_right'}</span><span className="material-symbols-outlined">view_module</span><strong>{titleOrFallback(module, 'Module')}</strong></button>{moduleOpen && <div className="planner-tree-children">{(module.notes || []).map((note) => renderMaterial(note, 'note', context))}{(module.pdfs || []).map((pdf) => renderMaterial(pdf, 'pdf', context))}{(module.folders || []).map((folder) => renderFolder(folder, context))}</div>}</div>;
    })}</div>;
  })}</div>;
}

function StudyPlannerPage({ profile, currentUser }) {
  const uid = currentUser?.uid || null;
  const notes = useNoteManagement();
  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 720 ? 'Agenda' : 'Month'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [calendarVisibility, setCalendarVisibility] = useState({ exam: true, assignment: true, task: true, studyPlan: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyEventForm(new Date(), 'studyPlan'));
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const noteIndex = useMemo(() => flattenMaterials(notes.data?.semesters || []), [notes.data]);
  const materialMap = useMemo(() => new Map(noteIndex.materials.map((item) => [`${item.type}-${item.id}`, item])), [noteIndex.materials]);
  const semesterOptions = useMemo(() => (notes.data?.semesters || []).map((semester) => ({ value: semester.semesterId, label: titleOrFallback(semester, 'Semester'), icon: 'school' })), [notes.data]);
  const moduleOptions = useMemo(() => noteIndex.modules.filter((module) => !form.semesterId || module.semesterId === form.semesterId), [form.semesterId, noteIndex.modules]);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setEvents([]);
        setEventsLoading(false);
      });
      return () => { cancelled = true; };
    }
    Promise.resolve().then(() => {
      if (!cancelled) setEventsLoading(true);
    });
    const unsubscribe = subscribeStudyPlannerEvents(uid, (items) => {
      setEvents(items);
      setEventsLoading(false);
    }, (error) => {
      setToast({ type: 'error', message: error.message || 'Could not load planner events.' });
      setEventsLoading(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return events.filter((event) => calendarVisibility[event.type]).filter((event) => filterType === 'all' || event.type === filterType).filter((event) => {
      if (!term) return true;
      const moduleName = noteIndex.modules.find((module) => module.value === event.moduleId)?.label || '';
      return [event.title, event.description, event.studyTopic, event.studyGoals, moduleName].some((value) => String(value || '').toLowerCase().includes(term));
    }).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [calendarVisibility, events, filterType, noteIndex.modules, searchTerm]);

  const upcomingEvents = useMemo(() => {
    const today = toDateInput(new Date());
    return filteredEvents.filter((event) => event.date >= today).slice(0, 4);
  }, [filteredEvents]);
  const selectedMaterials = useMemo(() => {
    const selectedNotes = form.selectedNoteIds.map((id) => materialMap.get(`note-${id}`) || { id, type: 'note', title: id, pathLabels: [] });
    const selectedPdfs = form.selectedPdfIds.map((id) => materialMap.get(`pdf-${id}`) || { id, type: 'pdf', title: id, pathLabels: [] });
    return [...selectedNotes, ...selectedPdfs];
  }, [form.selectedNoteIds, form.selectedPdfIds, materialMap]);
  const currentLabel = useMemo(() => {
    if (view === 'Day') return formatDay(currentDate);
    if (view === 'Week') { const start = startOfWeek(currentDate); const end = addDays(start, 6); return `${formatShortDate(start)} - ${formatShortDate(end)}, ${end.getFullYear()}`; }
    if (view === 'Agenda') return 'Upcoming agenda';
    return formatMonth(currentDate);
  }, [currentDate, view]);

  const eventsForDate = (date) => filteredEvents.filter((event) => event.date === toDateInput(date));
  const moduleTitle = (event) => noteIndex.modules.find((module) => module.value === event.moduleId)?.label || event.moduleId || 'No module selected';
  const eventMaterials = (event) => [...(event.selectedNoteIds || []).map((id) => materialMap.get(`note-${id}`) || { id, type: 'note', title: id }), ...(event.selectedPdfIds || []).map((id) => materialMap.get(`pdf-${id}`) || { id, type: 'pdf', title: id })];

  const openCreateModal = (date = currentDate, startLabel = '09:00', type = 'studyPlan') => {
    const startTime = slotToTime(startLabel);
    setEditingId(null);
    setForm({ ...emptyEventForm(date, type), startTime, endTime: addMinutesToTime(startTime, type === 'studyPlan' ? 60 : 45) });
    setFormErrors({}); setSelectedEvent(null); setModalOpen(true);
  };
  const openEditModal = (event) => {
    setEditingId(event.eventId || event.id);
    setForm({ ...emptyEventForm(new Date(event.date), event.type), ...event, reminderMinutes: event.reminder?.enabled ? String(event.reminder.beforeMinutes || 30) : '0', durationMinutes: String(event.durationMinutes || 60), selectedNoteIds: event.selectedNoteIds || [], selectedPdfIds: event.selectedPdfIds || [] });
    setFormErrors({}); setSelectedEvent(null); setModalOpen(true);
  };
  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Add a title for this event.';
    if (!form.type) errors.type = 'Choose an event type.';
    if (!form.date) errors.date = 'Choose a date.';
    if (!form.startTime) errors.startTime = 'Choose a start time.';
    if (!form.endTime) errors.endTime = 'Choose an end time.';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) errors.endTime = 'End time must be after start time.';
    if (form.type === 'studyPlan' && !form.studyTopic.trim() && !form.studyGoals.trim() && !form.selectedNoteIds.length && !form.selectedPdfIds.length) errors.studyPlan = 'Add a topic, study goal, note, or PDF for this study plan.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSave = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!uid) { setToast({ type: 'error', message: 'Please sign in before saving planner events.' }); return; }
    if (!validateForm()) return;
    setSaving(true);
    try {
      await saveStudyPlannerEvent(uid, { ...form, reminder: { enabled: form.reminderMinutes !== '0', beforeMinutes: Number(form.reminderMinutes || 0) }, status: form.status || 'pending', durationMinutes: Number(form.durationMinutes || 0) }, editingId);
      setToast({ type: 'success', message: editingId ? 'Event updated.' : 'Event saved to your planner.' });
      setModalOpen(false); setEditingId(null);
    } catch (error) { setToast({ type: 'error', message: error.message || 'Could not save this event.' }); } finally { setSaving(false); }
  };
  const handleDelete = (event) => {
    setDeleteCandidate(event);
  };
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await deleteStudyPlannerEvent(uid, deleteCandidate.eventId || deleteCandidate.id);
      setSelectedEvent(null);
      setDeleteCandidate(null);
      setToast({ type: 'success', message: 'Event deleted.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Could not delete this event.' });
    } finally {
      setDeleting(false);
    }
  };
  const handleComplete = async (event) => {
    try { await markStudyPlannerEventCompleted(uid, event.eventId || event.id); setSelectedEvent(null); setToast({ type: 'success', message: 'Marked as completed.' }); }
    catch (error) { setToast({ type: 'error', message: error.message || 'Could not update this event.' }); }
  };
  const handleMaterialToggle = ({ item, type, semester, module, folder, folderPath }) => {
    const id = type === 'note' ? item.noteId : item.pdfId;
    setForm((current) => {
      const key = type === 'note' ? 'selectedNoteIds' : 'selectedPdfIds';
      const exists = current[key].includes(id);
      return { ...current, semesterId: current.semesterId || semester.semesterId || '', moduleId: current.moduleId || module.moduleId || '', folderId: current.folderId || folder?.folderId || '', folderPath: current.folderPath.length ? current.folderPath : folderPath, [key]: exists ? current[key].filter((selectedId) => selectedId !== id) : [...current[key], id] };
    });
  };
  const removeMaterial = (material) => setForm((current) => ({ ...current, selectedNoteIds: material.type === 'note' ? current.selectedNoteIds.filter((id) => id !== material.id) : current.selectedNoteIds, selectedPdfIds: material.type === 'pdf' ? current.selectedPdfIds.filter((id) => id !== material.id) : current.selectedPdfIds }));

  const renderEventChip = (event, compact = false) => {
    const type = eventTypes[event.type] || eventTypes.task;
    return <button key={event.eventId || event.id} type="button" className={`planner-event-chip ${compact ? 'compact' : ''} ${event.status === 'completed' ? 'completed' : ''}`} style={{ '--event-color': type.color, '--event-bg': type.bg }} onClick={(clickEvent) => { clickEvent.stopPropagation(); setSelectedEvent(event); }}><span className="material-symbols-outlined">{type.icon}</span><span className="planner-event-copy"><strong>{event.title}</strong>{!compact && <small>{event.startTime} - {moduleTitle(event)}</small>}</span></button>;
  };
  const renderSkeleton = () => <div className="planner-skeleton-grid">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div>;
  const renderMonthView = () => <div className="planner-month-grid">{weekDays.map((day) => <div className="planner-day-name" key={day}>{day}</div>)}{monthDays.map((day) => { const dayEvents = eventsForDate(day.date); return <button type="button" key={day.key} className={`planner-date-cell ${day.currentMonth ? '' : 'muted'} ${day.today ? 'today' : ''}`} onClick={() => openCreateModal(day.date)}><span className="planner-date-number">{day.date.getDate()}</span><div className="planner-cell-events">{dayEvents.slice(0, 3).map((event) => renderEventChip(event, true))}{dayEvents.length > 3 && <span className="planner-more-events">+{dayEvents.length - 3} more</span>}</div></button>; })}</div>;
  const renderWeekView = () => <div className="planner-week-grid"><div className="planner-time-spacer" />{weekDates.map((date) => <button key={date.toISOString()} className={`planner-week-heading ${sameDay(date, new Date()) ? 'today' : ''}`} type="button" onClick={() => { setCurrentDate(date); setView('Day'); }}><span>{weekDays[date.getDay()]}</span><strong>{date.getDate()}</strong></button>)}{timeSlots.map((slot) => <div className="planner-week-row" key={slot}><div className="planner-time-label">{slot}</div>{weekDates.map((date) => { const slotHour = slotToTime(slot).slice(0, 2); const dayEvents = eventsForDate(date).filter((event) => event.startTime.slice(0, 2) === slotHour); return <button type="button" className="planner-time-cell" key={`${slot}-${date.toISOString()}`} onClick={() => openCreateModal(date, slot)}>{dayEvents.map((event) => renderEventChip(event))}</button>; })}</div>)}</div>;
  const renderDayView = () => <div className="planner-day-view">{timeSlots.map((slot) => { const slotHour = slotToTime(slot).slice(0, 2); const dayEvents = eventsForDate(currentDate).filter((event) => event.startTime.slice(0, 2) === slotHour); return <div className="planner-day-slot" key={slot}><div className="planner-time-label">{slot}</div><button type="button" className="planner-day-dropzone" onClick={() => openCreateModal(currentDate, slot)}>{dayEvents.length ? dayEvents.map((event) => renderEventChip(event)) : <span>Tap to schedule</span>}</button></div>; })}</div>;
  const renderAgendaView = () => <div className="planner-agenda-list">{filteredEvents.map((event) => { const type = eventTypes[event.type] || eventTypes.task; return <button type="button" className="planner-agenda-item" key={event.eventId || event.id} onClick={() => setSelectedEvent(event)}><span className="planner-agenda-date">{formatShortDate(new Date(event.date))}</span><span className="planner-agenda-icon" style={{ background: type.bg, color: type.color }}><span className="material-symbols-outlined">{type.icon}</span></span><span className="planner-agenda-copy"><strong>{event.title}</strong><small>{event.startTime} - {event.endTime} - {moduleTitle(event)}</small></span><span className="planner-priority">{event.priority}</span></button>; })}</div>;
  const renderCalendarBody = () => {
    if (eventsLoading) return renderSkeleton();
    if (!filteredEvents.length) return <div className="planner-empty-state"><div className="planner-empty-illustration" aria-hidden="true"><span className="material-symbols-outlined">event_available</span><span className="planner-empty-dot one" /><span className="planner-empty-dot two" /></div><h3>No study plans yet</h3><p>Start by scheduling your first exam, assignment, task, or study session.</p><button type="button" onClick={() => openCreateModal(new Date())}><span className="material-symbols-outlined">add</span>Create Your First Plan</button></div>;
    if (view === 'Week') return renderWeekView();
    if (view === 'Day') return renderDayView();
    if (view === 'Agenda') return renderAgendaView();
    return renderMonthView();
  };

  return (
    <main className="study-planner-page">
      {toast && <div className={`planner-toast ${toast.type}`}><span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>{toast.message}</div>}
      <section className="planner-topbar"><div><p className="planner-kicker">Academent calendar</p><h1>Study Planner</h1><p>Plan exams, assignments, tasks, and study sessions in one place.</p></div><div className="planner-header-actions"><label className="planner-search"><span className="material-symbols-outlined">search</span><input type="search" placeholder="Search scheduled events" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><button type="button" className="planner-create-button" onClick={() => openCreateModal(new Date())}><span className="material-symbols-outlined">add</span>Create Event</button><div className="planner-profile">{photoURL ? <img src={photoURL} alt="Student profile" /> : <span>{fullName.charAt(0).toUpperCase()}</span>}<div><strong>{fullName.split(' ')[0]}</strong><small>Realtime planner</small></div></div></div></section>
      <section className="planner-shell"><aside className="planner-sidebar"><div className="planner-mini-calendar"><div className="planner-mini-header"><strong>{formatMonth(currentDate)}</strong><button type="button" onClick={() => setCurrentDate(new Date())}>Today</button></div><div className="planner-mini-grid">{weekDays.map((day) => <span key={day}>{day.slice(0, 1)}</span>)}{monthDays.slice(0, 35).map((day) => <button type="button" key={`mini-${day.key}`} className={`${day.currentMonth ? '' : 'muted'} ${sameDay(day.date, currentDate) ? 'selected' : ''}`} onClick={() => setCurrentDate(day.date)}>{day.date.getDate()}</button>)}</div></div><div className="planner-side-section"><h2>My Calendars</h2>{Object.keys(eventTypes).map((type) => <label className="planner-calendar-toggle" key={type}><input type="checkbox" checked={calendarVisibility[type]} onChange={() => setCalendarVisibility((state) => ({ ...state, [type]: !state[type] }))} /><span style={{ background: eventTypes[type].color }} />{eventTypes[type].plural}</label>)}</div><div className="planner-side-section"><h2>Upcoming Deadlines</h2><div className="planner-deadlines">{eventsLoading ? <p className="planner-side-muted">Loading deadlines...</p> : upcomingEvents.map((event) => <button type="button" key={event.eventId || event.id} onClick={() => setSelectedEvent(event)}><span style={{ background: eventTypes[event.type]?.bg, color: eventTypes[event.type]?.color }}><span className="material-symbols-outlined">{eventTypes[event.type]?.icon}</span></span><strong>{event.title}</strong><small>{formatShortDate(new Date(event.date))} - {event.startTime}</small></button>)}</div></div><div className="planner-side-section"><h2>Quick Create</h2><div className="planner-quick-buttons">{Object.entries(eventTypes).map(([type, meta]) => <button type="button" key={type} onClick={() => openCreateModal(currentDate, '09:00', type)}><span className="material-symbols-outlined">{meta.icon}</span>Add {meta.label}</button>)}</div></div></aside>
        <section className="planner-calendar-panel"><div className="planner-toolbar"><div className="planner-toolbar-left"><button type="button" onClick={() => setCurrentDate(new Date())}>Today</button><div className="planner-nav-buttons"><button type="button" aria-label="Previous" onClick={() => setCurrentDate((date) => view === 'Day' ? addDays(date, -1) : view === 'Week' ? addDays(date, -7) : new Date(date.getFullYear(), date.getMonth() - 1, 1))}><span className="material-symbols-outlined">chevron_left</span></button><button type="button" aria-label="Next" onClick={() => setCurrentDate((date) => view === 'Day' ? addDays(date, 1) : view === 'Week' ? addDays(date, 7) : new Date(date.getFullYear(), date.getMonth() + 1, 1))}><span className="material-symbols-outlined">chevron_right</span></button></div><h2>{currentLabel}</h2></div><div className="planner-toolbar-right"><div className="planner-view-switcher">{['Month', 'Week', 'Day', 'Agenda'].map((option) => <button type="button" key={option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>)}</div><CustomSelect value={filterType} options={filterOptions} onChange={setFilterType} placeholder="Filter events" icon="filter_list" /></div></div><div className="planner-calendar-body">{renderCalendarBody()}</div></section></section>
      <button type="button" className="planner-mobile-fab" aria-label="Create event" onClick={() => openCreateModal(new Date())}><span className="material-symbols-outlined">add</span></button>
      {modalOpen && <div className="planner-modal-backdrop" role="presentation" onMouseDown={() => !saving && setModalOpen(false)}><form className="planner-modal" onSubmit={handleSave} onMouseDown={(event) => event.stopPropagation()}><div className="planner-modal-header"><div><p>{editingId ? 'Edit schedule' : 'Create schedule'}</p><h2>{form.type === 'studyPlan' ? 'Study Plan Scheduling' : 'Event Details'}</h2></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal" disabled={saving}><span className="material-symbols-outlined">close</span></button></div>{Object.keys(formErrors).length > 0 && <div className="planner-form-errors">{Object.values(formErrors).map((error) => <p key={error}>{error}</p>)}</div>}<div className="planner-form-grid"><label className="planner-field wide"><span className="planner-field-label">Event title</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Database normalization review" /></label><CustomSelect label="Event type" value={form.type} options={typeOptions} onChange={(value) => setForm({ ...form, type: value })} /><label className="planner-field"><span className="planner-field-label">Date</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label className="planner-field"><span className="planner-field-label">Start time</span><input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label className="planner-field"><span className="planner-field-label">End time</span><input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label><CustomSelect label="Priority" value={form.priority} options={priorityOptions} onChange={(value) => setForm({ ...form, priority: value })} /><CustomSelect label="Repeat" value={form.repeat} options={repeatOptions} onChange={(value) => setForm({ ...form, repeat: value })} /><CustomSelect label="Reminder" value={form.reminderMinutes} options={reminderOptions} onChange={(value) => setForm({ ...form, reminderMinutes: value })} /><CustomSelect label="Semester" value={form.semesterId} options={semesterOptions} onChange={(value) => setForm({ ...form, semesterId: value, moduleId: '' })} placeholder="Choose semester" searchable /><CustomSelect label="Subject/module" value={form.moduleId} options={moduleOptions} onChange={(value) => setForm({ ...form, moduleId: value })} placeholder="Choose module" searchable />{form.type === 'studyPlan' && <><label className="planner-field"><span className="planner-field-label">Study topic</span><input value={form.studyTopic} onChange={(event) => setForm({ ...form, studyTopic: event.target.value })} placeholder="Topic to revise" /></label><label className="planner-field"><span className="planner-field-label">Duration minutes</span><input type="number" min="15" step="15" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></label><label className="planner-field wide"><span className="planner-field-label">Study goals</span><textarea value={form.studyGoals} onChange={(event) => setForm({ ...form, studyGoals: event.target.value })} placeholder="What should be done by the end of this session?" /></label><div className="planner-notes-selector wide"><div className="planner-notes-heading"><span><strong>Related uploaded notes and PDFs</strong><small>Select multiple materials from your hierarchy.</small></span>{notes.loading && <em>Loading...</em>}</div>{notes.loading ? renderSkeleton() : <NotesTree data={notes.data} selectedNoteIds={form.selectedNoteIds} selectedPdfIds={form.selectedPdfIds} onToggle={handleMaterialToggle} />}{selectedMaterials.length > 0 && <div className="planner-selected-materials">{selectedMaterials.map((material) => <button type="button" key={`${material.type}-${material.id}`} onClick={() => removeMaterial(material)}><span className="material-symbols-outlined">{material.type === 'note' ? 'description' : 'picture_as_pdf'}</span>{material.title}<span className="material-symbols-outlined">close</span></button>)}</div>}</div></>}<label className="planner-field wide"><span className="planner-field-label">Description / notes</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add instructions, links, chapters, or reminders" /></label></div><div className="planner-modal-actions"><button type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div></form></div>}
      {deleteCandidate && <div className="planner-confirm-backdrop" role="presentation" onMouseDown={() => !deleting && setDeleteCandidate(null)}><section className="planner-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="planner-delete-title" onMouseDown={(event) => event.stopPropagation()}><div className="planner-confirm-icon"><span className="material-symbols-outlined">delete</span></div><div><p className="planner-confirm-kicker">Delete schedule</p><h2 id="planner-delete-title">Delete this plan?</h2><p>This will permanently remove <strong>{deleteCandidate.title}</strong> from your Study Planner.</p></div><div className="planner-confirm-actions"><button type="button" onClick={() => setDeleteCandidate(null)} disabled={deleting}>Cancel</button><button type="button" className="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete plan'}</button></div></section></div>}      {selectedEvent && <div className="planner-details-backdrop" role="presentation" onMouseDown={() => setSelectedEvent(null)}><aside className="planner-details-panel" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="planner-details-close" onClick={() => setSelectedEvent(null)} aria-label="Close details"><span className="material-symbols-outlined">close</span></button><div className="planner-details-icon" style={{ background: eventTypes[selectedEvent.type]?.bg, color: eventTypes[selectedEvent.type]?.color }}><span className="material-symbols-outlined">{eventTypes[selectedEvent.type]?.icon}</span></div><p className="planner-details-type">{eventTypes[selectedEvent.type]?.label}</p><h2>{selectedEvent.title}</h2><div className="planner-details-list"><span><strong>Date and time</strong>{formatShortDate(new Date(selectedEvent.date))}, {selectedEvent.startTime} - {selectedEvent.endTime}</span><span><strong>Subject/module</strong>{moduleTitle(selectedEvent)}</span><span><strong>Priority</strong>{selectedEvent.priority}</span><span><strong>Reminder</strong>{selectedEvent.reminder?.enabled ? `${selectedEvent.reminder.beforeMinutes} minutes before` : 'No reminder'}</span>{selectedEvent.type === 'studyPlan' && <><span><strong>Study topic</strong>{selectedEvent.studyTopic || 'Not set'}</span><span><strong>Duration</strong>{selectedEvent.durationMinutes || 60} minutes</span><span><strong>Study goals</strong>{selectedEvent.studyGoals || 'No goals added yet'}</span><span><strong>Selected materials</strong>{eventMaterials(selectedEvent).length ? eventMaterials(selectedEvent).map((item) => item.title).join(', ') : 'No notes or PDFs selected'}</span></>}<span><strong>Description</strong>{selectedEvent.description || 'No description added.'}</span></div><div className="planner-details-actions"><button type="button" onClick={() => openEditModal(selectedEvent)}><span className="material-symbols-outlined">edit</span>Edit</button><button type="button" className="danger" onClick={() => handleDelete(selectedEvent)}><span className="material-symbols-outlined">delete</span>Delete</button>{(selectedEvent.type === 'task' || selectedEvent.type === 'studyPlan') && <button type="button" className="complete" onClick={() => handleComplete(selectedEvent)}><span className="material-symbols-outlined">done_all</span>{selectedEvent.status === 'completed' ? 'Completed' : 'Mark as completed'}</button>}</div></aside></div>}
    </main>
  );
}

export default StudyPlannerPage;
