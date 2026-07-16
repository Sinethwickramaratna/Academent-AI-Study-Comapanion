import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPE_META,
  VALID_NOTIFICATION_TYPES,
  getNotificationMeta,
  getPreferenceKeyForNotificationType,
  isFailureNotificationType,
} from "../../Frontend/Academent/src/Services/notificationTypes.js";

test("notification type metadata exposes expected category, status, and preference keys", () => {
  assert.equal(NOTIFICATION_TYPE_META.quiz_success.category, NOTIFICATION_CATEGORIES.activity);
  assert.equal(NOTIFICATION_TYPE_META.quiz_success.status, NOTIFICATION_STATUSES.success);
  assert.equal(getPreferenceKeyForNotificationType("pdf_upload_success"), "pdfUploadNotifications");
});

test("getNotificationMeta falls back to general_info for unknown types", () => {
  assert.equal(getNotificationMeta("unknown_type"), NOTIFICATION_TYPE_META.general_info);
});

test("failure notification helpers detect all failure-style notifications", () => {
  assert.equal(isFailureNotificationType("quiz_failure"), true);
  assert.equal(isFailureNotificationType("flashcard_failure"), true);
  assert.equal(isFailureNotificationType("general_info"), false);
});

test("default notification preferences include reminder defaults and all known type keys", () => {
  assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.defaultReminder.value, 30);
  assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.defaultReminder.unit, "minutes");
  assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.quietHours.enabled, false);
  assert.equal(VALID_NOTIFICATION_TYPES.includes("study_plan_reminder"), true);
  assert.equal(VALID_NOTIFICATION_TYPES.includes("warning"), true);
});

