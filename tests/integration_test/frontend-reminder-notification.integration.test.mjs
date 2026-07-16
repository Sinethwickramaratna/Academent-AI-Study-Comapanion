import assert from "node:assert/strict";
import { test } from "node:test";

import {
  END_TIME_REMINDER_ID,
  actionLabelForEventType,
  normalizeEventReminders,
  notificationTypeForEventType,
} from "../../Frontend/Academent/src/Services/reminderService.js";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUSES,
  getNotificationMeta,
} from "../../Frontend/Academent/src/Services/notificationTypes.js";

const buildNotificationPreview = (event, reminder) => {
  const eventType = event.type || event.eventType || "studyPlan";
  const type = notificationTypeForEventType(eventType);
  const meta = getNotificationMeta(type);

  return {
    type,
    category: meta.category,
    status: meta.status,
    entityType: eventType,
    entityId: event.eventId,
    entityTitle: event.title || event.studyTopic,
    actionLabel: actionLabelForEventType(eventType),
    reminderId: reminder.id,
  };
};

test("study planner reminders integrate with notification metadata for study sessions", () => {
  const event = {
    eventId: "study-1",
    type: "studyPlan",
    studyTopic: "Linear algebra revision",
    date: "2026-07-16",
    startTime: "19:00",
    endTime: "20:30",
    reminders: [{ value: 30, unit: "minutes" }],
  };

  const { reminders } = normalizeEventReminders(event, { timezone: "Asia/Colombo" });
  const previews = reminders.map((reminder) => buildNotificationPreview(event, reminder));

  assert.deepEqual(reminders.map((reminder) => reminder.id), ["30_minutes", END_TIME_REMINDER_ID]);
  assert.deepEqual(previews.map((preview) => preview.type), ["study_plan_reminder", "study_plan_reminder"]);
  assert.equal(previews[0].category, NOTIFICATION_CATEGORIES.reminder);
  assert.equal(previews[0].status, NOTIFICATION_STATUSES.reminder);
  assert.equal(previews[0].actionLabel, "Start Studying");
});

test("exam reminders map to exam notification type and action labels", () => {
  const event = {
    eventId: "exam-1",
    type: "exam",
    title: "Calculus Midterm",
    date: "2026-07-20",
    startTime: "09:00",
    endTime: "11:00",
    reminders: [{ value: 1, unit: "days" }],
  };

  const { reminders } = normalizeEventReminders(event);
  const preview = buildNotificationPreview(event, reminders[0]);

  assert.deepEqual(reminders.map((reminder) => reminder.id), ["1_day"]);
  assert.equal(preview.type, "exam_reminder");
  assert.equal(preview.actionLabel, "View Exam");
  assert.equal(preview.entityTitle, "Calculus Midterm");
  assert.equal(preview.category, NOTIFICATION_CATEGORIES.reminder);
});

