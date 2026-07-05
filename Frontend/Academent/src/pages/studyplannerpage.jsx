import { useMemo, useState } from 'react';
import './studyplannerpage.css';

const eventTypes = {
  Exam: { icon: 'school', color: '#D92D20', bg: '#FFF1F0' },
  Assignment: { icon: 'assignment', color: '#4D2B8C', bg: '#F1EAFF' },
  Task: { icon: 'check_circle', color: '#A86800', bg: '#FFF4D8' },
  'Study Plan': { icon: 'menu_book', color: '#087443', bg: '#E9F8EF' },
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];
const repeatOptions = ['None', 'Daily', 'Weekly', 'Monthly'];
const priorities = ['Low', 'Medium', 'High'];
const uploadedNotes = ['Calculus limits notes', 'Organic chemistry lecture PDF', 'Cell biology diagrams', 'Essay rubric and references'];

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

const getMonthDays = (date) => {
  const first = startOfMonth(date);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = addDays(gridStart, index);
    return {
      date: day,
      currentMonth: day.getMonth() === first.getMonth(),
      today: sameDay(day, new Date()),
      key: day.toISOString(),
    };
  });
};

const getWeekDays = (date) => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(date), index));

const emptyEventForm = (date = new Date(), type = 'Study Plan') => ({
  title: '',
  type,
  date: toDateInput(date),
  startTime: '09:00',
  endTime: '10:00',
  repeat: 'None',
  priority: 'Medium',
  description: '',
  subject: '',
  reminder: '30 minutes before',
  topic: '',
  notes: '',
  duration: '60',
  goals: '',
  completed: false,
});

