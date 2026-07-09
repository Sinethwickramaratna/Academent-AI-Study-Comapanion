
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNoteManagement from '../Services/useNoteManagement';
import useQuizGenerator from '../Services/useQuizGenerator';
import { subscribeToFlashCardCollections } from '../Services/flashCardService';
import { subscribeStudyPlannerEvents } from '../Services/studyPlannerService';
import logoUrl from '../assets/Logo/Logo.png';
import './analyticspage.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const rangeOptions = [
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
  ['custom', 'Custom Range'],
];
const chartOptions = ['Daily', 'Weekly', 'Monthly'];
const accents = ['cyan', 'violet', 'emerald', 'amber', 'rose'];
const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
const eventTypes = {
  exam: { label: 'Exam', icon: 'school', mark: 'exam' },
  assignment: { label: 'Assignment', icon: 'assignment_late', mark: 'assignment' },
  task: { label: 'Task', icon: 'task_alt', mark: 'study' },
  studyPlan: { label: 'Study Session', icon: 'event_available', mark: 'study' },
};
const quickActions = [
  ['article', 'Review notes', '/my-notes'],
  ['quiz', 'Generate quiz', '/quiz-generator'],
  ['psychology', 'Ask AI Tutor', '/ai-tutor'],
  ['style', 'Create flashcards', '/flashcards'],
];

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const startDay = (value = new Date()) => {
  const date = toDate(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const startWeek = (value = new Date()) => {
  const date = startDay(value);
  const day = date.getDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
};
const toInputDate = (value = new Date()) => {
  const date = toDate(value) || new Date();
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};
const fromInputDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};
const sameDay = (left, right) => startDay(left).getTime() === startDay(right).getTime();
const inRange = (value, range) => {
  const date = toDate(value);
  return Boolean(date && date >= range.start && date < range.end);
};
const getRange = (key, custom) => {
  const today = startDay(new Date());
  if (key === 'today') return { start: today, end: addDays(today, 1), label: 'Today' };
  if (key === 'month') return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 1), label: 'This month' };
  if (key === 'custom') {
    const start = startDay(fromInputDate(custom.start) || addDays(today, -29));
    const end = addDays(startDay(fromInputDate(custom.end) || today), 1);
    return { start, end: end <= start ? addDays(start, 1) : end, label: `${toInputDate(start)} to ${toInputDate(addDays(end, -1))}` };
  }
  const start = startWeek(today);
  return { start, end: addDays(start, 7), label: 'This week' };
};
const previousRange = (range) => {
  const length = Math.max(DAY_MS, range.end - range.start);
  return { start: new Date(range.start.getTime() - length), end: new Date(range.start) };
};
const avg = (items) => {
  const nums = items.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, item) => sum + item, 0) / nums.length : 0;
};
const clamp = (value) => Math.max(0, Math.min(100, Number(value || 0)));
const keyOf = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const titleCase = (value) => String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const formatHours = (minutes = 0) => {
  const safe = Math.max(0, Math.round(Number(minutes || 0)));
  if (!safe) return '0h';
  if (safe < 60) return `${safe}m`;
  const hours = safe / 60;
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`;
};
const countDelta = (current, previous) => {
  const delta = Math.round(current - previous);
  return { label: delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`, trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral' };
};
const percentDelta = (current, previous) => {
  if (!current && !previous) return { label: '0%', trend: 'neutral' };
  if (!previous) return { label: '+100%', trend: 'up' };
  const delta = Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
  return { label: `${delta > 0 ? '+' : ''}${delta}%`, trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral' };
};
const scoreDelta = (current, previous) => {
  const delta = Math.round((current - previous) * 10) / 10;
  return { label: delta === 0 ? '0 pts' : `${delta > 0 ? '+' : ''}${delta} pts`, trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral' };
};
const shortDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
const shortTime = (time) => {
  const [hours = 0, minutes = 0] = String(time || '00:00').split(':').map(Number);
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(2026, 0, 1, hours, minutes));
};
const relativeTime = (value) => {
  const date = toDate(value);
  if (!date) return 'Recently';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return shortDate(date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return shortDate(date);
};
const eventDate = (event, end = false) => {
  const day = fromInputDate(event?.date);
  if (!day) return null;
  const [hours = 0, minutes = 0] = String((end ? event.endTime : event.startTime) || '00:00').split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
};
const eventMinutes = (event) => {
  const explicit = Number(event?.durationMinutes || 0);
  if (explicit > 0) return explicit;
  const start = eventDate(event);
  const end = eventDate(event, true);
  return start && end && end > start ? Math.round((end - start) / 60000) : 0;
};
const plannerStatus = (event) => {
  if (event.status === 'completed') return 'completed';
  const end = eventDate(event, true) || eventDate(event);
  if (end && end < new Date()) return 'overdue';
  return eventDate(event) && sameDay(eventDate(event), new Date()) ? 'today' : 'upcoming';
};
const plannerTime = (event) => {
  const date = eventDate(event);
  if (!date) return 'No date';
  const status = plannerStatus(event);
  if (status === 'overdue') {
    const days = Math.max(1, Math.ceil((startDay(new Date()) - startDay(date)) / DAY_MS));
    return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (sameDay(date, new Date())) return `Today, ${shortTime(event.startTime)}`;
  if (sameDay(date, addDays(startDay(new Date()), 1))) return `Tomorrow, ${shortTime(event.startTime)}`;
  return `${shortDate(date)}, ${shortTime(event.startTime)}`;
};
const quizDate = (quiz) => toDate(quiz.completedAt) || toDate(quiz.updatedAt) || toDate(quiz.createdAt) || new Date(0);
const quizScore = (quiz) => {
  const percentage = Number(quiz?.percentage);
  if (Number.isFinite(percentage)) return clamp(percentage);
  const score = Number(quiz?.score);
  const total = Number(quiz?.totalQuestions || quiz?.questions?.length || 0);
  return Number.isFinite(score) && total > 0 ? clamp(Math.round((score / total) * 100)) : 0;
};
const quizModule = (quiz) => {
  const source = quiz?.selectedMaterials?.[0] || {};
  const parts = String(source.path || '').split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  if (parts.length === 1) return parts[0];
  return source.title || quiz?.title || 'General Study';
};
const weeklyTarget = (profile) => {
  const numbers = String(profile?.learningPreferences?.weeklyHours || '5-10').match(/\d+/g)?.map(Number) || [];
  return numbers.length ? numbers[numbers.length - 1] : 10;
};
const flattenNotes = (data = {}) => {
  const modules = [];
  const materials = [];
  const addMaterial = (item, type, semester, module, path) => {
    const id = type === 'note' ? item.noteId : item.pdfId;
    if (!id) return;
    materials.push({ id, type, title: item.title || 'Untitled material', moduleId: module.moduleId, moduleTitle: module.title || 'Untitled module', path });
  };
  const visitFolder = (folder, semester, module, path) => {
    const nextPath = `${path} / ${folder.title || 'Folder'}`;
    (folder.notes || []).forEach((note) => addMaterial(note, 'note', semester, module, nextPath));
    (folder.pdfs || []).forEach((pdf) => addMaterial(pdf, 'pdf', semester, module, nextPath));
    (folder.folders || []).forEach((child) => visitFolder(child, semester, module, nextPath));
  };
  (data.semesters || []).forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const title = module.title || 'Untitled module';
      const path = `${semester.title || 'Semester'} / ${title}`;
      (module.notes || []).forEach((note) => addMaterial(note, 'note', semester, module, path));
      (module.pdfs || []).forEach((pdf) => addMaterial(pdf, 'pdf', semester, module, path));
      (module.folders || []).forEach((folder) => visitFolder(folder, semester, module, path));
      modules.push({ id: module.moduleId, title, semester: semester.title || 'Semester', materialCount: 0 });
    });
  });
  const counts = materials.reduce((map, item) => map.set(item.moduleId, (map.get(item.moduleId) || 0) + 1), new Map());
  return { materials, modules: modules.map((module) => ({ ...module, materialCount: counts.get(module.id) || 0 })) };
};
const flashTotals = (collections) => {
  const totals = collections.reduce((sum, collection) => {
    const data = collection.analytics || {};
    sum.cards += Number(data.totalFlashCards || collection.cardCount || 0);
    sum.mastered += Number(data.masteredCards || 0);
    sum.due += Number(data.dueToday || 0) + Number(data.overdueCards || 0);
    sum.reviews += Number(data.todaysReviews || 0);
    sum.retention.push(Number(data.retentionRate || 0));
    sum.completion.push(Number(data.completionPercentage || 0));
    return sum;
  }, { cards: 0, mastered: 0, due: 0, reviews: 0, retention: [], completion: [] });
  return { ...totals, retentionRate: Math.round(avg(totals.retention)), completionPercentage: Math.round(avg(totals.completion)) };
};
const groupScores = (quizzes) => [...quizzes.reduce((map, quiz) => {
  const module = quizModule(quiz);
  map.set(module, [...(map.get(module) || []), quizScore(quiz)]);
  return map;
}, new Map()).entries()].map(([subject, scores], index) => ({ subject, score: Math.round(avg(scores)), color: colors[index % colors.length] })).sort((a, b) => b.score - a.score).slice(0, 5);
const trendIcon = (trend) => trend === 'down' ? 'trending_down' : trend === 'neutral' ? 'trending_flat' : 'trending_up';

