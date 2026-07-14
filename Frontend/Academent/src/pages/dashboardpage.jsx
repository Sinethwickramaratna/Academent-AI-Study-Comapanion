import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import './dashboardpage.css';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../Services/authService';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingEffect from '../components/LoadingEffect';
import TopBar from '../components/TopBar';
import logo from '../assets/Logo/Logo.png';
import { dashboardWindowItems, getDashboardRouteForTab, getDashboardTabForPath } from '../routes/windowRoutes';
import { DEFAULT_DASHBOARD_DATA, subscribeDashboardData } from '../Services/dashboardService';
import { markStudyPlannerEventCompleted, saveStudyPlannerEvent } from '../Services/studyPlannerService';

const NotePage = lazy(() => import('./notepage'));
const QuizGeneratorPage = lazy(() => import('./quizgeneratorpage'));
const AITutorPage = lazy(() => import('./aitutorpage'));
const StudyPlannerPage = lazy(() => import('./studyplannerpage'));
const FlashCardsPage = lazy(() => import('./flashcardspage'));
const AnalyticsPage = lazy(() => import('./analyticspage'));
const ProfileSettingsPage = lazy(() => import('./profilesettingspage'));


const DAY_MS = 24 * 60 * 60 * 1000;
const RING_CIRCUMFERENCE = 339.29;

const eventTypeMeta = {
  exam: { label: 'Exam', icon: 'school' },
  assignment: { label: 'Assignment', icon: 'assignment' },
  task: { label: 'Task', icon: 'task_alt' },
  studyPlan: { label: 'Study Session', icon: 'event_available' },
};

const taskToneClasses = {
  urgent: {
    tagColor: 'bg-error-container text-on-error-container',
    borderHover: 'hover:border-error/50',
    barColor: 'bg-error',
  },
  primary: {
    tagColor: 'bg-surface-container-highest text-on-surface-variant',
    borderHover: 'hover:border-primary/50',
    barColor: 'bg-primary',
  },
  routine: {
    tagColor: 'bg-surface-container-highest text-on-surface-variant',
    borderHover: 'hover:border-tertiary-fixed-dim/50',
    barColor: 'bg-tertiary-fixed-dim',
  },
};

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

const startWeek = (value = new Date()) => {
  const date = startDay(value);
  const day = date.getDay();
  return new Date(date.getTime() + (day === 0 ? -6 : 1 - day) * DAY_MS);
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

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
const clamp = (value) => Math.max(0, Math.min(100, Number(value || 0)));
const average = (items) => {
  const values = items.map(Number).filter(Number.isFinite);
  return values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : 0;
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

const formatHours = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)));
  if (!safeMinutes) return '0h';
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = safeMinutes / 60;
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}h`;
};

const formatHourValue = (hours = 0) => {
  const rounded = Math.round(Number(hours || 0) * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes || 0);
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${Math.round((size / 1024 / 1024) * 10) / 10} MB`;
};

const normalizeSearchTerm = (value) => String(value || '').trim().toLowerCase();
const searchIncludes = (term, ...values) => !term || values
  .flat(Infinity)
  .some((value) => String(value || '').toLowerCase().includes(term));

const getWeeklyTargetHours = (weeklyHours) => {
  const numbers = String(weeklyHours || '5-10').match(/\d+/g)?.map(Number) || [];
  return numbers.length ? numbers[numbers.length - 1] : 10;
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
  if (event?.status === 'completed') return 'completed';
  const end = eventDate(event, true) || eventDate(event);
  if (end && end < new Date()) return 'overdue';
  return eventDate(event) && sameDay(eventDate(event), new Date()) ? 'today' : 'upcoming';
};

const plannerTime = (event) => {
  const date = eventDate(event);
  if (!date) return 'No date set';
  const status = plannerStatus(event);
  if (status === 'overdue') {
    const days = Math.max(1, Math.ceil((startDay(new Date()) - startDay(date)) / DAY_MS));
    return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (sameDay(date, new Date())) return `Today, ${shortTime(event.startTime)}`;
  if (sameDay(date, addDays(startDay(new Date()), 1))) return `Tomorrow, ${shortTime(event.startTime)}`;
  return `${shortDate(date)}, ${shortTime(event.startTime)}`;
};

const quizDate = (quiz) => toDate(quiz?.completedAt) || toDate(quiz?.updatedAt) || toDate(quiz?.createdAt) || new Date(0);
const quizScore = (quiz) => {
  const percentage = Number(quiz?.percentage);
  if (Number.isFinite(percentage)) return clamp(percentage);
  const score = Number(quiz?.score);
  const total = Number(quiz?.totalQuestions || quiz?.questions?.length || 0);
  return Number.isFinite(score) && total > 0 ? clamp(Math.round((score / total) * 100)) : 0;
};

const flattenNoteManagement = (data = {}) => {
  const materials = [];
  const modules = [];
  const addMaterial = (item, type, semester, module, path) => {
    const id = type === 'note' ? item.noteId : item.pdfId;
    if (!id) return;
    const title = item.title || item.originalName || (type === 'note' ? 'Untitled note' : 'Untitled PDF');
    const content = String(item.content || '');
    materials.push({
      id,
      type,
      title,
      path,
      moduleId: module.moduleId,
      moduleTitle: module.title || 'Untitled module',
      size: item.size || 0,
      pageCount: item.pageCount || item.pages || 0,
      wordCount: type === 'note' ? content.split(/\s+/).filter(Boolean).length : 0,
    });
  };
  const visitFolder = (folder, semester, module, path) => {
    const nextPath = `${path} / ${folder.title || 'Folder'}`;
    (folder.notes || []).forEach((note) => addMaterial(note, 'note', semester, module, nextPath));
    (folder.pdfs || []).forEach((pdf) => addMaterial(pdf, 'pdf', semester, module, nextPath));
    (folder.folders || []).forEach((child) => visitFolder(child, semester, module, nextPath));
  };

  (data.semesters || []).forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const path = `${semester.title || 'Semester'} / ${module.title || 'Module'}`;
      const beforeCount = materials.length;
      (module.notes || []).forEach((note) => addMaterial(note, 'note', semester, module, path));
      (module.pdfs || []).forEach((pdf) => addMaterial(pdf, 'pdf', semester, module, path));
      (module.folders || []).forEach((folder) => visitFolder(folder, semester, module, path));
      modules.push({
        id: module.moduleId,
        title: module.title || 'Untitled module',
        semester: semester.title || 'Semester',
        materialCount: materials.length - beforeCount,
      });
    });
  });

  return { materials, modules };
};