function StudyPlannerPage({ profile, currentUser }) {
  const subjects = useMemo(() => {
    const saved = profile?.academicProfile?.subjects;
    return Array.isArray(saved) && saved.length ? saved : ['Calculus II', 'Organic Chemistry', 'Cell Biology', 'Academic Writing'];
  }, [profile]);

  const initialEvents = useMemo(() => {
    const today = new Date();
    return [
      {
        id: 1,
        title: 'Calculus Midterm',
        type: 'Exam',
        date: toDateInput(addDays(today, 3)),
        startTime: '09:00',
        endTime: '10:30',
        repeat: 'None',
        priority: 'High',
        description: 'Chapters 4-6, focus on limits and derivatives.',
        subject: subjects[0],
        reminder: '1 day before',
        completed: false,
      },
      {
        id: 2,
        title: 'Chemistry Lab Report',
        type: 'Assignment',
        date: toDateInput(addDays(today, 5)),
        startTime: '14:00',
        endTime: '15:00',
        repeat: 'None',
        priority: 'High',
        description: 'Submit report with reaction observations and citations.',
        subject: subjects[1] || subjects[0],
        reminder: '2 hours before',
        completed: false,
      },
      {
        id: 3,
        title: 'Flashcard Review',
        type: 'Task',
        date: toDateInput(today),
        startTime: '18:00',
        endTime: '18:25',
        repeat: 'Daily',
        priority: 'Medium',
        description: 'Review active recall deck before dinner.',
        subject: subjects[2] || subjects[0],
        reminder: '10 minutes before',
        completed: false,
      },
      {
        id: 4,
        title: 'Study Photosynthesis',
        type: 'Study Plan',
        date: toDateInput(addDays(today, 1)),
        startTime: '16:00',
        endTime: '17:15',
        repeat: 'Weekly',
        priority: 'Medium',
        description: 'Prepare visual summary and self-test questions.',
        subject: subjects[2] || subjects[0],
        reminder: '30 minutes before',
        topic: 'Light-dependent reactions',
        notes: uploadedNotes[2],
        duration: '75',
        goals: 'Summarize the pathway and answer 10 practice questions.',
        completed: false,
      },
    ];
  }, [subjects]);

  const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 720 ? 'Agenda' : 'Month'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [events, setEvents] = useState(initialEvents);
  const [calendarVisibility, setCalendarVisibility] = useState({ Exam: true, Assignment: true, Task: true, 'Study Plan': true });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyEventForm(new Date(), 'Study Plan'));
  const [editingId, setEditingId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const weekDates = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return events
      .filter((event) => calendarVisibility[event.type])
      .filter((event) => filterType === 'All' || event.type === filterType)
      .filter((event) => {
        if (!term) return true;
        return [event.title, event.subject, event.description, event.topic].some((value) => String(value || '').toLowerCase().includes(term));
      })
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [calendarVisibility, events, filterType, searchTerm]);

  const upcomingEvents = useMemo(() => {
    const today = toDateInput(new Date());
    return filteredEvents.filter((event) => event.date >= today).slice(0, 4);
  }, [filteredEvents]);

  const currentLabel = useMemo(() => {
    if (view === 'Day') return formatDay(currentDate);
    if (view === 'Week') {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${formatShortDate(start)} - ${formatShortDate(end)}, ${end.getFullYear()}`;
    }
    if (view === 'Agenda') return 'Upcoming agenda';
    return formatMonth(currentDate);
  }, [currentDate, view]);

  const eventsForDate = (date) => filteredEvents.filter((event) => event.date === toDateInput(date));

  const openCreateModal = (date = currentDate, startLabel = '09:00', type = 'Study Plan') => {
    const startTime = slotToTime(startLabel);
    setEditingId(null);
    setForm({
      ...emptyEventForm(date, type),
      subject: subjects[0] || '',
      startTime,
      endTime: addMinutesToTime(startTime, type === 'Study Plan' ? 60 : 45),
    });
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingId(event.id);
    setForm({ ...emptyEventForm(new Date(event.date), event.type), ...event });
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const saveEvent = (submitEvent) => {
    submitEvent.preventDefault();
    const normalized = {
      ...form,
      id: editingId || Date.now(),
      title: form.title.trim() || `${form.type} session`,
      subject: form.subject || subjects[0] || 'General Study',
    };
    setEvents((current) => (editingId ? current.map((item) => (item.id === editingId ? normalized : item)) : [...current, normalized]));
    setModalOpen(false);
    setEditingId(null);
  };

  const deleteEvent = (id) => {
    setEvents((current) => current.filter((event) => event.id !== id));
    setSelectedEvent(null);
  };

  const markCompleted = (id) => {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, completed: true } : event)));
    setSelectedEvent((event) => (event?.id === id ? { ...event, completed: true } : event));
  };

  const navigateCalendar = (direction) => {
    setCurrentDate((date) => {
      if (view === 'Day') return addDays(date, direction);
      if (view === 'Week') return addDays(date, direction * 7);
      return new Date(date.getFullYear(), date.getMonth() + direction, 1);
    });
  };

  const renderEventChip = (event, compact = false) => {
    const type = eventTypes[event.type];
    return (
      <button
        key={event.id}
        type="button"
        className={`planner-event-chip ${compact ? 'compact' : ''} ${event.completed ? 'completed' : ''}`}
        style={{ '--event-color': type.color, '--event-bg': type.bg }}
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          setSelectedEvent(event);
        }}
      >
        <span className="material-symbols-outlined">{type.icon}</span>
        <span className="planner-event-copy">
          <strong>{event.title}</strong>
          {!compact && <small>{event.startTime} - {event.subject}</small>}
        </span>
      </button>
    );
  };

  const renderMonthView = () => (
    <div className="planner-month-grid">
      {weekDays.map((day) => <div className="planner-day-name" key={day}>{day}</div>)}
      {monthDays.map((day) => {
        const dayEvents = eventsForDate(day.date);
        return (
          <button type="button" key={day.key} className={`planner-date-cell ${day.currentMonth ? '' : 'muted'} ${day.today ? 'today' : ''}`} onClick={() => openCreateModal(day.date)}>
            <span className="planner-date-number">{day.date.getDate()}</span>
            <div className="planner-cell-events">
              {dayEvents.slice(0, 3).map((event) => renderEventChip(event, true))}
              {dayEvents.length > 3 && <span className="planner-more-events">+{dayEvents.length - 3} more</span>}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="planner-week-grid">
      <div className="planner-time-spacer" />
      {weekDates.map((date) => (
        <button
          key={date.toISOString()}
          className={`planner-week-heading ${sameDay(date, new Date()) ? 'today' : ''}`}
          type="button"
          onClick={() => {
            setCurrentDate(date);
            setView('Day');
          }}
        >
          <span>{weekDays[date.getDay()]}</span>
          <strong>{date.getDate()}</strong>
        </button>
      ))}
      {timeSlots.map((slot) => (
        <div className="planner-week-row" key={slot}>
          <div className="planner-time-label">{slot}</div>
          {weekDates.map((date) => {
            const slotHour = slotToTime(slot).slice(0, 2);
            const dayEvents = eventsForDate(date).filter((event) => event.startTime.slice(0, 2) === slotHour);
            return (
              <button type="button" className="planner-time-cell" key={`${slot}-${date.toISOString()}`} onClick={() => openCreateModal(date, slot)}>
                {dayEvents.map((event) => renderEventChip(event))}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderDayView = () => (
    <div className="planner-day-view">
      {timeSlots.map((slot) => {
        const slotHour = slotToTime(slot).slice(0, 2);
        const dayEvents = eventsForDate(currentDate).filter((event) => event.startTime.slice(0, 2) === slotHour);
        return (
          <div className="planner-day-slot" key={slot}>
            <div className="planner-time-label">{slot}</div>
            <button type="button" className="planner-day-dropzone" onClick={() => openCreateModal(currentDate, slot)}>
              {dayEvents.length ? dayEvents.map((event) => renderEventChip(event)) : <span>Tap to schedule</span>}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderAgendaView = () => (
    <div className="planner-agenda-list">
      {filteredEvents.map((event) => {
        const type = eventTypes[event.type];
        return (
          <button type="button" className="planner-agenda-item" key={event.id} onClick={() => setSelectedEvent(event)}>
            <span className="planner-agenda-date">{formatShortDate(new Date(event.date))}</span>
            <span className="planner-agenda-icon" style={{ background: type.bg, color: type.color }}>
              <span className="material-symbols-outlined">{type.icon}</span>
            </span>
            <span className="planner-agenda-copy">
              <strong>{event.title}</strong>
              <small>{event.startTime} - {event.endTime} - {event.subject}</small>
            </span>
            <span className="planner-priority">{event.priority}</span>
          </button>
        );
      })}
    </div>
  );

  const renderCalendarBody = () => {
    if (!filteredEvents.length) {
      return (
        <div className="planner-empty-state">
          <div className="planner-empty-illustration" aria-hidden="true">
            <span className="material-symbols-outlined">event_available</span>
            <span className="planner-empty-dot one" />
            <span className="planner-empty-dot two" />
          </div>
          <h3>No study plans yet</h3>
          <p>Start by scheduling your first exam, assignment, task, or study session.</p>
          <button type="button" onClick={() => openCreateModal(new Date())}>
            <span className="material-symbols-outlined">add</span>
            Create Your First Plan
          </button>
        </div>
      );
    }
    if (view === 'Week') return renderWeekView();
    if (view === 'Day') return renderDayView();
    if (view === 'Agenda') return renderAgendaView();
    return renderMonthView();
  };

  return (
    <main className="study-planner-page">
      <section className="planner-topbar">
        <div>
          <p className="planner-kicker">Academent calendar</p>
          <h1>Study Planner</h1>
          <p>Plan exams, assignments, tasks, and study sessions in one place.</p>
        </div>
        <div className="planner-header-actions">
          <label className="planner-search">
            <span className="material-symbols-outlined">search</span>
            <input type="search" placeholder="Search scheduled events" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <button type="button" className="planner-create-button" onClick={() => openCreateModal(new Date())}>
            <span className="material-symbols-outlined">add</span>
            Create Event
          </button>
          <div className="planner-profile">
            {photoURL ? <img src={photoURL} alt="Student profile" /> : <span>{fullName.charAt(0).toUpperCase()}</span>}
            <div>
              <strong>{fullName.split(' ')[0]}</strong>
              <small>Focused mode</small>
            </div>
          </div>
        </div>
      </section>

      <section className="planner-shell">
        <aside className="planner-sidebar">
          <div className="planner-mini-calendar">
            <div className="planner-mini-header">
              <strong>{formatMonth(currentDate)}</strong>
              <button type="button" onClick={() => setCurrentDate(new Date())}>Today</button>
            </div>
            <div className="planner-mini-grid">
              {weekDays.map((day) => <span key={day}>{day.slice(0, 1)}</span>)}
              {monthDays.slice(0, 35).map((day) => (
                <button type="button" key={`mini-${day.key}`} className={`${day.currentMonth ? '' : 'muted'} ${sameDay(day.date, currentDate) ? 'selected' : ''}`} onClick={() => setCurrentDate(day.date)}>
                  {day.date.getDate()}
                </button>
              ))}
            </div>
          </div>

          <div className="planner-side-section">
            <h2>My Calendars</h2>
            {Object.keys(eventTypes).map((type) => (
              <label className="planner-calendar-toggle" key={type}>
                <input type="checkbox" checked={calendarVisibility[type]} onChange={() => setCalendarVisibility((state) => ({ ...state, [type]: !state[type] }))} />
                <span style={{ background: eventTypes[type].color }} />
                {type}s
              </label>
            ))}
          </div>

          <div className="planner-side-section">
            <h2>Upcoming Deadlines</h2>
            <div className="planner-deadlines">
              {upcomingEvents.map((event) => (
                <button type="button" key={event.id} onClick={() => setSelectedEvent(event)}>
                  <span style={{ background: eventTypes[event.type].bg, color: eventTypes[event.type].color }}>
                    <span className="material-symbols-outlined">{eventTypes[event.type].icon}</span>
                  </span>
                  <strong>{event.title}</strong>
                  <small>{formatShortDate(new Date(event.date))} - {event.startTime}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="planner-side-section">
            <h2>Quick Create</h2>
            <div className="planner-quick-buttons">
              {Object.keys(eventTypes).map((type) => (
                <button type="button" key={type} onClick={() => openCreateModal(currentDate, '09:00', type)}>
                  <span className="material-symbols-outlined">{eventTypes[type].icon}</span>
                  Add {type}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="planner-calendar-panel">
          <div className="planner-toolbar">
            <div className="planner-toolbar-left">
              <button type="button" onClick={() => setCurrentDate(new Date())}>Today</button>
              <div className="planner-nav-buttons">
                <button type="button" aria-label="Previous" onClick={() => navigateCalendar(-1)}><span className="material-symbols-outlined">chevron_left</span></button>
                <button type="button" aria-label="Next" onClick={() => navigateCalendar(1)}><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
              <h2>{currentLabel}</h2>
            </div>
            <div className="planner-toolbar-right">
              <div className="planner-view-switcher">
                {['Month', 'Week', 'Day', 'Agenda'].map((option) => (
                  <button type="button" key={option} className={view === option ? 'active' : ''} onClick={() => setView(option)}>{option}</button>
                ))}
              </div>
              <label className="planner-filter">
                <span className="material-symbols-outlined">filter_list</span>
                <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                  <option>All</option>
                  <option>Exam</option>
                  <option>Assignment</option>
                  <option>Task</option>
                  <option>Study Plan</option>
                </select>
              </label>
            </div>
          </div>
          <div className="planner-calendar-body">{renderCalendarBody()}</div>
        </section>
      </section>

      <button type="button" className="planner-mobile-fab" aria-label="Create event" onClick={() => openCreateModal(new Date())}>
        <span className="material-symbols-outlined">add</span>
      </button>

      {modalOpen && (
        <div className="planner-modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <form className="planner-modal" onSubmit={saveEvent} onMouseDown={(event) => event.stopPropagation()}>
            <div className="planner-modal-header">
              <div>
                <p>{editingId ? 'Edit schedule' : 'Create schedule'}</p>
                <h2>{form.type === 'Study Plan' ? 'Study Plan Scheduling' : 'Event Details'}</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="planner-form-grid">
              <label className="wide">Event title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Biology final review" /></label>
              <label>Event type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{Object.keys(eventTypes).map((type) => <option key={type}>{type}</option>)}</select></label>
              <label>Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <label>Start time<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label>
              <label>End time<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label>
              <label>Repeat<select value={form.repeat} onChange={(event) => setForm({ ...form, repeat: event.target.value })}>{repeatOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label>Subject/module<select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">Choose subject</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
              <label>Reminder<select value={form.reminder} onChange={(event) => setForm({ ...form, reminder: event.target.value })}><option>None</option><option>10 minutes before</option><option>30 minutes before</option><option>2 hours before</option><option>1 day before</option></select></label>

              {form.type === 'Study Plan' && (
                <>
                  <label>Study topic<input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} placeholder="Topic to revise" /></label>
                  <label>Related uploaded notes<select value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}><option value="">Select notes</option>{uploadedNotes.map((note) => <option key={note}>{note}</option>)}</select></label>
                  <label>Duration<input type="number" min="15" step="15" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></label>
                  <label className="wide">Study goals<textarea value={form.goals} onChange={(event) => setForm({ ...form, goals: event.target.value })} placeholder="What should be done by the end of this session?" /></label>
                </>
              )}

              <label className="wide">Description / notes<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add instructions, links, chapters, or reminders" /></label>
            </div>

            <div className="planner-modal-actions">
              <button type="button" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}

      {selectedEvent && (
        <div className="planner-details-backdrop" role="presentation" onMouseDown={() => setSelectedEvent(null)}>
          <aside className="planner-details-panel" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="planner-details-close" onClick={() => setSelectedEvent(null)} aria-label="Close details"><span className="material-symbols-outlined">close</span></button>
            <div className="planner-details-icon" style={{ background: eventTypes[selectedEvent.type].bg, color: eventTypes[selectedEvent.type].color }}><span className="material-symbols-outlined">{eventTypes[selectedEvent.type].icon}</span></div>
            <p className="planner-details-type">{selectedEvent.type}</p>
            <h2>{selectedEvent.title}</h2>
            <div className="planner-details-list">
              <span><strong>Date and time</strong>{formatShortDate(new Date(selectedEvent.date))}, {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              <span><strong>Subject/module</strong>{selectedEvent.subject}</span>
              <span><strong>Priority</strong>{selectedEvent.priority}</span>
              <span><strong>Reminder</strong>{selectedEvent.reminder}</span>
              {selectedEvent.type === 'Study Plan' && (
                <>
                  <span><strong>Study topic</strong>{selectedEvent.topic || 'Not set'}</span>
                  <span><strong>Related notes</strong>{selectedEvent.notes || 'Not selected'}</span>
                  <span><strong>Duration</strong>{selectedEvent.duration || '60'} minutes</span>
                  <span><strong>Study goals</strong>{selectedEvent.goals || 'No goals added yet'}</span>
                </>
              )}
              <span><strong>Description</strong>{selectedEvent.description || 'No description added.'}</span>
            </div>
            <div className="planner-details-actions">
              <button type="button" onClick={() => openEditModal(selectedEvent)}><span className="material-symbols-outlined">edit</span>Edit</button>
              <button type="button" className="danger" onClick={() => deleteEvent(selectedEvent.id)}><span className="material-symbols-outlined">delete</span>Delete</button>
              {(selectedEvent.type === 'Task' || selectedEvent.type === 'Study Plan') && (
                <button type="button" className="complete" onClick={() => markCompleted(selectedEvent.id)}><span className="material-symbols-outlined">done_all</span>{selectedEvent.completed ? 'Completed' : 'Mark as completed'}</button>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default StudyPlannerPage;

