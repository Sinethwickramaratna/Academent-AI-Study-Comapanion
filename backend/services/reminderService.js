import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import { createNotification, sendBrowserPushNotification } from "./notificationService.js";

const notificationTypeForEventType = (eventType) => {
  if (eventType === "exam") return "exam_reminder";
  if (eventType === "assignment") return "assignment_reminder";
  if (eventType === "task") return "task_reminder";
  return "study_plan_reminder";
};

const actionLabelForEventType = (eventType) => {
  if (eventType === "exam") return "View Exam";
  if (eventType === "assignment") return "View Assignment";
  if (eventType === "task") return "View Task";
  return "Start Studying";
};

const actionUrlForEvent = (eventType, eventId) => {
  if (eventType === "exam") return `/exams/${eventId}`;
  if (eventType === "assignment") return `/assignments/${eventId}`;
  if (eventType === "task") return `/tasks/${eventId}`;
  return `/study-plans/${eventId}`;
};

const END_TIME_REMINDER_ID = "end_time";

const isEndTimeReminder = (reminder = {}) => (
  reminder.id === END_TIME_REMINDER_ID || reminder.trigger === "end"
);

const titleForEventType = (eventType, reminder = {}) => {
  if (eventType === "exam") return "Upcoming Exam";
  if (eventType === "assignment") return "Assignment Due Soon";
  if (eventType === "task") return "Task Reminder";
  if (isEndTimeReminder(reminder)) return "Study Session Complete";
  return "Study Session Starting Soon";
};

const sanitizeIdPart = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "") || "item";

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const reminderMessage = (event = {}, reminder = {}) => {
  const title = event.title || event.studyTopic || "Scheduled event";
  const startAt = toDate(event.startAt);
  const remindAt = toDate(reminder.remindAt);
  const minutes = startAt && remindAt ? Math.round((startAt.getTime() - remindAt.getTime()) / 60000) : Number(reminder.value || 0);

  if (event.type === "studyPlan" && isEndTimeReminder(reminder)) {
    return `Your "${title}" session has reached its end time.`;
  }

  if (event.type === "exam") return `Your "${title}" starts ${minutes >= 1440 ? "soon" : `in ${Math.max(minutes, 0)} minutes`}.`;
  if (event.type === "assignment") return `"${title}" is due ${minutes >= 60 ? `in ${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}` : `in ${Math.max(minutes, 0)} minutes`}.`;
  if (event.type === "task") return `"${title}" is scheduled ${minutes >= 60 ? `in ${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}` : `in ${Math.max(minutes, 0)} minutes`}.`;
  return `Your "${title}" session starts ${minutes >= 60 ? `in ${Math.round(minutes / 60)} hour${Math.round(minutes / 60) === 1 ? "" : "s"}` : `in ${Math.max(minutes, 0)} minutes`}.`;
};

export async function cancelEventReminders(userId, eventId) {
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const snapshot = await db.collection("scheduledNotifications")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .where("status", "==", "pending")
    .get();

  const batch = db.batch();
  let scheduledCount = 0;
  snapshot.docs.forEach((job) => batch.update(job.ref, {
    status: "cancelled",
    cancelledAt: FieldValue.serverTimestamp(),
  }));
  await batch.commit();
  return snapshot.size;
}

