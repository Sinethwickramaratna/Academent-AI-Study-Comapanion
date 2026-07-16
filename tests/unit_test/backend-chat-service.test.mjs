import assert from "node:assert/strict";
import { test } from "node:test";

import { buildQuizPrompt } from "../../backend/services/chatService.js";

test("buildQuizPrompt clamps easy quiz question counts to the minimum", () => {
  const prompt = buildQuizPrompt([{ concept: "Normalization" }], 0, "easy");

  assert.match(prompt, /Number of questions:\s*1/);
  assert.match(prompt, /DIFFICULTY:\s*EASY/);
  assert.match(prompt, /Do NOT include fill_blank, cloze, scenario, or short answer questions/);
});

test("buildQuizPrompt defaults invalid difficulty and question counts to medium quiz rules", () => {
  const prompt = buildQuizPrompt({ topic: "Databases" }, "many", "expert");

  assert.match(prompt, /Number of questions:\s*10/);
  assert.match(prompt, /DIFFICULTY:\s*MEDIUM/);
  assert.match(prompt, /FILL_BLANK/);
  assert.match(prompt, /CLOZE/);
});

test("buildQuizPrompt clamps hard quizzes to the maximum and includes advanced question types", () => {
  const prompt = buildQuizPrompt("Operating systems knowledge", 999, "hard");

  assert.match(prompt, /Number of questions:\s*20/);
  assert.match(prompt, /DIFFICULTY:\s*HARD/);
  assert.match(prompt, /SCENARIO/);
  assert.match(prompt, /SHORT_ANSWER/);
});