function TrendBadge({ change }) {
  const trend = change?.trend || 'neutral';
  return <span className={`analytics-change analytics-change--${trend}`}><span className="material-symbols-outlined">{trendIcon(trend)}</span>{change?.label || '0'}</span>;
}
function EmptyInline({ icon = 'insights', children }) {
  return <div className="analytics-empty-inline"><span className="material-symbols-outlined">{icon}</span><p>{children}</p></div>;
}
const reportEscape = (value, fallback = 'Not provided') => String(value ?? fallback)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const reportTable = (items, columns, emptyText) => {
  if (!items.length) return `<p class="report-empty">${reportEscape(emptyText)}</p>`;
  return `<table><thead><tr>${columns.map(([label]) => `<th>${reportEscape(label)}</th>`).join('')}</tr></thead><tbody>${items.map((item) => `<tr>${columns.map(([, getValue]) => `<td>${reportEscape(getValue(item))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
};

const reportList = (items, getText, emptyText) => (
  items.length
    ? `<ul class="report-list">${items.map((item) => `<li>${reportEscape(getText(item))}</li>`).join('')}</ul>`
    : `<p class="report-empty">${reportEscape(emptyText)}</p>`
);

const buildAnalyticsPdfReportHtml = ({ analytics, profile, currentUser }) => {
  const academicProfile = profile?.academicProfile || {};
  const learningPreferences = profile?.learningPreferences || {};
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const subjects = Array.isArray(academicProfile.subjects)
    ? academicProfile.subjects.join(', ')
    : academicProfile.subjects;
  const generatedAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  const details = [
    ['Student name', fullName],
    ['Email', currentUser?.email || profile?.email],
    ['Major / Program', academicProfile.major],
    ['Education level', academicProfile.educationLevel],
    ['Subjects', subjects],
    ['Study style', learningPreferences.studyStyle],
    ['Weekly target', learningPreferences.weeklyHours],
    ['Report range', analytics.rangeLabel],
  ];

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Academent Analytics Report</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #171326; font-family: Arial, Helvetica, sans-serif; background: #ffffff; }
    .report { max-width: 1040px; margin: 0 auto; padding: 28px; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 22px; border-bottom: 3px solid #4d2b8c; }
    .brand { display: flex; gap: 14px; align-items: center; }
    .brand img { width: 58px; height: 58px; object-fit: contain; }
    .brand h1 { margin: 0; color: #4d2b8c; font-size: 30px; line-height: 1.05; }
    .brand p, .meta p { margin: 5px 0 0; color: #6f667a; font-size: 12px; font-weight: 700; }
    .meta { text-align: right; min-width: 190px; }
    .meta strong { color: #4d2b8c; font-size: 13px; }
    h2 { margin: 26px 0 12px; color: #4d2b8c; font-size: 18px; }
    .details, .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .detail, .card { min-height: 72px; padding: 12px; border: 1px solid #e5ddf3; border-radius: 10px; background: #fbf9ff; }
    .detail span, .card span { display: block; color: #6f667a; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .detail strong, .card strong { display: block; margin-top: 6px; color: #171326; font-size: 15px; line-height: 1.25; }
    .card strong { color: #4d2b8c; font-size: 22px; }
    .card small { display: block; margin-top: 6px; color: #6f667a; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    th { background: #4d2b8c; color: #ffffff; font-size: 11px; padding: 9px; text-align: left; }
    td { border: 1px solid #e7e1f0; padding: 8px 9px; font-size: 12px; vertical-align: top; }
    tr:nth-child(even) td { background: #fbf9ff; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .section { page-break-inside: avoid; }
    .report-list { margin: 0; padding-left: 18px; }
    .report-list li { margin: 0 0 8px; font-size: 12px; line-height: 1.45; }
    .report-empty { margin: 0; padding: 12px; border-radius: 10px; background: #f8f6fc; color: #6f667a; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e5ddf3; color: #6f667a; font-size: 11px; }
    @media print { .report { padding: 0; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="header">
      <div class="brand"><img src="${logoUrl}" alt="Academent logo" /><div><h1>Analytics Report</h1><p>Academent AI Study Companion</p></div></div>
      <div class="meta"><strong>${reportEscape(generatedAt)}</strong><p>Generated report</p><p>${reportEscape(analytics.rangeLabel)}</p></div>
    </header>
    <section class="section"><h2>Student Details</h2><div class="details">${details.map(([label, value]) => `<div class="detail"><span>${reportEscape(label)}</span><strong>${reportEscape(value)}</strong></div>`).join('')}</div></section>
    <section class="section"><h2>Performance Summary</h2><div class="cards">${analytics.summaryCards.map((card) => `<div class="card"><span>${reportEscape(card.label)}</span><strong>${reportEscape(card.value)}</strong><small>${reportEscape(card.change?.label || '0')} - ${reportEscape(card.helper)}</small></div>`).join('')}</div></section>
    <section class="section"><h2>Study Progress</h2>${reportTable(analytics.studyBars, [['Period', (item) => item.day], ['Study time', (item) => item.hours]], 'No study sessions in this range.')}</section>
    <section class="grid-2"><div class="section"><h2>Quiz Performance</h2>${reportTable(analytics.subjectScores, [['Module', (item) => item.subject], ['Average score', (item) => `${item.score}%`]], 'No completed quizzes in this range.')}</div><div class="section"><h2>Flash Cards</h2>${reportTable([{ label: 'Total cards', value: analytics.flash.cards }, { label: 'Mastered cards', value: analytics.flash.mastered }, { label: 'Due now', value: analytics.flash.due }, { label: 'Retention rate', value: `${analytics.flash.retentionRate}%` }], [['Metric', (item) => item.label], ['Value', (item) => item.value]], 'No flashcard data yet.')}</div></section>
    <section class="section"><h2>Subject / Module Progress</h2>${reportTable(analytics.modules, [['Module', (item) => item.name], ['Progress', (item) => `${item.progress}%`], ['Study time', (item) => item.hours], ['Average score', (item) => item.score]], 'No module progress data yet.')}</section>
    <section class="grid-2"><div class="section"><h2>Upcoming Planner Items</h2>${reportTable(analytics.plannerItems, [['Type', (item) => item.type], ['Title', (item) => item.title], ['When', (item) => item.time], ['Status', (item) => item.status]], 'No upcoming planner items.')}</div><div class="section"><h2>Weak Areas</h2>${reportTable(analytics.weakAreas, [['Topic', (item) => item.topic], ['Score', (item) => item.score], ['Action', (item) => item.action]], 'No weak areas detected in this range.')}</div></section>
    <section class="grid-2"><div class="section"><h2>AI Learning Insights</h2>${reportList(analytics.aiInsights, (item) => item, 'No insights available yet.')}</div><div class="section"><h2>Recent Activity</h2>${reportList(analytics.recentActivity, (item) => `${item.title}: ${item.detail} (${item.time})`, 'No recent activity yet.')}</div></section>
    <footer class="footer">This report was generated from Academent analytics data for ${reportEscape(fullName)}.</footer>
  </main>
  <script>window.addEventListener('load', function () { window.setTimeout(function () { window.focus(); window.print(); }, 250); });</script>
</body>
</html>`;
};

function AnalyticsPage({ profile, currentUser }) {
  const navigate = useNavigate();
  const notes = useNoteManagement();
  const quizStore = useQuizGenerator();
  const uid = currentUser?.uid || quizStore.uid;
  const [rangeKey, setRangeKey] = useState('week');
  const [chartPeriod, setChartPeriod] = useState('Daily');
  const [customRange, setCustomRange] = useState(() => ({ start: toInputDate(addDays(startDay(new Date()), -29)), end: toInputDate(new Date()) }));
  const [plannerEvents, setPlannerEvents] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [plannerError, setPlannerError] = useState(null);
  const [flashCollections, setFlashCollections] = useState([]);
  const [flashLoading, setFlashLoading] = useState(true);
  const [flashError, setFlashError] = useState(null);

  useEffect(() => {
    if (!uid) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setPlannerEvents([]);
        setPlannerLoading(false);
      });
      return () => { cancelled = true; };
    }
    let subscribed = true;
    Promise.resolve().then(() => {
      if (!subscribed) return;
      setPlannerLoading(true);
      setPlannerError(null);
    });
    const unsubscribe = subscribeStudyPlannerEvents(uid, (items) => {
      setPlannerEvents(items);
      setPlannerLoading(false);
    }, (error) => {
      setPlannerError(error);
      setPlannerLoading(false);
    });
    return () => { subscribed = false; unsubscribe(); };
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setFlashCollections([]);
        setFlashLoading(false);
      });
      return () => { cancelled = true; };
    }
    let subscribed = true;
    Promise.resolve().then(() => {
      if (!subscribed) return;
      setFlashLoading(true);
      setFlashError(null);
    });
    const unsubscribe = subscribeToFlashCardCollections(uid, (items) => {
      setFlashCollections(items);
      setFlashLoading(false);
    }, (error) => {
      setFlashError(error);
      setFlashLoading(false);
    });
    return () => { subscribed = false; unsubscribe(); };
  }, [uid]);

  const range = useMemo(() => getRange(rangeKey, customRange), [customRange, rangeKey]);
  const previous = useMemo(() => previousRange(range), [range]);
  const noteIndex = useMemo(() => flattenNotes(notes.data), [notes.data]);
  const analytics = useMemo(() => {
    const completedEvents = plannerEvents.filter((event) => event.status === 'completed');
    const currentEvents = completedEvents.filter((event) => inRange(eventDate(event), range));
    const previousEvents = completedEvents.filter((event) => inRange(eventDate(event), previous));
    const studyMinutes = currentEvents.reduce((sum, event) => sum + eventMinutes(event), 0);
    const lastStudyMinutes = previousEvents.reduce((sum, event) => sum + eventMinutes(event), 0);
    const completedTasks = currentEvents.filter((event) => event.type !== 'exam').length;
    const lastCompletedTasks = previousEvents.filter((event) => event.type !== 'exam').length;

    const completedQuizzes = quizStore.quizzes.filter((quiz) => quiz.status === 'completed');
    const currentQuizzes = completedQuizzes.filter((quiz) => inRange(quizDate(quiz), range));
    const previousQuizzes = completedQuizzes.filter((quiz) => inRange(quizDate(quiz), previous));
    const quizzesInRange = quizStore.quizzes.filter((quiz) => inRange(quizDate(quiz), range));
    const averageScore = Math.round(avg(currentQuizzes.map(quizScore)));
    const previousScore = Math.round(avg(previousQuizzes.map(quizScore)));
    const subjectScores = groupScores(currentQuizzes);
    const overdue = plannerEvents.filter((event) => plannerStatus(event) === 'overdue').length;
    const upcoming = plannerEvents.filter((event) => ['today', 'upcoming'].includes(plannerStatus(event))).length;
    const goalMinutes = Math.round((weeklyTarget(profile) / 7) * Math.max(1, Math.round((range.end - range.start) / DAY_MS)) * 60);
    const quizStatus = {
      completed: quizzesInRange.filter((quiz) => quiz.status === 'completed').length,
      partial: quizzesInRange.filter((quiz) => quiz.status === 'partially_attempted').length,
      notAttempted: quizzesInRange.filter((quiz) => quiz.status === 'not_attempted').length,
    };
    const difficultyStats = ['easy', 'medium', 'hard'].map((difficulty) => ({ difficulty, count: quizzesInRange.filter((quiz) => quiz.difficulty === difficulty).length }));
    const flash = flashTotals(flashCollections);

    const summaryCards = [
      { label: 'Total Study Hours', value: formatHours(studyMinutes), change: percentDelta(studyMinutes, lastStudyMinutes), icon: 'schedule', tone: 'purple', helper: `${formatHours(goalMinutes)} goal for this range` },
      { label: 'Quizzes Completed', value: String(currentQuizzes.length), change: countDelta(currentQuizzes.length, previousQuizzes.length), icon: 'quiz', tone: 'gold', helper: `${quizStatus.partial} in progress` },
      { label: 'Average Quiz Score', value: averageScore ? `${averageScore}%` : '0%', change: scoreDelta(averageScore, previousScore), icon: 'workspace_premium', tone: 'emerald', helper: subjectScores[0] ? `Best score in ${subjectScores[0].subject}` : 'Complete a quiz to unlock scores' },
      { label: 'Tasks Completed', value: String(completedTasks), change: countDelta(completedTasks, lastCompletedTasks), icon: 'task_alt', tone: 'rose', helper: `${overdue} overdue, ${upcoming} upcoming` },
    ];

    const barStart = chartPeriod === 'Daily' && rangeKey !== 'today' ? range.start : addDays(startDay(new Date()), -6);
    const rawBars = chartPeriod === 'Weekly'
      ? Array.from({ length: 7 }, (_, index) => {
          const start = addDays(startWeek(new Date()), (index - 6) * 7);
          const end = addDays(start, 7);
          const minutes = completedEvents.filter((event) => inRange(eventDate(event), { start, end })).reduce((sum, event) => sum + eventMinutes(event), 0);
          return { day: shortDate(start), minutes, hours: formatHours(minutes) };
        })
      : chartPeriod === 'Monthly'
        ? Array.from({ length: 7 }, (_, index) => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            const minutes = completedEvents.filter((event) => inRange(eventDate(event), { start, end })).reduce((sum, event) => sum + eventMinutes(event), 0);
            return { day: new Intl.DateTimeFormat('en', { month: 'short' }).format(start), minutes, hours: formatHours(minutes) };
          })
        : Array.from({ length: 7 }, (_, index) => {
            const start = addDays(barStart, index);
            const end = addDays(start, 1);
            const minutes = completedEvents.filter((event) => inRange(eventDate(event), { start, end })).reduce((sum, event) => sum + eventMinutes(event), 0);
            return { day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(start), minutes, hours: formatHours(minutes) };
          });
    const maxBar = Math.max(...rawBars.map((bar) => bar.minutes), 1);
    const studyBars = rawBars.map((bar) => ({ ...bar, height: bar.minutes ? Math.max(12, Math.round((bar.minutes / maxBar) * 100)) : 6 }));
    const modulesByTitle = new Map(noteIndex.modules.map((module) => [keyOf(module.title), module]));
    const moduleMap = new Map();
    const ensureModule = (id, title) => {
      const safeId = id || keyOf(title) || title;
      if (!moduleMap.has(safeId)) moduleMap.set(safeId, { name: title || 'General Study', materials: 0, planned: 0, done: 0, minutes: 0, scores: [], flash: [] });
      return moduleMap.get(safeId);
    };
    noteIndex.modules.forEach((module) => {
      const item = ensureModule(module.id, module.title);
      item.materials = module.materialCount;
    });
    plannerEvents.filter((event) => inRange(eventDate(event), range)).forEach((event) => {
      const item = ensureModule(event.moduleId || keyOf(event.studyTopic || event.title), event.studyTopic || event.title || event.moduleId);
      item.planned += 1;
      if (event.status === 'completed') {
        item.done += 1;
        item.minutes += eventMinutes(event);
      }
    });
    currentQuizzes.forEach((quiz) => {
      const title = quizModule(quiz);
      const known = modulesByTitle.get(keyOf(title));
      ensureModule(known?.id || keyOf(title), known?.title || title).scores.push(quizScore(quiz));
    });
    flashCollections.forEach((collection) => {
      const source = collection.selectedSources?.[0] || {};
      const parts = String(source.path || '').split('/').map((part) => part.trim()).filter(Boolean);
      const title = parts[1] || collection.title || source.title || 'Flash Cards';
      const known = modulesByTitle.get(keyOf(title));
      ensureModule(collection.moduleId || source.moduleId || known?.id || keyOf(title), known?.title || title).flash.push(Number(collection.analytics?.completionPercentage || 0));
    });
    const modules = [...moduleMap.values()].map((module, index) => {
      const factors = [];
      if (module.planned) factors.push({ value: (module.done / module.planned) * 100, weight: 0.35 });
      if (module.scores.length) factors.push({ value: avg(module.scores), weight: 0.4 });
      if (module.flash.length) factors.push({ value: avg(module.flash), weight: 0.25 });
      const weight = factors.reduce((sum, item) => sum + item.weight, 0);
      const progress = weight ? Math.round(factors.reduce((sum, item) => sum + item.value * item.weight, 0) / weight) : 0;
      return { name: module.name, progress, hours: formatHours(module.minutes), score: module.scores.length ? `${Math.round(avg(module.scores))}%` : 'No quiz', accent: accents[index % accents.length], activity: module.materials + module.planned + module.scores.length + module.flash.length };
    }).filter((module) => module.activity > 0).sort((a, b) => b.activity - a.activity || b.progress - a.progress).slice(0, 8);

    const plannerItems = plannerEvents.filter((event) => plannerStatus(event) !== 'completed').map((event) => {
      const type = eventTypes[event.type] || eventTypes.task;
      return { id: event.eventId || event.id || `${event.title}-${event.date}`, type: type.label, title: event.title || 'Untitled plan', time: plannerTime(event), status: plannerStatus(event), icon: type.icon, date: eventDate(event) || new Date(0) };
    }).sort((a, b) => (a.status === 'overdue' ? -1 : 0) - (b.status === 'overdue' ? -1 : 0) || a.date - b.date).slice(0, 4);

    const calendarStart = startWeek(new Date());
    const calendarDays = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(calendarStart, index);
      const dayEvents = plannerEvents.filter((event) => event.date === toInputDate(date));
      const mark = sameDay(date, new Date()) ? 'today' : dayEvents[0] ? (eventTypes[dayEvents[0].type] || eventTypes.task).mark : '';
      return { key: toInputDate(date), date: String(date.getDate()), mark };
    });
    const calendarLabel = new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date());

    const weakAreas = [
      ...currentQuizzes.map((quiz) => ({ topic: quiz.title || quizModule(quiz), scoreNumber: quizScore(quiz), score: `${quizScore(quiz)}%`, action: 'Retake quiz', icon: 'quiz', route: '/quiz-generator' })).filter((item) => item.scoreNumber < 75),
      ...flashCollections.map((collection) => ({ topic: collection.title || 'Flash card review', scoreNumber: Number(collection.analytics?.retentionRate || 100), score: collection.analytics?.retentionRate ? `${collection.analytics.retentionRate}%` : 'No reviews', action: 'Review flashcards', icon: 'style', route: '/flashcards' })).filter((item) => item.scoreNumber < 70),
    ].sort((a, b) => a.scoreNumber - b.scoreNumber).slice(0, 3);

    const recentActivity = [
      ...quizStore.quizzes.flatMap((quiz) => [
        quiz.createdAt && { title: 'Generated quiz', detail: `${quiz.title || 'Untitled quiz'} - ${quiz.totalQuestions || quiz.questions?.length || 0} questions`, date: toDate(quiz.createdAt), time: relativeTime(quiz.createdAt), icon: 'auto_awesome' },
        quiz.status === 'completed' && (quiz.completedAt || quiz.updatedAt) && { title: 'Completed quiz', detail: `${quiz.title || 'Untitled quiz'} scored ${quizScore(quiz)}%`, date: toDate(quiz.completedAt || quiz.updatedAt), time: relativeTime(quiz.completedAt || quiz.updatedAt), icon: 'verified' },
      ]),
      ...plannerEvents.flatMap((event) => [
        event.createdAt && { title: 'Scheduled planner item', detail: `${event.title || 'Untitled plan'} - ${(eventTypes[event.type] || eventTypes.task).label}`, date: toDate(event.createdAt), time: relativeTime(event.createdAt), icon: 'calendar_today' },
        event.status === 'completed' && event.updatedAt && { title: 'Completed planner item', detail: event.title || 'Untitled plan', date: toDate(event.updatedAt), time: relativeTime(event.updatedAt), icon: 'task_alt' },
      ]),
      ...flashCollections.flatMap((collection) => [
        collection.createdAt && { title: 'Created flashcards', detail: `${collection.title || 'Flash card collection'} - ${collection.cardCount || collection.analytics?.totalFlashCards || 0} cards`, date: toDate(collection.createdAt), time: relativeTime(collection.createdAt), icon: 'style' },
        collection.analytics?.lastStudyDate && { title: 'Reviewed flashcards', detail: collection.title || 'Flash card collection', date: toDate(collection.analytics.lastStudyDate), time: relativeTime(collection.analytics.lastStudyDate), icon: 'event_repeat' },
      ]),
    ].filter(Boolean).filter((item) => item.date).sort((a, b) => b.date - a.date).slice(0, 6);

    const aiInsights = [
      studyMinutes > lastStudyMinutes && studyMinutes > 0 ? `Your completed study time is up ${percentDelta(studyMinutes, lastStudyMinutes).label} for this range.` : '',
      averageScore >= 85 ? `Quiz accuracy is strong at ${averageScore}%. Keep using mixed practice.` : averageScore > 0 ? `Average quiz score is ${averageScore}%. Review low-scoring quizzes before creating new ones.` : '',
      weakAreas[0] ? `Focus next on ${weakAreas[0].topic}; it is your lowest current signal.` : '',
      overdue ? `${overdue} planner ${overdue === 1 ? 'item is' : 'items are'} overdue. Clear those first.` : '',
      flash.due ? `${flash.due} flash cards are due or overdue for spaced review.` : '',
      quizStatus.partial ? `${quizStatus.partial} quiz ${quizStatus.partial === 1 ? 'attempt is' : 'attempts are'} waiting to be finished.` : '',
    ].filter(Boolean).slice(0, 3);

    return { summaryCards, studyBars, subjectScores, quizStatus, difficultyStats, modules, plannerItems, calendarDays, calendarLabel, weakAreas, recentActivity, aiInsights: aiInsights.length ? aiInsights : ['Add planner sessions, quizzes, or flashcard reviews to build richer analytics.'], flash, hasData: Boolean(noteIndex.materials.length || quizStore.quizzes.length || plannerEvents.length || flashCollections.length), rangeLabel: range.label };
  }, [chartPeriod, flashCollections, noteIndex, plannerEvents, previous, profile, quizStore.quizzes, range, rangeKey]);

  const loading = notes.loading || quizStore.loading || plannerLoading || flashLoading;
  const errorMessage = notes.error?.message || quizStore.error?.message || plannerError?.message || flashError?.message || '';
  const exportReport = () => {
    const reportWindow = window.open('', '_blank', 'width=960,height=1200');
    if (!reportWindow) return;

    reportWindow.document.open();
    reportWindow.document.write(buildAnalyticsPdfReportHtml({ analytics, profile, currentUser }));
    reportWindow.document.close();
  };
  return (
    <main className="analytics-page">
      <section className="analytics-hero">
        <div className="analytics-hero__copy"><span className="analytics-kicker">Learning intelligence</span><h1>Analytics</h1><p>Track your learning progress and improve your study performance.</p></div>
        <div className="analytics-hero__actions" aria-label="Analytics controls">
          <div className="analytics-range" role="group" aria-label="Date range">
            {rangeOptions.map(([key, label]) => <button key={key} className={rangeKey === key ? 'is-active' : ''} type="button" aria-pressed={rangeKey === key} onClick={() => setRangeKey(key)}>{label}</button>)}
          </div>
          {rangeKey === 'custom' && <div className="analytics-custom-range"><input type="date" value={customRange.start} onChange={(event) => setCustomRange((current) => ({ ...current, start: event.target.value }))} aria-label="Analytics custom start date" /><input type="date" value={customRange.end} onChange={(event) => setCustomRange((current) => ({ ...current, end: event.target.value }))} aria-label="Analytics custom end date" /></div>}
          <button className="analytics-export" type="button" onClick={exportReport} disabled={!analytics.hasData}><span className="material-symbols-outlined">picture_as_pdf</span>PDF Report</button>
        </div>
      </section>
      {errorMessage && <section className="analytics-alert" role="alert"><span className="material-symbols-outlined">error</span><p>{errorMessage}</p></section>}
      <section className="analytics-summary" aria-label="Analytics summary">
        {analytics.summaryCards.map((card) => <article className={`analytics-stat analytics-stat--${card.tone}`} key={card.label}><div className="analytics-stat__icon"><span className="material-symbols-outlined">{card.icon}</span></div><div><p>{card.label}</p><strong>{card.value}</strong></div><TrendBadge change={card.change} /><small>{card.helper}</small></article>)}
      </section>
      {loading && <section className="analytics-grid analytics-grid--states"><article className="analytics-card loading-state" aria-label="Loading analytics"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton-grid"><span className="skeleton skeleton-box" /><span className="skeleton skeleton-box" /><span className="skeleton skeleton-box" /></div></article></section>}
      {!loading && !analytics.hasData ? (
        <section className="analytics-grid analytics-grid--states"><article className="analytics-card empty-state"><span className="material-symbols-outlined">insights</span><div><h2>No analytics data yet</h2><p>Upload notes, complete quizzes, review flashcards, or schedule a study session to start building your learning report.</p></div><button type="button" onClick={() => navigate('/study-planner')}>Start studying</button></article></section>
      ) : (
        <>
          <section className="analytics-grid analytics-grid--charts">
            <article className="analytics-card analytics-card--wide">
              <div className="analytics-card__header"><div><h2>Study Progress</h2><p>Completed study time for {analytics.rangeLabel.toLowerCase()}</p></div><div className="analytics-tabs" role="group" aria-label="Study progress filter">{chartOptions.map((tab) => <button className={chartPeriod === tab ? 'is-active' : ''} key={tab} type="button" aria-pressed={chartPeriod === tab} onClick={() => setChartPeriod(tab)}>{tab}</button>)}</div></div>
              <div className="study-chart" aria-label="Bar chart of completed study time">{analytics.studyBars.map((bar) => <div className="study-chart__item" key={`${chartPeriod}-${bar.day}`}><span className="study-chart__value">{bar.hours}</span><div className="study-chart__track"><span style={{ height: `${bar.height}%` }} /></div><strong>{bar.day}</strong></div>)}</div>
            </article>
            <article className="analytics-card quiz-card">
              <div className="analytics-card__header"><div><h2>Quiz Performance</h2><p>Average marks by module</p></div></div>
              <div className="score-bars">{analytics.subjectScores.length ? analytics.subjectScores.map((item) => <div className="score-bars__row" key={item.subject}><div><span>{item.subject}</span><strong>{item.score}%</strong></div><div className="score-bars__track"><span style={{ width: `${item.score}%`, backgroundColor: item.color }} /></div></div>) : <EmptyInline icon="quiz">Complete a quiz in this range to compare module scores.</EmptyInline>}</div>
              <div className="quiz-status"><div><strong>{analytics.quizStatus.completed}</strong><span>Completed</span></div><div><strong>{analytics.quizStatus.partial}</strong><span>Partial</span></div><div><strong>{analytics.quizStatus.notAttempted}</strong><span>Not attempted</span></div></div>
              <div className="difficulty-badges" aria-label="Quiz difficulty badges">{analytics.difficultyStats.map((item) => <span className={item.difficulty} key={item.difficulty}>{titleCase(item.difficulty)} {item.count}</span>)}</div>
            </article>
          </section>

          <section className="analytics-card">
            <div className="analytics-card__header"><div><h2>Subject / Module Progress</h2><p>How each learning area is moving forward</p></div></div>
            {analytics.modules.length ? <div className="module-grid">{analytics.modules.map((module) => <article className={`module-card module-card--${module.accent}`} key={module.name}><div><h3>{module.name}</h3><span>{module.progress}%</span></div><div className="module-meta"><span>{module.hours} studied</span><span>{module.score} avg score</span></div><div className="module-progress"><span style={{ width: `${module.progress}%` }} /></div></article>)}</div> : <EmptyInline icon="topic">Create modules, complete planner sessions, or finish quizzes to see module progress.</EmptyInline>}
          </section>

          <section className="analytics-grid analytics-grid--balanced">
            <article className="analytics-card planner-card">
              <div className="analytics-card__header"><div><h2>Study Planner Insights</h2><p>Upcoming exams, assignments, and sessions</p></div></div>
              <div className="planner-layout"><div className="planner-list">{analytics.plannerItems.length ? analytics.plannerItems.map((item) => <div className={`planner-item planner-item--${item.status}`} key={item.id}><span className="material-symbols-outlined">{item.icon}</span><div><strong>{item.title}</strong><p>{item.type} - {item.time}</p></div></div>) : <EmptyInline icon="event_available">No upcoming planner items. Schedule your next study block when you are ready.</EmptyInline>}</div><div className="mini-calendar" aria-label="Mini calendar preview"><div className="mini-calendar__header"><strong>{analytics.calendarLabel}</strong><span>Plan</span></div><div className="mini-calendar__grid">{analytics.calendarDays.map((day) => <span className={day.mark ? `is-${day.mark}` : ''} key={day.key}>{day.date}</span>)}</div></div></div>
            </article>
            <article className="analytics-card ai-insight-card"><div className="ai-insight-card__avatar"><span className="material-symbols-outlined">smart_toy</span></div><div><span className="analytics-kicker">AI Learning Insights</span><h2>Personalized next steps</h2></div><div className="ai-suggestions">{analytics.aiInsights.map((insight) => <div key={insight}><span className="material-symbols-outlined">auto_awesome</span><p>{insight}</p></div>)}</div></article>
          </section>

          <section className="analytics-grid analytics-grid--recommendations">
            <article className="analytics-card weak-card">
              <div className="analytics-card__header"><div><h2>Weak Areas & Recommendations</h2><p>Topics that need a focused review</p></div></div>
              <div className="weak-list">{analytics.weakAreas.length ? analytics.weakAreas.map((area) => <div className="weak-item" key={area.topic}><div><strong>{area.topic}</strong><span>{area.score} recent score</span></div><button type="button" onClick={() => navigate(area.route)}><span className="material-symbols-outlined">{area.icon}</span>{area.action}</button></div>) : <EmptyInline icon="verified">No weak areas found in this range. Keep collecting quiz and review data.</EmptyInline>}</div>
              <div className="recommendation-actions">{quickActions.map(([icon, label, route]) => <button type="button" key={label} onClick={() => navigate(route)}><span className="material-symbols-outlined">{icon}</span>{label}</button>)}</div>
            </article>
            <article className="analytics-card activity-card">
              <div className="analytics-card__header"><div><h2>Recent Activity</h2><p>Your latest learning actions</p></div></div>
              <div className="activity-timeline">{analytics.recentActivity.length ? analytics.recentActivity.map((activity) => <div className="activity-item" key={`${activity.title}-${activity.detail}-${activity.time}`}><span className="activity-item__icon material-symbols-outlined">{activity.icon}</span><div><strong>{activity.title}</strong><p>{activity.detail}</p></div><time>{activity.time}</time></div>) : <EmptyInline icon="history">No recent activity yet. New quiz, planner, and flashcard actions will appear here.</EmptyInline>}</div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

export default AnalyticsPage;






