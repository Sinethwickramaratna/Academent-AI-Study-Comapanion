import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { createReminderNotification, notificationRef } from "./notificationService";
import {
  actionLabelForEventType,
  eventEndDate,
  eventStartDate,
  isEndTimeReminder,
  normalizeEventReminders,
  notificationTypeForEventType,
} from "./reminderService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const REMINDER_POLL_GRACE_MS = 24 * 60 * 60 * 1000;

const ensureUid = (uid) => {
  if (!uid) throw new Error("You must be signed in to use Study Planner.");
};

const eventsCollection = (uid) => collection(db, "users", uid, "studyPlannerEvents");
const eventRef = (uid, eventId) => doc(db, "users", uid, "studyPlannerEvents", eventId);

const normalizeReminder = (reminder = {}) => ({
  enabled: Boolean(reminder.enabled),
  beforeMinutes: Number(reminder.beforeMinutes || 0),
});

const sanitizeIdPart = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "") || "item";

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const reminderNotificationId = (uid, eventId, reminderId) => (
  `${sanitizeIdPart(uid)}_${sanitizeIdPart(eventId)}_${sanitizeIdPart(reminderId)}`
);

const actionUrlForEvent = (eventType, eventId) => {
  if (eventType === "exam") return `/exams/${eventId}`;
  if (eventType === "assignment") return `/assignments/${eventId}`;
  if (eventType === "task") return `/tasks/${eventId}`;
  return `/study-plans/${eventId}`;
};

const titleForEventType = (eventType, reminder = {}) => {
  if (eventType === "exam") return "Upcoming Exam";
  if (eventType === "assignment") return "Assignment Due Soon";
  if (eventType === "task") return "Task Reminder";
  if (isEndTimeReminder(reminder)) return "Study Session Complete";
  return "Study Session Starting Soon";
};

const reminderMessage = (event = {}, reminder = {}) => {
  const eventType = event.type || event.eventType || "studyPlan";
  const title = event.title || event.studyTopic || "Scheduled event";
  const startAt = toDate(event.startAt) || eventStartDate(event);
  const remindAt = toDate(reminder.remindAt);
  const minutes = startAt && remindAt
    ? Math.round((startAt.getTime() - remindAt.getTime()) / 60000)
    : Number(reminder.value || event.reminder?.beforeMinutes || 0);
  const minutesText = minutes >= 60
    ? `in ${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}`
    : `in ${Math.max(minutes, 0)} minutes`;

  if (eventType === "studyPlan" && isEndTimeReminder(reminder)) {
    return `Your "${title}" session has reached its end time.`;
  }

  if (eventType === "exam") return `Your "${title}" starts ${minutes >= 1440 ? "soon" : minutesText}.`;
  if (eventType === "assignment") return `"${title}" is due ${minutesText}.`;
  if (eventType === "task") return `"${title}" is scheduled ${minutesText}.`;
  return `Your "${title}" session starts ${minutesText}.`;
};

const authenticatedNotificationRequest = async (path, options = {}) => {
  const user = auth.currentUser;
  if (!user) return { skipped: true, reason: "No signed-in Firebase user." };

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Reminder scheduling request failed.");
  }

  return result;
};

const scheduleEventRemindersRemotely = async (event) => {
  try {
    return await authenticatedNotificationRequest(`/api/notifications/events/${event.eventId}/reminders/reschedule`, {
      method: "POST",
      body: JSON.stringify({ event }),
    });
  } catch (error) {
    console.warn("Remote reminder scheduling failed; app-open reminders will still be checked:", error);
    return { success: false, error };
  }
};

const cancelEventRemindersRemotely = async (eventId) => {
  try {
    return await authenticatedNotificationRequest(`/api/notifications/events/${eventId}/reminders`, {
      method: "DELETE",
    });
  } catch (error) {
    console.warn("Remote reminder cancellation failed:", error);
    return { success: false, error };
  }
};

export const subscribeStudyPlannerEvents = (uid, onNext, onError) => {
  ensureUid(uid);
  const eventsQuery = query(eventsCollection(uid), orderBy("date", "asc"));

  return onSnapshot(
    eventsQuery,
    (snapshot) => onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError,
  );
};

