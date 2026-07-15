export const NOTIFICATION_CATEGORIES = {
  activity: "activity",
  reminder: "reminder",
  system: "system",
};

export const NOTIFICATION_STATUSES = {
  success: "success",
  failure: "failure",
  reminder: "reminder",
  info: "info",
  warning: "warning",
};

export const NOTIFICATION_TYPE_META = {
  quiz_success: {
    label: "Quiz generated",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.success,
    icon: "quiz",
    tone: "success",
    preferenceKey: "quizNotifications",
  },
  quiz_failure: {
    label: "Quiz generation failed",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.failure,
    icon: "error",
    tone: "danger",
    preferenceKey: "quizNotifications",
    alwaysEnabled: true,
  },
  flashcard_success: {
    label: "Flashcards generated",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.success,
    icon: "style",
    tone: "success",
    preferenceKey: "flashcardNotifications",
  },
  flashcard_failure: {
    label: "Flashcard generation failed",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.failure,
    icon: "error",
    tone: "danger",
    preferenceKey: "flashcardNotifications",
    alwaysEnabled: true,
  },
  pdf_upload_success: {
    label: "PDF uploaded",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.success,
    icon: "picture_as_pdf",
    tone: "success",
    preferenceKey: "pdfUploadNotifications",
  },
  pdf_upload_failure: {
    label: "PDF upload failed",
    category: NOTIFICATION_CATEGORIES.activity,
    status: NOTIFICATION_STATUSES.failure,
    icon: "file_present",
    tone: "danger",
    preferenceKey: "pdfUploadNotifications",
    alwaysEnabled: true,
  },
  exam_reminder: {
    label: "Exam reminder",
    category: NOTIFICATION_CATEGORIES.reminder,
    status: NOTIFICATION_STATUSES.reminder,
    icon: "school",
    tone: "purple",
    preferenceKey: "examReminders",
  },
  assignment_reminder: {
    label: "Assignment reminder",
    category: NOTIFICATION_CATEGORIES.reminder,
    status: NOTIFICATION_STATUSES.reminder,
    icon: "assignment",
    tone: "amber",
    preferenceKey: "assignmentReminders",
  },
  task_reminder: {
    label: "Task reminder",
    category: NOTIFICATION_CATEGORIES.reminder,
    status: NOTIFICATION_STATUSES.reminder,
    icon: "task_alt",
    tone: "blue",
    preferenceKey: "taskReminders",
  },
  study_plan_reminder: {
    label: "Study plan reminder",
    category: NOTIFICATION_CATEGORIES.reminder,
    status: NOTIFICATION_STATUSES.reminder,
    icon: "event_available",
    tone: "violet",
    preferenceKey: "studyPlanReminders",
  },
  general_info: {
    label: "Information",
    category: NOTIFICATION_CATEGORIES.system,
    status: NOTIFICATION_STATUSES.info,
    icon: "info",
    tone: "blue",
    preferenceKey: "systemNotifications",
  },
  warning: {
    label: "Warning",
    category: NOTIFICATION_CATEGORIES.system,
    status: NOTIFICATION_STATUSES.warning,
    icon: "warning",
    tone: "amber",
    preferenceKey: "systemNotifications",
  },
};

export const VALID_NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_META);

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  inAppEnabled: true,
  browserPushEnabled: false,
  quizNotifications: true,
  flashcardNotifications: true,
  pdfUploadNotifications: true,
  examReminders: true,
  assignmentReminders: true,
  taskReminders: true,
  studyPlanReminders: true,
  systemNotifications: true,
  multipleRemindersAllowed: true,
  defaultReminder: {
    value: 30,
    unit: "minutes",
  },
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "07:00",
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

export const getNotificationMeta = (type) => (
  NOTIFICATION_TYPE_META[type] || NOTIFICATION_TYPE_META.general_info
);

export const getPreferenceKeyForNotificationType = (type) => getNotificationMeta(type).preferenceKey;

export const isFailureNotificationType = (type) => getNotificationMeta(type).status === NOTIFICATION_STATUSES.failure;