export async function scheduleEventReminders(userId, event = {}) {
  if (!userId || !event.eventId) throw new Error("A user id and event id are required to schedule reminders.");
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const reminders = Array.isArray(event.reminders) ? event.reminders : [];
  const eventType = event.type || event.eventType || "studyPlan";

  await cancelEventReminders(userId, event.eventId);

  const batch = db.batch();
  let scheduledCount = 0;
  reminders.forEach((reminder) => {
    const scheduledFor = toDate(reminder.remindAt);
    if (!scheduledFor || scheduledFor.getTime() < Date.now()) return;

    scheduledCount += 1;
    const scheduledNotificationId = `${sanitizeIdPart(userId)}_${sanitizeIdPart(event.eventId)}_${sanitizeIdPart(reminder.id)}`;
    const ref = db.collection("scheduledNotifications").doc(scheduledNotificationId);
    batch.set(ref, {
      userId,
      eventId: event.eventId,
      eventType,
      reminderId: reminder.id,
      reminderTrigger: isEndTimeReminder(reminder) ? "end" : "start",
      notificationType: notificationTypeForEventType(eventType),
      title: titleForEventType(eventType, reminder),
      message: reminderMessage({ ...event, type: eventType }, reminder),
      entityTitle: event.title || event.studyTopic || "Scheduled event",
      actionLabel: actionLabelForEventType(eventType),
      actionUrl: actionUrlForEvent(eventType, event.eventId),
      scheduledFor,
      timezone: event.timezone || "UTC",
      status: "pending",
      attemptCount: 0,
      lastAttemptAt: null,
      sentAt: null,
      failureReason: null,
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
  return scheduledCount;
}

export async function rescheduleEventReminders(userId, event = {}) {
  return scheduleEventReminders(userId, event);
}

async function claimReminderJob(db, admin, jobRef) {
  const FieldValue = admin.firestore.FieldValue;
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    if (!snapshot.exists || snapshot.data().status !== "pending") return null;
    transaction.update(jobRef, {
      status: "processing",
      lastAttemptAt: FieldValue.serverTimestamp(),
      attemptCount: FieldValue.increment(1),
    });
    return { id: snapshot.id, ...snapshot.data() };
  });
}

export async function processDueReminders({ limit = 50 } = {}) {
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db.collection("scheduledNotifications")
    .where("status", "==", "pending")
    .where("scheduledFor", "<=", now)
    .orderBy("scheduledFor", "asc")
    .limit(limit)
    .get();

  const results = [];

  for (const jobSnapshot of snapshot.docs) {
    const claimedJob = await claimReminderJob(db, admin, jobSnapshot.ref);
    if (!claimedJob) continue;

    try {
      const existingNotification = await db.doc(`users/${claimedJob.userId}/notifications/${claimedJob.id}`).get();
      if (existingNotification.exists) {
        await jobSnapshot.ref.update({
          status: "sent",
          sentAt: FieldValue.serverTimestamp(),
          failureReason: null,
        });
        results.push({ id: claimedJob.id, status: "already_sent" });
        continue;
      }

      const notification = await createNotification({
        id: claimedJob.id,
        userId: claimedJob.userId,
        type: claimedJob.notificationType,
        title: claimedJob.title,
        message: claimedJob.message,
        entityType: claimedJob.eventType,
        entityId: claimedJob.eventId,
        entityTitle: claimedJob.entityTitle,
        actionLabel: claimedJob.actionLabel,
        actionUrl: claimedJob.actionUrl,
        metadata: {
          scheduledNotificationId: claimedJob.id,
          reminderId: claimedJob.reminderId,
          reminderTrigger: claimedJob.reminderTrigger || "start",
          timezone: claimedJob.timezone,
        },
      }, { idempotencyKey: claimedJob.id });

      if (notification) await sendBrowserPushNotification(claimedJob.userId, notification);
      await jobSnapshot.ref.update({
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        failureReason: null,
      });
      results.push({ id: claimedJob.id, status: "sent" });
    } catch (error) {
      console.error("Scheduled reminder failed:", error);
      const attempts = Number(claimedJob.attemptCount || 0) + 1;
      await jobSnapshot.ref.update({
        status: attempts >= 3 ? "failed" : "pending",
        failureReason: error.message || "Reminder processing failed",
        lastAttemptAt: FieldValue.serverTimestamp(),
      });
      results.push({ id: claimedJob.id, status: attempts >= 3 ? "failed" : "retrying" });
    }
  }

  return results;
}
