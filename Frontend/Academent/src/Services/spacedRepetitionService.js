const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_RATINGS = {
  Again: 1,
  Hard: 2,
  Good: 3,
  Easy: 4,
};

export const createInitialSchedule = (now = new Date()) => ({
  masteryLevel: 0,
  reviewCount: 0,
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: now,
  lastReviewed: null,
  reviewHistory: [],
});

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

export const applySm2Rating = (card, rating, reviewedAt = new Date()) => {
  const quality = REVIEW_RATINGS[rating] ?? Number(rating) ?? 3;
  const previousEase = Number(card.easeFactor || 2.5);
  const previousRepetitions = Number(card.repetitions || 0);
  const previousReviewCount = Number(card.reviewCount || 0);

  let repetitions = previousRepetitions;
  let interval = Number(card.interval || 0);
  let easeFactor = previousEase;

  if (quality < 3) {
    repetitions = 0;
    interval = quality <= 1 ? 0 : 1;
  } else {
    repetitions += 1;

    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, Number(easeFactor.toFixed(2)));
  }

  const score = quality * 25;
  const previousMastery = Number(card.masteryLevel || 0);
  const masteryLevel = Math.max(0, Math.min(100, Math.round(previousMastery * 0.65 + score * 0.35)));
  const nextReview = quality <= 1 ? addDays(reviewedAt, 0) : addDays(reviewedAt, interval || 1);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReviewed: reviewedAt,
    reviewCount: previousReviewCount + 1,
    masteryLevel,
  };
};
