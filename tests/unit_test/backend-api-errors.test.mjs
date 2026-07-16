import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AI_RESPONSE_FORMAT_MESSAGE,
  createAiResponseFormatError,
  getPublicErrorMessage,
  isJsonParseError,
  isRequestJsonParseError,
} from "../../backend/utils/apiErrors.js";

test("createAiResponseFormatError wraps the original error with a public code", () => {
  const cause = new SyntaxError("Unexpected end of JSON input");
  const error = createAiResponseFormatError(cause);

  assert.equal(error.message, AI_RESPONSE_FORMAT_MESSAGE);
  assert.equal(error.code, "AI_RESPONSE_FORMAT");
  assert.equal(error.cause, cause);
});

test("isJsonParseError identifies common JSON parsing failures", () => {
  assert.equal(isJsonParseError(new SyntaxError("Unexpected end of JSON input")), true);
  assert.equal(isJsonParseError("Unexpected token } in JSON at position 12"), true);
  assert.equal(isJsonParseError(new Error("Regular validation failed")), false);
});

test("isRequestJsonParseError identifies malformed Express JSON request bodies", () => {
  const bodySyntaxError = new SyntaxError("Unexpected token } in JSON");
  bodySyntaxError.status = 400;
  bodySyntaxError.body = "{bad json";

  assert.equal(isRequestJsonParseError({ type: "entity.parse.failed" }), true);
  assert.equal(isRequestJsonParseError(bodySyntaxError), true);
  assert.equal(isRequestJsonParseError(new SyntaxError("Unexpected token } in JSON")), false);
});

test("getPublicErrorMessage prefers explicit public messages", () => {
  assert.equal(
    getPublicErrorMessage({ publicMessage: "Use this message", message: "Internal detail" }),
    "Use this message",
  );
});

test("getPublicErrorMessage hides AI JSON, HTML, model, and network details", () => {
  assert.equal(
    getPublicErrorMessage(new SyntaxError("Unexpected end of JSON input")),
    AI_RESPONSE_FORMAT_MESSAGE,
  );
  assert.equal(
    getPublicErrorMessage(new Error("<html><body>Server Error</body></html>"), "Fallback"),
    "Fallback",
  );
  assert.equal(
    getPublicErrorMessage(new Error("model llama3 not found")),
    "The AI model is not available. Check the backend model configuration and try again.",
  );
  assert.equal(
    getPublicErrorMessage(new Error("fetch failed")),
    "The AI service could not be reached. Check the backend connection and try again.",
  );
});