const materialIcon = (type) => (type === 'pdf'
  ? { icon: 'picture_as_pdf', iconColor: 'bg-blue-100 text-blue-600', btn2: 'Generate Quiz' }
  : { icon: 'edit_note', iconColor: 'bg-purple-100 text-purple-600', btn2: 'Flashcards' });

const materialInfo = (material) => {
  const details = [];
  if (material.path) details.push(material.path);
  if (material.type === 'note' && material.wordCount) details.push(`${material.wordCount} words`);
  if (material.type === 'pdf') {
    const size = formatFileSize(material.size);
    if (size) details.push(size);
    if (material.pageCount) details.push(`${material.pageCount} pages`);
  }
  return details.slice(0, 2).join(' - ') || 'Saved in My Notes';
};

const mapDashboardMaterial = (material) => ({
  ...material,
  name: material.title,
  info: materialInfo(material),
  btn1: 'Summarize',
  ...materialIcon(material.type),
});

const flashTotals = (collections = []) => {
  const totals = collections.reduce((sum, collection) => {
    const analytics = collection.analytics || {};
    sum.totalCards += Number(analytics.totalFlashCards || collection.cardCount || 0);
    sum.due += Number(analytics.dueToday || 0) + Number(analytics.overdueCards || 0);
    sum.reviews += Number(analytics.cardsReviewed || analytics.reviewSessions || 0);
    sum.completion.push(Number(analytics.completionPercentage || 0));
    sum.retention.push(Number(analytics.retentionRate || 0));
    const lastStudyDate = toDate(analytics.lastStudyDate);
    if (lastStudyDate) sum.studyDates.push(lastStudyDate);
    return sum;
  }, { totalCards: 0, due: 0, reviews: 0, completion: [], retention: [], studyDates: [] });

  return {
    ...totals,
    completionPercentage: Math.round(average(totals.completion)),
    retentionRate: Math.round(average(totals.retention)),
  };
};

