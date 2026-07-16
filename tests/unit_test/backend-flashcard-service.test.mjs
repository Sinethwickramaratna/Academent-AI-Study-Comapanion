import assert from "node:assert/strict";
import { test } from "node:test";

import { generateFlashCards } from "../../backend/services/flashCardAiService.js";

test("generateFlashCards rejects empty source lists before calling the AI provider", async () => {
  await assert.rejects(
    () => generateFlashCards({ sources: [], preferences: { cardCount: 5 } }),
    /At least one study source is required/,
  );
});

test("generateFlashCards rejects non-array source input before calling the AI provider", async () => {
  await assert.rejects(
    () => generateFlashCards({ sources: null, preferences: { cardCount: 5 } }),
    /At least one study source is required/,
  );
});