export const saveStudyPlannerEvent = async (uid, eventData, eventId = null) => {
  ensureUid(uid);
  const eventDoc = eventId ? eventRef(uid, eventId) : doc(eventsCollection(uid));
  const finalEventId = eventId || eventDoc.id;
  const isUpdate = Boolean(eventId);
  const { timezone, reminders } = normalizeEventReminders(eventData, { timezone: eventData.timezone });
  const startAt = eventStartDate(eventData);
  const endAt = eventEndDate(eventData);
  const firstReminder = reminders[0] || null;

  const payload = {
    eventId: finalEventId,
    userId: uid,
    title: String(eventData.title || "").trim(),
    type: eventData.type,
    eventType: eventData.type,
    semesterId: eventData.semesterId || "",
    moduleId: eventData.moduleId || "",
    folderId: eventData.folderId || "",
    folderPath: Array.isArray(eventData.folderPath) ? eventData.folderPath : [],
    selectedNoteIds: Array.isArray(eventData.selectedNoteIds) ? eventData.selectedNoteIds : [],
    selectedPdfIds: Array.isArray(eventData.selectedPdfIds) ? eventData.selectedPdfIds : [],
    date: eventData.date,
    endDate: eventData.endDate || eventData.date,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    startAt,
    endAt,
    dueAt: eventData.type === "assignment" ? startAt : null,
    priority: eventData.priority || "medium",
    repeat: eventData.repeat || "none",
    reminder: firstReminder
      ? { enabled: true, beforeMinutes: firstReminder.unit === "minutes" ? Number(firstReminder.value || 0) : 0 }
      : normalizeReminder(eventData.reminder),
    reminders,
    timezone,
    description: eventData.description || "",
    status: eventData.status || "pending",
    studyTopic: eventData.studyTopic || "",
    studyGoals: eventData.studyGoals || "",
    durationMinutes: Number(eventData.durationMinutes || 0),
    updatedAt: serverTimestamp(),
  };

  if (!isUpdate) payload.createdAt = serverTimestamp();

  await setDoc(eventDoc, payload, { merge: isUpdate });
  const reminderSchedule = await scheduleEventRemindersRemotely(payload);
  return { ...payload, reminderSchedule };
};

export const deleteStudyPlannerEvent = async (uid, eventId) => {
  ensureUid(uid);
  if (!eventId) throw new Error("An event id is required to delete a Study Planner event.");
  await deleteDoc(eventRef(uid, eventId));
  await cancelEventRemindersRemotely(eventId);
};

export const markStudyPlannerEventCompleted = async (uid, eventId) => {
  ensureUid(uid);
  if (!eventId) throw new Error("An event id is required to complete a Study Planner event.");

  await updateDoc(eventRef(uid, eventId), {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
  await cancelEventRemindersRemotely(eventId);
};

const shouldNotifyReminder = (event, reminder, now) => {
  if (!reminder || reminder.notificationSent || reminder.disabled) return false;
  if (event.status === "completed" || event.status === "cancelled") return false;

  const remindAt = toDate(reminder.remindAt);
  if (!remindAt || remindAt.getTime() > now.getTime()) return false;

  const endAt = toDate(event.endAt) || eventEndDate(event);
  if (endAt && now.getTime() - endAt.getTime() > REMINDER_POLL_GRACE_MS) return false;

  return true;
};

export const processDueStudyPlannerReminders = async (uid, events = [], now = new Date()) => {
  ensureUid(uid);
  const createdNotifications = [];

  for (const event of events) {
    const eventId = event.eventId || event.id;
    const reminders = Array.isArray(event.reminders) ? event.reminders : [];
    if (!eventId || !reminders.length) continue;

    let changed = false;
    const nextReminders = [];

    for (const reminder of reminders) {
      if (!shouldNotifyReminder(event, reminder, now)) {
        nextReminders.push(reminder);
        continue;
      }

      const eventType = event.type || event.eventType || "studyPlan";
      const notificationId = reminderNotificationId(uid, eventId, reminder.id);
      const existingNotification = await getDoc(notificationRef(uid, notificationId));
      const notification = existingNotification.exists()
        ? null
        : await createReminderNotification(uid, {
          id: notificationId,
          type: notificationTypeForEventType(eventType),
          title: titleForEventType(eventType, reminder),
          message: reminderMessage(event, reminder),
          entityType: eventType,
          entityId: eventId,
          entityTitle: event.title || event.studyTopic || "Scheduled event",
          actionLabel: actionLabelForEventType(eventType),
          actionUrl: actionUrlForEvent(eventType, eventId),
          metadata: {
            reminderId: reminder.id,
            reminderTrigger: isEndTimeReminder(reminder) ? "end" : "start",
            source: "client-reminder-processor",
            timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          },
        });

      if (notification) createdNotifications.push(notification);
      nextReminders.push({ ...reminder, notificationSent: true, sentAt: now });
      changed = true;
    }

    if (changed) {
      await updateDoc(eventRef(uid, eventId), {
        reminders: nextReminders,
        updatedAt: serverTimestamp(),
      });
    }
  }

  return createdNotifications;
};