const calculateStreak = (dates = []) => {
  const dayKeys = new Set(dates.map((date) => toInputDate(startDay(date))));
  let streak = 0;
  let cursor = startDay(new Date());
  while (dayKeys.has(toInputDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

const taskTone = (event, status) => {
  if (status === 'overdue' || event.priority === 'high') return 'urgent';
  if (event.type === 'studyPlan') return 'routine';
  return 'primary';
};

const buildDashboardTasks = (events = [], flashCollections = []) => {
  const pendingPlannerTasks = events
    .filter((event) => event.type !== 'exam' && event.status !== 'completed')
    .map((event) => {
      const status = plannerStatus(event);
      const tone = taskTone(event, status);
      const progress = status === 'overdue' ? 18 : status === 'today' ? 60 : 30;
      return {
        id: event.eventId || event.id,
        source: 'planner',
        rawEvent: event,
        title: event.title || event.studyTopic || 'Untitled plan',
        tag: status === 'overdue' ? 'Urgent' : status === 'today' ? 'Today' : eventTypeMeta[event.type]?.label || 'Task',
        due: plannerTime(event),
        progress,
        completed: false,
        date: eventDate(event) || new Date(0),
        priority: event.priority || 'medium',
        ...taskToneClasses[tone],
      };
    })
    .sort((left, right) => {
      const statusWeight = { overdue: 0, today: 1, upcoming: 2 };
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      return (statusWeight[plannerStatus(left.rawEvent)] ?? 2) - (statusWeight[plannerStatus(right.rawEvent)] ?? 2)
        || (priorityWeight[left.priority] ?? 1) - (priorityWeight[right.priority] ?? 1)
        || left.date - right.date;
    });

  const flash = flashTotals(flashCollections);
  const flashTask = flash.due > 0 ? [{
    id: 'flash-review-due',
    source: 'flashcards',
    title: `${flash.due} flash cards due for review`,
    tag: 'Routine',
    due: 'Spaced repetition queue',
    progress: Math.max(10, Math.min(95, flash.completionPercentage || 20)),
    completed: false,
    ...taskToneClasses.routine,
  }] : [];

  return [...pendingPlannerTasks, ...flashTask].slice(0, 5);
};

const buildExamCountdowns = (events = []) => events
  .filter((event) => event.type === 'exam' && event.status !== 'completed')
  .map((event) => ({ ...event, sortDate: eventDate(event) }))
  .filter((event) => event.sortDate && event.sortDate >= startDay(new Date()))
  .sort((left, right) => left.sortDate - right.sortDate)
  .slice(0, 3)
  .map((event) => ({
    id: event.eventId || event.id,
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(event.sortDate).toUpperCase(),
    day: String(event.sortDate.getDate()).padStart(2, '0'),
    title: event.title || 'Upcoming exam',
    detail: `${event.studyTopic || event.description || 'Exam'} - ${shortTime(event.startTime)}`,
  }));

const deriveDashboardMetrics = (profile, dashboardData, noteIndex) => {
  const quizzes = dashboardData.quizzes || [];
  const plannerEvents = dashboardData.plannerEvents || [];
  const flash = flashTotals(dashboardData.flashCardCollections || []);
  const targetHours = getWeeklyTargetHours(profile?.learningPreferences?.weeklyHours);
  const weekStart = startWeek(new Date());
  const weekEnd = addDays(weekStart, 7);
  const completedEvents = plannerEvents.filter((event) => event.status === 'completed');
  const weeklyCompletedEvents = completedEvents.filter((event) => {
    const date = eventDate(event) || toDate(event.updatedAt);
    return date && date >= weekStart && date < weekEnd;
  });
  const studyMinutes = weeklyCompletedEvents.reduce((sum, event) => sum + eventMinutes(event), 0);
  const studiedHours = Math.round((studyMinutes / 60) * 10) / 10;
  const goalPercentage = targetHours ? clamp(Math.round((studiedHours / targetHours) * 100)) : 0;
  const completedQuizzes = quizzes.filter((quiz) => quiz.status === 'completed');
  const averageQuizScore = Math.round(average(completedQuizzes.map(quizScore)));
  const workEvents = plannerEvents.filter((event) => event.type !== 'exam');
  const completedWorkCount = workEvents.filter((event) => event.status === 'completed').length;
  const workCompletionRate = workEvents.length ? Math.round((completedWorkCount / workEvents.length) * 100) : 0;
  const productivityFactors = [goalPercentage];
  if (completedQuizzes.length) productivityFactors.push(averageQuizScore);
  if (workEvents.length) productivityFactors.push(workCompletionRate);
  if ((dashboardData.flashCardCollections || []).length) productivityFactors.push(flash.completionPercentage);
  const productivityScore = Math.round(average(productivityFactors));
  const activityDates = [
    ...completedEvents.map((event) => eventDate(event) || toDate(event.updatedAt)),
    ...completedQuizzes.map(quizDate),
    ...flash.studyDates,
  ].filter(Boolean);
  const streak = calculateStreak(activityDates);
  const notesCreated = noteIndex.materials.filter((material) => material.type === 'note').length;
  const targetGpa = String(profile?.academicGoals?.targetGpa || '').trim();
  const xp = completedWorkCount * 75
    + completedQuizzes.length * 120
    + noteIndex.materials.length * 20
    + flash.totalCards * 5
    + flash.reviews * 15;

  return {
    targetHours,
    studiedHours,
    weeklyStudyHours: formatHours(studyMinutes),
    goalPercentage,
    strokeDashoffset: RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * goalPercentage) / 100,
    studyHoursRemaining: Math.max(0, Math.round((targetHours - studiedHours) * 10) / 10),
    streak,
    notesCreated,
    quizzesTaken: completedQuizzes.length,
    targetGpa: targetGpa || 'Not set',
    gpaHelper: targetGpa ? 'Target from onboarding' : 'Add target in profile',
    quizAccuracy: completedQuizzes.length ? `${averageQuizScore}%` : '0%',
    quizHelper: completedQuizzes.length ? `${completedQuizzes.length} completed quizzes` : 'Complete a quiz to unlock this',
    completedWork: `${completedWorkCount}/${workEvents.length || 0}`,
    completedWorkHelper: `${workCompletionRate}% planner completion`,
    productivityScore,
    productivityHelper: productivityFactors.length > 1 ? 'Based on your live study signals.' : 'Add quizzes, tasks, or flashcards for richer scoring.',
    flash,
    xp,
  };
};

const buildScoreboard = (fullName, photoURL, metrics) => ([
  { id: 'you', rank: 1, name: fullName, value: `${metrics.xp.toLocaleString()} XP`, photoURL, highlight: true, icon: 'person' },
  { id: 'goal', rank: 2, name: 'Weekly goal', value: `${metrics.goalPercentage}%`, icon: 'flag' },
  { id: 'accuracy', rank: 3, name: 'Quiz accuracy', value: metrics.quizAccuracy, icon: 'verified' },
]);

const buildTutorPreviewMessages = (conversations = [], fullName = 'Student') => {
  if (!conversations.length) {
    return [{
      id: 'ai-welcome',
      sender: 'ai',
      text: `Hello ${fullName.split(' ')[0] || 'there'}! Your recent AI Tutor conversations will appear here once you start asking questions.`,
      actions: ['Open AI Tutor'],
    }];
  }

  return conversations.slice(0, 4).reverse().map((conversation) => ({
    id: conversation.conversationId || conversation.id,
    sender: 'ai',
    text: `${conversation.title || 'AI Tutor Chat'}\n${conversation.preview || 'No preview available yet.'}`,
    details: {
      title: relativeTime(conversation.updatedAt),
      content: `${Number(conversation.messageCount || 0)} saved messages`,
    },
    actions: ['Open AI Tutor'],
  }));
};

/**
 * DashboardPage component represents the study companion central control panel.
 * Displays student's custom courses, goals progress, and study tools.
 */
function DashboardPage({ initialActiveTab = 'home' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeActiveTab = getDashboardTabForPath(location.pathname) || initialActiveTab || 'home';
  
  const uid = currentUser?.uid || null;
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const activeTab = routeActiveTab;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [quizToOpenId, setQuizToOpenId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!uid) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setProfile(null);
        setDashboardData(DEFAULT_DASHBOARD_DATA);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setDashboardError(null);
    });

    const unsubscribe = subscribeDashboardData(
      uid,
      (nextData) => {
        if (cancelled) return;
        setDashboardData(nextData);
        setProfile(nextData.profile);
        setLoading(false);
      },
      (error) => {
        if (cancelled) return;
        console.error('Failed to load dashboard data:', error);
        setDashboardError(error);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);

  const effectiveProfile = profile || dashboardData.profile || null;
  const noteIndex = useMemo(() => flattenNoteManagement(dashboardData.noteManagement), [dashboardData.noteManagement]);

  const fullName = effectiveProfile?.fullName || currentUser?.displayName || 'Student';
  const major = effectiveProfile?.academicProfile?.major || 'Undecided Major';
  const rawSubjects = effectiveProfile?.academicProfile?.subjects;
  const subjects = Array.isArray(rawSubjects) && rawSubjects.length
    ? rawSubjects
    : rawSubjects
      ? [rawSubjects]
      : ['General Study'];
  const studyStyle = effectiveProfile?.learningPreferences?.studyStyle || 'visual';
  const photoURL = currentUser?.photoURL || effectiveProfile?.photoURL || '';

  const metrics = useMemo(() => deriveDashboardMetrics(effectiveProfile, dashboardData, noteIndex), [dashboardData, effectiveProfile, noteIndex]);
  const tasks = useMemo(() => buildDashboardTasks(dashboardData.plannerEvents, dashboardData.flashCardCollections), [dashboardData.flashCardCollections, dashboardData.plannerEvents]);
  const examCountdowns = useMemo(() => buildExamCountdowns(dashboardData.plannerEvents), [dashboardData.plannerEvents]);
  const messages = useMemo(() => buildTutorPreviewMessages(dashboardData.tutorConversations, fullName), [dashboardData.tutorConversations, fullName]);
  const dashboardSearchTerm = normalizeSearchTerm(dashboardSearch);
  const visibleMessages = useMemo(() => (dashboardSearchTerm ? messages.filter((message) => searchIncludes(dashboardSearchTerm, message.text, message.details?.title, message.details?.content, message.actions)) : messages), [dashboardSearchTerm, messages]);
  const visibleTasks = useMemo(() => (dashboardSearchTerm ? tasks.filter((task) => searchIncludes(dashboardSearchTerm, task.title, task.tag, task.due, task.priority, task.source)) : tasks), [dashboardSearchTerm, tasks]);
  const visibleSubjects = useMemo(() => (dashboardSearchTerm ? subjects.filter((subject) => searchIncludes(dashboardSearchTerm, subject)) : subjects), [dashboardSearchTerm, subjects]);
  const allMaterials = useMemo(() => noteIndex.materials.map(mapDashboardMaterial), [noteIndex.materials]);
  const materials = useMemo(() => {
    if (dashboardSearchTerm) {
      return allMaterials.filter((material) => searchIncludes(dashboardSearchTerm, material.name, material.info, material.path, material.moduleTitle, material.type)).slice(0, 6);
    }
    return allMaterials.slice(-6).reverse().slice(0, 3);
  }, [allMaterials, dashboardSearchTerm]);
  const scoreboardItems = useMemo(() => buildScoreboard(fullName, photoURL, metrics), [fullName, metrics, photoURL]);

  const targetHours = metrics.targetHours;
  const studiedHours = formatHourValue(metrics.studiedHours);
  const percentage = metrics.goalPercentage;
  const strokeDashoffset = metrics.strokeDashoffset;
  const averageGpa = metrics.targetGpa;
  const gpaProgress = metrics.gpaHelper;
  const weeklyStudyHours = metrics.weeklyStudyHours;
  const quizAccuracy = metrics.quizAccuracy;
  const completedWork = metrics.completedWork;
  const sidebarItems = dashboardWindowItems;

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Log out currently signed-in user and redirect to login page.
   */
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const switchToTab = (tabId) => {
    const nextRoute = getDashboardRouteForTab(tabId);
    setIsMobileMenuOpen(false);

    if (location.pathname !== nextRoute) {
      navigate(nextRoute);
    }
  };

  const openAiTutorWithPrompt = (text = '') => {
    const promptText = text.trim();
    if (promptText) sessionStorage.setItem('academent_dashboard_ai_prompt', promptText);
    switchToTab('ai-tutor');
  };

  const toggleTaskCompleted = async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    if (task.source === 'flashcards') {
      switchToTab('flashcards');
      return;
    }

    if (!uid) {
      alert('Please sign in before updating tasks.');
      return;
    }

    setIsSavingTask(true);
    try {
      await markStudyPlannerEventCompleted(uid, id);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert(error.message || 'Could not update this task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleAddTask = async () => {
    if (!uid) {
      alert('Please sign in before adding tasks.');
      return;
    }

    const title = prompt('Enter task title:');
    if (!title?.trim()) return;
    const priorityInput = prompt('Enter priority (high, medium, low):', 'medium') || 'medium';
    const dateInput = prompt('Enter due date (YYYY-MM-DD):', toInputDate(new Date())) || toInputDate(new Date());
    const dueDate = fromInputDate(dateInput);

    if (!dueDate) {
      alert('Please use the YYYY-MM-DD date format.');
      return;
    }

    const normalizedPriority = priorityInput.trim().toLowerCase();
    const priority = normalizedPriority === 'urgent' ? 'high' : ['high', 'medium', 'low'].includes(normalizedPriority) ? normalizedPriority : 'medium';

    setIsSavingTask(true);
    try {
      await saveStudyPlannerEvent(uid, {
        title: title.trim(),
        type: 'task',
        date: toInputDate(dueDate),
        startTime: '09:00',
        endTime: '09:30',
        priority,
        repeat: 'none',
        reminder: { enabled: false, beforeMinutes: 0 },
        description: 'Created from the dashboard.',
        status: 'pending',
        durationMinutes: 30,
      });
    } catch (error) {
      console.error('Failed to save dashboard task:', error);
      alert(error.message || 'Could not save this task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleSendMessage = (textToSend = null) => {
    const text = String(textToSend || inputMessage || '').trim();
    setInputMessage('');
    openAiTutorWithPrompt(text);
  };

  const handleMaterialAction = (material, action) => {
    if (action === 'Generate Quiz') {
      switchToTab('quiz-generator');
      return;
    }
    if (action === 'Flashcards') {
      switchToTab('flashcards');
      return;
    }
    openAiTutorWithPrompt(`${action} my study material: "${material.name}"`);
  };

  const handleUpload = () => switchToTab('my-notes');
  const handleNewNote = () => switchToTab('my-notes');

  if (loading) {
    return (
      <LoadingEffect
        variant="full"
        icon="dashboard"
        title="Loading dashboard"
        message="Gathering your study stats, materials, and daily plan."
      />
    );
  }


  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex relative overflow-hidden h-screen">
      
      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* Left Sidebar (SideNavBar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={switchToTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        profile={effectiveProfile}
        onLogout={handleLogout}
        onNewNote={handleNewNote}
        items={sidebarItems}
        isHidden={isSidebarHidden}
        onToggleHidden={() => setIsSidebarHidden(true)}
      />

      {isSidebarHidden && (
        <button
          type="button"
          onClick={() => setIsSidebarHidden(false)}
          className="hidden md:flex fixed left-4 top-4 z-[60] w-11 h-11 items-center justify-center rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-primary shadow-lg hover:bg-surface-container-high transition-colors"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">left_panel_open</span>
        </button>
      )}

      {/* Main Content Scroll Area */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar transition-[padding] duration-300 ${isSidebarHidden ? 'md:pl-0' : 'md:pl-64'}`}>
        
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/20 py-md px-gutter z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg ai-gradient flex items-center justify-center text-white">
              <img alt="Academent AI Logo" className="w-7 h-7 object-contain" src={logo} />
            </div>
            <span className="font-headline-md text-primary font-black text-base leading-none">Academent AI</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-sm hover:bg-surface-container rounded-lg text-primary transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </header>

        {activeTab === 'home' ? (
          <main className="dashboard-home-window p-gutter md:p-margin-desktop space-y-xl">
            {/* Top Navigation Row */}
            <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search notes, topics, or AI chat..." searchValue={dashboardSearch} onSearchChange={setDashboardSearch} />

            {dashboardError && (
              <section className="glass-panel p-md rounded-xl border border-error/20 text-error text-sm" role="alert">
                {dashboardError.message || 'Could not load one or more dashboard sections.'}
              </section>
            )}

            {/* Welcome Hero Section */}
            <section className="dashboard-home-hero ai-gradient rounded-xl p-xl relative overflow-hidden text-white flex flex-col md:flex-row justify-between items-stretch md:items-center min-h-[220px] gap-lg">
              <div className="z-10 max-w-lg space-y-md flex-1">
                <h2 className="font-display-lg text-headline-lg md:text-display-lg">Good Morning, {fullName.split(' ')[0]} {fullName.split(' ')[1]}</h2>
                <p className="font-body-lg text-body-lg opacity-90">
                  You're on a <span className="font-bold text-tertiary-fixed">{metrics.streak}-day study streak</span>. {metrics.studyHoursRemaining > 0 ? `${formatHourValue(metrics.studyHoursRemaining)}h left for your weekly goal.` : 'Your weekly goal is complete.'}
                </p>
                <div className="flex flex-wrap gap-md pt-md">
                  <button 
                    onClick={() => {
                      const nextTask = tasks[0];
                      if (nextTask?.source === 'flashcards') switchToTab('flashcards');
                      else if (nextTask) switchToTab('study-planner');
                      else switchToTab('my-notes');
                    }}
                    className="px-xl py-md bg-white text-primary font-label-md text-label-md rounded-xl hover:bg-surface-container-low active:scale-95 transition-all shadow-md"
                  >
                    Continue Learning
                  </button>
                  <button 
                    onClick={() => switchToTab('ai-tutor')}
                    className="px-xl py-md bg-white/20 backdrop-blur-md border border-white/20 font-label-md text-label-md rounded-xl hover:bg-white/30 active:scale-95 transition-all"
                  >
                    Ask AI Tutor
                  </button>
                </div>
              </div>
              <div className="relative md:absolute md:right-0 md:top-0 md:bottom-0 w-full md:w-1/3 flex items-center justify-center md:justify-end pr-0 md:pr-xl overflow-visible h-48 md:h-auto">
                <img 
                  alt="AI Character Illustration" 
                  className="w-auto h-full max-h-[240px] md:max-h-none object-contain transform translate-y-0 md:translate-y-4 md:translate-x-6 lg:translate-x-12 md:scale-125 pointer-events-none" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfuLkyuYdDdGqUTAfc7f3WsJGCNH3KPT_exeRdeR1xYKRMY-Jll0gxZMYPF0cx8L_k28ETpl9RBKx-tQDGTo6PajwIHQw0wQ8fLsjSub2P1B1dn2yoBhvdBWdBIvra_xE6pZsDPTLsgfnT3OlFxj9qge85tfKa49X9wmYzlZJpE5IWJR4mgW2wf3ZF9FYq0W3xCJKGggs7LqGQl3IA_1BaQ9521_jKvgboXT-y0tAzeMPZX156drkTE1QlbG9zZsB--bixU8gGAVk"
                />
              </div>
              {/* Background Decoration */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/30 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-primary/20 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Stats Quick Look */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Streak</p>
                  <h3 className="font-headline-md text-headline-md truncate">{metrics.streak} {metrics.streak === 1 ? 'Day' : 'Days'}</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Notes Created</p>
                  <h3 className="font-headline-md text-headline-md truncate">{metrics.notesCreated}</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Quizzes Taken</p>
                  <h3 className="font-headline-md text-headline-md truncate">{metrics.quizzesTaken}</h3>
                </div>
              </div>
              <div className="glass-panel p-lg rounded-xl flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                </div>
                <div className="overflow-hidden">
                  <p className="font-label-sm text-label-sm text-outline truncate">Target GPA</p>
                  <h3 className="font-headline-md text-headline-md truncate">{metrics.targetGpa}</h3>
                </div>
              </div>
            </div>

            {/* Central AI Assistant & Study Plan / Right Sidebar Stack */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
              
              {/* Left/Middle Column (AI Assistant Panel and Tasks) */}
              <div className="col-span-1 xl:col-span-8 space-y-lg">
                
                {/* AI Assistant Panel */}
                <div className="glass-panel rounded-xl flex flex-col h-[520px] overflow-hidden">
                  <div className="p-lg border-b border-outline-variant/10 flex items-center justify-between">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full ai-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                        AI
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md">Recent AI Tutor Activity</h4>
                        <p className="text-xs text-green-500 flex items-center gap-xs mt-[2px]">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Firebase synced
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <button
                        type="button"
                        onClick={() => switchToTab('ai-tutor')}
                        title="Open AI Tutor"
                        className="p-sm hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => switchToTab('analytics')}
                        title="Open analytics"
                        className="p-sm hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">insights</span>
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-lg space-y-xl custom-scrollbar bg-surface-container-lowest/20">
                    {visibleMessages.length ? visibleMessages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-md max-w-[85%] ${
                          msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          msg.avatar ? (
                            <img className="w-8 h-8 rounded-full object-cover shrink-0" src={msg.avatar} alt="User" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                              {fullName.charAt(0).toUpperCase()}
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8 rounded-full ai-gradient flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                            AI
                          </div>
                        )}
                        
                        <div className={`p-lg rounded-xl shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-surface-container-low text-on-surface rounded-tr-none' 
                            : 'ai-gradient text-white rounded-tl-none shadow-primary/10'
                        } space-y-md`}>
                          <p className="text-body-md leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* Inner detail box for AI response if exists */}
                          {msg.details && (
                            <div className="bg-white/10 p-md rounded-lg border border-white/10">
                              <p className="font-bold mb-xs text-sm">{msg.details.title}</p>
                              <p className="text-sm opacity-90 whitespace-pre-wrap">{msg.details.content}</p>
                            </div>
                          )}

                          {/* Action chips for AI response */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-sm pt-sm">
                              {msg.actions.map((act, i) => (
                                <button 
                                  key={i}
                                  onClick={() => switchToTab('ai-tutor')}
                                  className="px-md py-sm bg-white/20 rounded-full text-xs hover:bg-white/30 active:scale-95 transition-all font-semibold"
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="min-h-[240px] flex flex-col items-center justify-center text-center text-outline gap-sm px-md">
                        <span className="material-symbols-outlined text-3xl">search_off</span>
                        <p className="text-sm">No AI tutor activity matches your search.</p>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="p-lg bg-surface-container-lowest/50 border-t border-outline-variant/10">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="relative"
                    >
                      <input 
                        className="w-full pl-lg pr-xxl py-xl bg-white border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body-md shadow-sm text-body-md" 
                        placeholder="Ask anything about your studies..." 
                        type="text" 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className="absolute right-md top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg ai-gradient text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Today's Tasks & Subject Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Tasks List */}
                  <div className="glass-panel p-lg rounded-xl flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-lg">
                      <h4 className="font-headline-md text-lg font-bold text-primary">Today's Tasks</h4>
                      <span 
                        onClick={() => switchToTab('study-planner')}
                        className="text-primary font-label-md text-label-sm cursor-pointer hover:underline"
                      >
                        See all
                      </span>
                    </div>
                    <div className="space-y-md flex-1 overflow-y-auto custom-scrollbar max-h-[220px] pr-xs">
                      {visibleTasks.length ? visibleTasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`group p-md bg-surface-container-lowest border border-outline-variant/20 rounded-xl transition-all cursor-pointer ${
                            task.borderHover
                          } ${task.completed ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-sm">
                            <span className={`px-sm py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${task.tagColor}`}>
                              {task.tag}
                            </span>
                            <button
                              onClick={() => toggleTaskCompleted(task.id)}
                              disabled={isSavingTask}
                              className="p-0 border-none bg-transparent hover:scale-105 active:scale-90 transition-transform flex items-center justify-center text-outline group-hover:text-primary"
                            >
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: task.completed ? "'FILL' 1" : "'FILL' 0" }}>
                                {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                            </button>
                          </div>
                          <h5 className={`font-label-md text-label-md mb-xs transition-colors ${
                            task.completed ? 'line-through text-outline' : ''
                          }`}>
                            {task.title}
                          </h5>
                          <p className="text-xs text-outline mb-md">{task.due}</p>
                          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div className={`${task.barColor} h-full transition-all duration-350`} style={{ width: `${task.progress}%` }}></div>
                          </div>
                        </div>
                      )) : (
                        <div className="min-h-[180px] flex flex-col items-center justify-center text-center text-outline gap-sm px-md">
                          <span className="material-symbols-outlined text-3xl">task_alt</span>
                          <p className="text-sm">{dashboardSearchTerm ? 'No tasks match your search.' : 'No pending planner tasks.'}</p>
                          <button type="button" className="text-primary font-bold text-sm hover:underline" onClick={() => switchToTab('study-planner')}>Plan study time</button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleAddTask}
                      disabled={isSavingTask}
                      className="w-full py-md mt-lg border-2 border-dashed border-outline-variant/40 rounded-xl text-outline hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-sm font-label-md text-label-md hover:bg-primary/5 active:scale-95"
                    >
                      <span className="material-symbols-outlined">add</span>
                      {isSavingTask ? 'Saving...' : 'Add Task'}
                    </button>
                  </div>

                  {/* Enrolled Subjects & Goals summary */}
                  <div className="glass-panel p-lg rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-headline-md text-lg font-bold text-primary mb-md">Academic Path</h4>
                      <p className="font-label-sm text-outline mb-xs">Major</p>
                      <p className="font-label-md text-on-surface font-black mb-md truncate capitalize">{major}</p>
                      
                      <p className="font-label-sm text-outline mb-xs">Enrolled Subjects</p>
                      <div className="flex flex-wrap gap-xs mb-md max-h-[120px] overflow-y-auto custom-scrollbar">
                        {visibleSubjects.map((sub, idx) => (
                          <span 
                            key={idx}
                            className="px-sm py-1 bg-surface-container text-primary font-bold text-[11px] rounded-lg border border-outline-variant/20 hover:border-primary/45 transition-colors cursor-default"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-md border-t border-outline-variant/10">
                      <p className="font-label-sm text-outline mb-xs">Study Method</p>
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary text-xl">psychology</span>
                        <span className="font-label-md text-on-surface font-semibold capitalize">{studyStyle} Adaptive Style</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (Productivity, Goals, Exam Countdowns) - Stacks at bottom on small screens, sidebar on xl */}
              <div className="col-span-1 xl:col-span-4 space-y-lg">
                
                {/* Circular Goal Progress */}
                <div className="glass-panel p-lg rounded-xl text-center flex flex-col items-center">
                  <h5 className="font-label-md text-label-md mb-lg text-on-surface-variant">Weekly Goal Progress</h5>
                  <div className="relative inline-flex items-center justify-center mb-md">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="12"></circle>
                      <circle 
                        className="text-primary transition-all duration-700" 
                        cx="64" 
                        cy="64" 
                        fill="transparent" 
                        r="54" 
                        stroke="currentColor" 
                        strokeDasharray="339.29" 
                        strokeDashoffset={strokeDashoffset} 
                        strokeWidth="12"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-primary">{percentage}%</span>
                      <span className="text-[10px] text-outline uppercase font-semibold">Done</span>
                    </div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    {studiedHours} / {targetHours} hours studied
                  </p>
                </div>

                {/* Productivity Score */}
                <div className="glass-panel p-lg rounded-xl ai-gradient text-white relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-md relative z-10">
                    <h5 className="font-label-md text-label-md opacity-80">Productivity Score</h5>
                    <span className="material-symbols-outlined text-tertiary-fixed animate-pulse">bolt</span>
                  </div>
                  <h3 className="font-display-lg text-4xl font-extrabold mb-sm relative z-10">{metrics.productivityScore}</h3>
                  <p className="text-xs opacity-75 relative z-10 leading-relaxed">
                    {metrics.productivityHelper}
                  </p>
                  {/* Decorative backgrounds */}
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                {/* Exam Countdowns */}
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <h5 className="font-label-md text-label-md mb-md text-on-surface-variant">Exam Countdown</h5>
                  <div className="space-y-md">
                    {examCountdowns.length ? examCountdowns.map((exam, index) => (
                      <button key={exam.id} type="button" onClick={() => switchToTab('study-planner')} className="w-full p-md bg-surface-container-low rounded-xl flex items-center justify-between group hover:bg-surface-container-high transition-colors text-left">
                        <div className="flex gap-md items-center overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm shrink-0 border border-outline-variant/15">
                            <span className={`text-[9px] font-bold uppercase leading-tight ${index === 0 ? 'text-error' : 'text-primary'}`}>{exam.month}</span>
                            <span className="text-lg font-black leading-none text-on-surface">{exam.day}</span>
                          </div>
                          <div className="overflow-hidden">
                            <h6 className="font-label-md text-label-md truncate">{exam.title}</h6>
                            <p className="text-xs text-outline truncate">{exam.detail}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline group-hover:text-primary shrink-0">chevron_right</span>
                      </button>
                    )) : (
                      <div className="p-md bg-surface-container-low rounded-xl flex items-center gap-md text-outline">
                        <span className="material-symbols-outlined">event_available</span>
                        <p className="text-sm">No upcoming exams scheduled.</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Learning Scoreboard */}
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <h5 className="font-label-md text-label-md mb-md text-on-surface-variant">Learning Scoreboard</h5>
                  <div className="space-y-md">
                    {scoreboardItems.map((item) => (
                      <div key={item.id} className={`flex items-center justify-between ${item.highlight ? 'bg-primary/5 py-sm px-sm rounded-lg border border-primary/10' : ''}`}>
                        <div className="flex items-center gap-md overflow-hidden">
                          <span className={`font-bold text-xs w-4 ${item.highlight ? 'text-primary' : 'text-outline'}`}>{item.rank}</span>
                          {item.photoURL ? (
                            <img className={`w-8 h-8 rounded-full object-cover shrink-0 ${item.highlight ? 'border border-primary/20' : ''}`} src={item.photoURL} alt={item.name} />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.highlight ? 'bg-primary text-white' : 'bg-surface-container-high text-primary'}`}>
                              {item.highlight ? fullName.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-[18px]">{item.icon}</span>}
                            </div>
                          )}
                          <span className={`font-label-sm text-label-sm truncate ${item.highlight ? 'font-bold text-primary' : ''}`}>{item.highlight ? 'You' : item.name}</span>
                        </div>
                        <span className="font-bold text-xs text-primary shrink-0">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Performance Analytics Section */}
            <section className="space-y-lg pt-4">
              <h4 className="font-headline-md text-headline-md text-primary font-bold">Academic Analytics</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Target GPA</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-primary">{averageGpa}</h3>
                  <div className="mt-md flex items-center gap-xs text-green-500 font-bold">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span className="text-xs">{gpaProgress}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Weekly Study Hours</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-secondary">{weeklyStudyHours}</h3>
                  <div className="mt-md flex items-center gap-xs text-outline font-bold">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span className="text-xs">Goal: {targetHours}h / week</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Quiz Accuracy</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-tertiary-container">{quizAccuracy}</h3>
                  <div className="mt-md flex items-center gap-xs text-orange-500 font-bold">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="text-xs">{metrics.quizHelper}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary-fixed-dim/10 rounded-full transition-transform group-hover:scale-125"></div>
                </div>

                <div className="glass-panel p-lg rounded-xl relative overflow-hidden group">
                  <p className="font-label-md text-label-sm text-outline mb-xs">Completed Work</p>
                  <h3 className="font-display-lg text-3xl font-extrabold text-on-surface">{completedWork}</h3>
                  <div className="mt-md flex items-center gap-xs text-outline font-bold">
                    <span className="material-symbols-outlined text-[16px]">assignment</span>
                    <span className="text-xs">{metrics.completedWorkHelper}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface-container-highest rounded-full transition-transform group-hover:scale-125"></div>
                </div>
              </div>
            </section>

            {/* Notes & Materials Section */}
            <section className="space-y-lg pt-4 pb-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-md">
                <h4 className="font-headline-md text-headline-md text-primary font-bold">{dashboardSearchTerm ? 'Matching Study Materials' : 'Recent Study Materials'}</h4>
                <div className="flex gap-sm">
                  <button 
                    onClick={handleUpload}
                    className="flex-1 sm:flex-initial px-md py-sm bg-surface-container-low text-primary rounded-lg text-label-md flex items-center justify-center gap-xs hover:bg-surface-container transition-colors font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload</span> Upload
                  </button>
                  <button 
                    onClick={handleNewNote}
                    className="flex-1 sm:flex-initial px-md py-sm bg-primary text-white rounded-lg text-label-md flex items-center justify-center gap-xs hover:opacity-90 active:scale-95 transition-all font-bold text-sm shadow-sm shadow-primary/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span> New Note
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                {materials.length ? materials.map((mat) => (
                  <div 
                    key={mat.id} 
                    className="glass-panel group p-lg rounded-xl hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-md">
                        <div className={`w-12 h-12 ${mat.iconColor} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="material-symbols-outlined text-[32px]">{mat.icon}</span>
                        </div>
                        <button className="p-xs text-outline opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                      <h5 className="font-label-md text-label-md mb-xs text-on-surface truncate">{mat.name}</h5>
                      <p className="text-xs text-outline mb-lg">{mat.info}</p>
                    </div>
                    <div className="flex gap-sm pt-2">
                      <button 
                        onClick={() => handleMaterialAction(mat, mat.btn1)}
                        className="flex-1 py-sm bg-surface-container-low rounded-lg text-xs font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all"
                      >
                        {mat.btn1}
                      </button>
                      <button 
                        onClick={() => handleMaterialAction(mat, mat.btn2)}
                        className="flex-1 py-sm bg-surface-container-low rounded-lg text-xs font-bold text-primary hover:bg-primary/10 active:scale-95 transition-all"
                      >
                        {mat.btn2}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="glass-panel p-lg rounded-xl md:col-span-3 flex flex-col items-center justify-center text-center min-h-[220px] text-outline gap-sm">
                    <span className="material-symbols-outlined text-4xl">folder_open</span>
                    <h5 className="font-label-md text-label-md text-on-surface">{dashboardSearchTerm ? 'No matching materials' : 'No study materials yet'}</h5>
                    <p className="text-sm max-w-md">{dashboardSearchTerm ? 'Try a different note title, module, topic, or file type.' : 'Create notes or upload PDFs in My Notes to populate this dashboard from Firebase.'}</p>
                    <button type="button" onClick={() => switchToTab('my-notes')} className="mt-sm px-md py-sm bg-primary text-white rounded-lg text-sm font-bold">Open My Notes</button>
                  </div>
                )}
              </div>
            </section>
          </main>
        ) : activeTab === 'my-notes' ? (
          <Suspense fallback={<LoadingEffect icon="folder_open" title="Loading notes" message="Opening your notes workspace." />}>
            <NotePage profile={effectiveProfile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'ai-tutor' ? (
          <Suspense fallback={<LoadingEffect icon="psychology" title="Loading AI Tutor" message="Preparing your study companion." />}>
            <AITutorPage
              profile={effectiveProfile}
              currentUser={currentUser}
              onOpenQuiz={(quizId) => {
                setQuizToOpenId(quizId);
                switchToTab('quiz-generator');
              }}
            />
          </Suspense>
        ) : activeTab === 'study-planner' ? (
          <Suspense fallback={<LoadingEffect icon="calendar_today" title="Loading planner" message="Opening your academic calendar." />}>
            <StudyPlannerPage profile={effectiveProfile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'flashcards' ? (
          <Suspense fallback={<LoadingEffect icon="style" title="Loading flash cards" message="Preparing your study review workspace." />}>
            <FlashCardsPage profile={effectiveProfile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'quiz-generator' ? (
          <Suspense fallback={<LoadingEffect icon="quiz" title="Loading quiz generator" message="Preparing quizzes and saved progress." />}>
            <QuizGeneratorPage
              profile={effectiveProfile}
              currentUser={currentUser}
              initialQuizId={quizToOpenId}
              onInitialQuizOpened={() => setQuizToOpenId(null)}
            />
          </Suspense>
        ) : activeTab === 'analytics' ? (
          <Suspense fallback={<LoadingEffect icon="leaderboard" title="Loading analytics" message="Preparing your learning progress report." />}>
            <AnalyticsPage profile={effectiveProfile} currentUser={currentUser} />
          </Suspense>
        ) : activeTab === 'profile' ? (
          <Suspense fallback={<LoadingEffect icon="account_circle" title="Loading profile" message="Opening your profile and settings." />}>
            <ProfileSettingsPage profile={effectiveProfile} currentUser={currentUser} onProfileUpdated={setProfile} />
          </Suspense>
        ) : (
          /* Under Construction Panel for other Tabs */
          <main className="dashboard-home-window flex-1 flex items-center justify-center p-gutter md:p-margin-desktop min-h-[400px]">
            <div className="bg-white border border-outline-variant/30 p-lg md:p-xxl rounded-2xl shadow-sm text-center py-lg md:py-xxl max-w-lg mx-auto animate-fade-in-up">
              <span className="material-symbols-outlined text-6xl text-primary-fixed-dim mb-md animate-bounce">construction</span>
              <h3 className="font-headline-md text-on-surface font-bold mb-sm">Feature Under Construction</h3>
              <p className="font-body-md text-on-surface-variant mb-lg leading-relaxed">
                The onboarding is completed, and this view is prepared. The core study tools for the <span className="font-bold text-primary">
                  {sidebarItems.find(item => item.id === activeTab)?.label || activeTab}
                </span> tab are coming soon.
              </p>
              <button
                onClick={() => switchToTab('home')}
                className="px-lg py-md bg-primary text-white rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"
              >
                Back to Home
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;




