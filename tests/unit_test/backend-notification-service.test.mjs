import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNotificationId,
  notificationMeta,
} from "../../backend/services/notificationService.js";

test("buildNotificationId creates stable sanitized ids from notification payload parts", () => {
  assert.equal(
    buildNotificationId({
      type: "Quiz Success!",
      entityType: "Quiz Set",
      entityId: " ID 42 ",
    }),
    "quiz-success_quiz-set_id-42",
  );
});

test("buildNotificationId falls back to general and idempotency key parts", () => {
  assert.equal(
    buildNotificationId({
      type: "",
      entityType: "",
      idempotencyKey: " Upload #99 ",
    }),
    "notification_general_upload-99",
  );
});

test("notificationMeta marks failure notifications as always enabled", () => {
  assert.equal(notificationMeta.quiz_failure.status, "failure");
  assert.equal(notificationMeta.quiz_failure.alwaysEnabled, true);
  assert.equal(notificationMeta.flashcard_failure.preferenceKey, "flashcardNotifications");
  assert.equal(notificationMeta.general_info.category, "system");
});

