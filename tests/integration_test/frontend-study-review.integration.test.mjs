import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applySm2Rating,
  createInitialSchedule,
} from "../../Frontend/Academent/src/Services/spacedRepetitionService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

test("flashcard review workflow advances and resets a card schedule across multiple reviews", () => {
  const firstReviewAt = new Date("2026-07-16T08:00:00.000Z");
  const initial = createInitialSchedule(firstReviewAt);
  const first = applySm2Rating(initial, "Good", firstReviewAt);
  const secondReviewAt = first.nextReview;
  const second = applySm2Rating(first, "Easy", secondReviewAt);
  const thirdReviewAt = second.nextReview;
  const third = applySm2Rating(second, "Again", thirdReviewAt);

  assert.equal(first.reviewCount, 1);
  assert.equal(first.interval, 1);
  assert.equal(first.nextReview.getTime(), firstReviewAt.getTime() + DAY_MS);

  assert.equal(second.reviewCount, 2);
  assert.equal(second.repetitions, 2);
  assert.equal(second.interval, 6);
  assert.equal(second.nextReview.getTime(), secondReviewAt.getTime() + 6 * DAY_MS);
  assert.ok(second.masteryLevel > first.masteryLevel);

  assert.equal(third.reviewCount, 3);
  assert.equal(third.repetitions, 0);
  assert.equal(third.interval, 0);
  assert.equal(third.nextReview.getTime(), thirdReviewAt.getTime());
  assert.ok(third.masteryLevel < second.masteryLevel);
});

