export const REMINDER_OPTIONS = [
  { id: "at_time", label: "At the scheduled time", value: 0, unit: "minutes", icon: "notifications" },
  { id: "10_minutes", label: "10 minutes before", value: 10, unit: "minutes", icon: "notifications" },
  { id: "15_minutes", label: "15 minutes before", value: 15, unit: "minutes", icon: "notifications_active" },
  { id: "30_minutes", label: "30 minutes before", value: 30, unit: "minutes", icon: "notifications_active" },
  { id: "1_hour", label: "1 hour before", value: 1, unit: "hours", icon: "schedule" },
  { id: "2_hours", label: "2 hours before", value: 2, unit: "hours", icon: "schedule" },
  { id: "1_day", label: "1 day before", value: 1, unit: "days", icon: "event_upcoming" },
  { id: "2_days", label: "2 days before", value: 2, unit: "days", icon: "event_upcoming" },
  { id: "1_week", label: "1 week before", value: 1, unit: "weeks", icon: "date_range" },
  { id: "end_time", label: "At the end time", value: 0, unit: "minutes", icon: "event_available", trigger: "end", isSystem: true },
];

const UNIT_MINUTES = {
  minutes: 1,
  hours: 60,
  days: 1440,
  weeks: 10080,
};

export const END_TIME_REMINDER_ID = "end_time";

export const isEndTimeReminder = (reminder = {}) => (
  reminder.id === END_TIME_REMINDER_ID || reminder.trigger === "end"
);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getUserTimezone = (fallback = "UTC") => (
  Intl.DateTimeFormat().resolvedOptions().timeZone || fallback
);

export const eventStartDate = (eventData = {}) => {
  const [year, month, day] = String(eventData.date || "").split("-").map(Number);
  const [hours = 0, minutes = 0] = String(eventData.startTime || "00:00").split(":").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const eventEndDate = (eventData = {}) => {
  const [year, month, day] = String(eventData.endDate || eventData.date || "").split("-").map(Number);
  const [hours = 0, minutes = 0] = String(eventData.endTime || eventData.startTime || "00:00").split(":").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const reminderOffsetToMinutes = (reminder = {}) => (
  Math.max(0, Number(reminder.value || 0) * (UNIT_MINUTES[reminder.unit] || 1))
);

export const reminderLabel = (reminder = {}) => {
  if (isEndTimeReminder(reminder)) return "At the end time";
  if (reminder.isCustom || reminder.unit === "custom") {
    const date = toDate(reminder.remindAt);
    return date ? `Custom: ${date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}` : "Custom reminder";
  }
  if (!Number(reminder.value)) return "At the scheduled time";
  const unit = Number(reminder.value) === 1 ? String(reminder.unit || "minutes").replace(/s$/, "") : reminder.unit || "minutes";
  return `${reminder.value} ${unit} before`;
};

export const makeReminderId = (reminder = {}) => {
  if (isEndTimeReminder(reminder)) return END_TIME_REMINDER_ID;
  if (reminder.id) return reminder.id;
  if (reminder.isCustom || reminder.unit === "custom") return `custom-${toDate(reminder.remindAt)?.getTime() || Date.now()}`;
  const value = Number(reminder.value || 0);
  const unit = String(reminder.unit || "minutes");
  if (value === 0 && unit === "minutes") return "at_time";
  const normalizedUnit = value === 1 ? unit.replace(/s$/, "") : unit;
  return `${value}_${normalizedUnit}`;
};

export const normalizeReminderInput = (reminder = {}, eventData = {}) => {
  const isEndReminder = isEndTimeReminder(reminder);
  const startAt = eventStartDate(eventData);
  const endAt = eventEndDate(eventData);

  if (isEndReminder && !endAt) {
    throw new Error("Choose a valid event date and end time before adding an end reminder.");
  }

  if (!isEndReminder && !startAt) {
    throw new Error("Choose a valid event date and start time before adding reminders.");
  }

  let remindAt;
  if (isEndReminder) {
    remindAt = endAt;
  } else if (reminder.isCustom || reminder.unit === "custom") {
    remindAt = toDate(reminder.remindAt || reminder.customDateTime);
  } else {
    const minutesBefore = reminderOffsetToMinutes(reminder);
    remindAt = new Date(startAt.getTime() - minutesBefore * 60 * 1000);
  }

  if (!(remindAt instanceof Date) || Number.isNaN(remindAt.getTime())) {
    throw new Error("Choose a valid reminder date and time.");
  }

  const previousRemindAt = toDate(reminder.remindAt);
  const notificationSent = Boolean(reminder.notificationSent)
    && previousRemindAt
    && Math.abs(previousRemindAt.getTime() - remindAt.getTime()) < 1000;

  const normalized = {
    id: isEndReminder ? END_TIME_REMINDER_ID : makeReminderId({ ...reminder, remindAt }),
    value: isEndReminder ? 0 : Number(reminder.value || 0),
    unit: isEndReminder ? "minutes" : reminder.isCustom ? "custom" : reminder.unit || "minutes",
    remindAt,
    notificationSent,
    sentAt: notificationSent ? reminder.sentAt || null : null,
    isCustom: Boolean(reminder.isCustom || reminder.unit === "custom"),
    label: reminderLabel({ ...reminder, remindAt }),
  };

  if (isEndReminder) {
    normalized.trigger = "end";
    normalized.isSystem = true;
    normalized.label = reminderLabel(normalized);
  }

  return normalized;
};

export const normalizeEventReminders = (eventData = {}, preferences = {}) => {
  const timezone = preferences.timezone || getUserTimezone();
  const eventType = eventData.type || eventData.eventType;
  const isStudyPlan = eventType === "studyPlan";
  const sourceReminders = Array.isArray(eventData.reminders)
    ? eventData.reminders
    : eventData.reminder?.enabled || eventData.reminderMinutes
      ? [{ value: Number(eventData.reminder?.beforeMinutes ?? eventData.reminderMinutes ?? preferences.defaultReminder?.value ?? 30), unit: "minutes" }]
      : [];
  const shouldAddEndReminder = isStudyPlan
    && !sourceReminders.some((reminder) => isEndTimeReminder(reminder));
  const remindersToNormalize = shouldAddEndReminder
    ? [...sourceReminders, { id: END_TIME_REMINDER_ID, trigger: "end", value: 0, unit: "minutes", isSystem: true }]
    : sourceReminders;

  const unique = new Map();
  remindersToNormalize.forEach((reminder) => {
    if (reminder.disabled) return;
    if (isEndTimeReminder(reminder) && !isStudyPlan) return;
    const normalized = normalizeReminderInput(reminder, eventData);
    unique.set(normalized.id, normalized);
  });

  return {
    timezone,
    reminders: [...unique.values()].sort((left, right) => left.remindAt - right.remindAt),
  };
};

export const describeReminders = (reminders = []) => {
  if (!reminders.length) return "No reminders";
  return reminders.map(reminderLabel).join(", ");
};

export const notificationTypeForEventType = (eventType) => {
  if (eventType === "exam") return "exam_reminder";
  if (eventType === "assignment") return "assignment_reminder";
  if (eventType === "task") return "task_reminder";
  return "study_plan_reminder";
};

export const actionLabelForEventType = (eventType) => {
  if (eventType === "exam") return "View Exam";
  if (eventType === "assignment") return "View Assignment";
  if (eventType === "task") return "View Task";
  return "Start Studying";
};
