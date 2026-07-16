import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";

import chatRoutes from "../../backend/routes/chatRoutes.js";
import flashCardRoutes from "../../backend/routes/flashCardRoutes.js";
import quizRoutes from "../../backend/routes/quizRoutes.js";
import {
  INVALID_JSON_REQUEST_MESSAGE,
  getPublicErrorMessage,
  isRequestJsonParseError,
} from "../../backend/utils/apiErrors.js";

const requireFromBackend = createRequire(new URL("../../backend/package.json", import.meta.url));
const express = requireFromBackend("express");

let server;
let baseUrl;

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await response.json();
  return { response, body };
};

before(async () => {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(function handleJsonParseError(error, req, res, next) {
    if (!isRequestJsonParseError(error)) {
      next(error);
      return;
    }

    res.status(400).json({
      success: false,
      message: INVALID_JSON_REQUEST_MESSAGE,
    });
  });

  app.use("/api/chat", chatRoutes);
  app.use("/api/flashcards", flashCardRoutes);
  app.use("/api/quiz", quizRoutes);

  app.use(function handleUnhandledApiError(error, req, res, next) {
    if (res.headersSent) {
      next(error);
      return;
    }

    const statusCode = Number.isFinite(Number(error.status)) ? Number(error.status) : 500;
    res.status(statusCode).json({
      success: false,
      message: getPublicErrorMessage(error),
    });
  });

  server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("chat route returns a validation response before calling the AI service", async () => {
  const { response, body } = await requestJson("/api/chat", {
    method: "POST",
    body: JSON.stringify({ history: [] }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    success: false,
    message: "Message is required",
  });
});

test("quiz route validates difficulty before generating a quiz", async () => {
  const { response, body } = await requestJson("/api/quiz/generate-quiz", {
    method: "POST",
    body: JSON.stringify({
      knowledge: [{ concept: "Recursion" }],
      numQuestions: 3,
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "Difficulty level is required (easy, medium, hard)");
});

test("flashcard route returns a sanitized failure response for invalid source input", async () => {
  const { response, body } = await requestJson("/api/flashcards/generate", {
    method: "POST",
    body: JSON.stringify({
      sources: [],
      preferences: { cardCount: 5 },
    }),
  });

  assert.equal(response.status, 500);
  assert.equal(body.success, false);
  assert.equal(body.error, "At least one study source is required to generate flash cards.");
});

test("API JSON parser returns the public invalid JSON response for malformed requests", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, {
    success: false,
    message: INVALID_JSON_REQUEST_MESSAGE,
  });
});

