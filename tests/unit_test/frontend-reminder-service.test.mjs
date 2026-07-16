import assert from "node:assert/strict";
import { test } from "node:test";

import {
  END_TIME_REMINDER_ID,
  actionLabelForEventType,
  describeReminders,
  eventEndDate,
  eventStartDate,
  isEndTimeReminder,
  normalizeEventReminders,
  normalizeReminderInput,
  notificationTypeForEventType,
  reminderLabel,
  reminderOffsetToMinutes,
} from "../../Frontend/Academent/src/Services/reminderService.js";

const baseEvent = {
  type: "studyPlan",
  date: "2026-07-16",
  startTime: "10:30",
  endTime: "12:00",
};

test("eventStartDate and eventEndDate convert planner fields into local Date objects", () => {
  assert.equal(eventStartDate(baseEvent).getTime(), new Date(2026, 6, 16, 10, 30).getTime());
  assert.equal(eventEndDate(baseEvent).getTime(), new Date(2026, 6, 16, 12, 0).getTime());
  assert.equal(eventStartDate({ date: "", startTime: "10:00" }), null);
});

test("reminder labels, ids, and offsets normalize common reminder options", () => {
  assert.equal(reminderOffsetToMinutes({ value: 2, unit: "hours" }), 120);
  assert.equal(reminderLabel({ value: 1, unit: "hours" }), "1 hour before");
  assert.equal(reminderLabel({ value: 0, unit: "minutes" }), "At the scheduled time");
  assert.equal(isEndTimeReminder({ id: END_TIME_REMINDER_ID }), true);
});

test("normalizeReminderInput calculates reminder timestamps and preserves sent state only for unchanged times", () => {
  const normalized = normalizeReminderInput(
    {
      value: 30,
      unit: "minutes",
      notificationSent: true,
      remindAt: new Date(2026, 6, 16, 10, 0),
      sentAt: "already-sent",
    },
    baseEvent,
  );

  assert.equal(normalized.id, "30_minutes");
  assert.equal(normalized.remindAt.getTime(), new Date(2026, 6, 16, 10, 0).getTime());
  assert.equal(normalized.notificationSent, true);
  assert.equal(normalized.sentAt, "already-sent");
});

test("normalizeEventReminders adds a study plan end reminder and sorts reminders by time", () => {
  const result = normalizeEventReminders({
    ...baseEvent,
    reminders: [{ value: 15, unit: "minutes" }],
  }, { timezone: "Asia/Colombo" });

  assert.equal(result.timezone, "Asia/Colombo");
  assert.deepEqual(
    result.reminders.map((reminder) => reminder.id),
    ["15_minutes", END_TIME_REMINDER_ID],
  );
  assert.equal(result.reminders[0].remindAt.getTime(), new Date(2026, 6, 16, 10, 15).getTime());
  assert.equal(result.reminders[1].remindAt.getTime(), new Date(2026, 6, 16, 12, 0).getTime());
});

test("normalizeEventReminders ignores end reminders for non-study-plan events", () => {
  const result = normalizeEventReminders({
    ...baseEvent,
    type: "exam",
    reminders: [
      { id: END_TIME_REMINDER_ID, trigger: "end" },
      { value: 1, unit: "hours" },
    ],
  });

  assert.deepEqual(result.reminders.map((reminder) => reminder.id), ["1_hour"]);
});

test("reminder description and event notification labels match event types", () => {
  assert.equal(
    describeReminders([{ value: 1, unit: "hours" }, { id: END_TIME_REMINDER_ID }]),
    "1 hour before, At the end time",
  );
  assert.equal(notificationTypeForEventType("assignment"), "assignment_reminder");
  assert.equal(notificationTypeForEventType("unknown"), "study_plan_reminder");
  assert.equal(actionLabelForEventType("task"), "View Task");
  assert.equal(actionLabelForEventType("studyPlan"), "Start Studying");
});

