import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REVIEW_RATINGS,
  applySm2Rating,
  createInitialSchedule,
} from "../../Frontend/Academent/src/Services/spacedRepetitionService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

test("createInitialSchedule builds a new unreviewed card schedule", () => {
  const now = new Date("2026-07-16T08:00:00.000Z");
  const schedule = createInitialSchedule(now);

  assert.equal(schedule.masteryLevel, 0);
  assert.equal(schedule.reviewCount, 0);
  assert.equal(schedule.easeFactor, 2.5);
  assert.equal(schedule.nextReview, now);
  assert.deepEqual(schedule.reviewHistory, []);
});

test("applySm2Rating schedules a first good review for the next day", () => {
  const reviewedAt = new Date("2026-07-16T08:00:00.000Z");
  const result = applySm2Rating({}, "Good", reviewedAt);

  assert.equal(REVIEW_RATINGS.Good, 3);
  assert.equal(result.repetitions, 1);
  assert.equal(result.interval, 1);
  assert.equal(result.easeFactor, 2.36);
  assert.equal(result.reviewCount, 1);
  assert.equal(result.masteryLevel, 26);
  assert.equal(result.nextReview.getTime(), reviewedAt.getTime() + DAY_MS);
});

test("applySm2Rating extends intervals for successful repeated reviews", () => {
  const reviewedAt = new Date("2026-07-16T08:00:00.000Z");
  const result = applySm2Rating({
    easeFactor: 2.5,
    repetitions: 2,
    interval: 6,
    reviewCount: 4,
    masteryLevel: 80,
  }, "Easy", reviewedAt);

  assert.equal(result.repetitions, 3);
  assert.equal(result.interval, 15);
  assert.equal(result.easeFactor, 2.5);
  assert.equal(result.reviewCount, 5);
  assert.equal(result.masteryLevel, 87);
  assert.equal(result.nextReview.getTime(), reviewedAt.getTime() + 15 * DAY_MS);
});

test("applySm2Rating resets repetitions for again reviews", () => {
  const reviewedAt = new Date("2026-07-16T08:00:00.000Z");
  const result = applySm2Rating({
    easeFactor: 2.1,
    repetitions: 3,
    interval: 10,
    reviewCount: 2,
    masteryLevel: 60,
  }, "Again", reviewedAt);

  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 0);
  assert.equal(result.easeFactor, 2.1);
  assert.equal(result.reviewCount, 3);
  assert.equal(result.masteryLevel, 48);
  assert.equal(result.nextReview.getTime(), reviewedAt.getTime());
});

