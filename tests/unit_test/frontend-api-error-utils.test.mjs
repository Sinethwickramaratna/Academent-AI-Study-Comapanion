import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getApiErrorMessage,
  sanitizeApiErrorMessage,
} from "../../Frontend/Academent/src/Services/apiErrorUtils.js";

test("sanitizeApiErrorMessage returns the fallback for empty or technical messages", () => {
  assert.equal(sanitizeApiErrorMessage("", "Fallback"), "Fallback");
  assert.equal(sanitizeApiErrorMessage("Unexpected end of JSON input", "Fallback"), "Fallback");
  assert.equal(sanitizeApiErrorMessage("<html><body>Error</body></html>", "Fallback"), "Fallback");
});

test("sanitizeApiErrorMessage normalizes safe user-facing messages", () => {
  assert.equal(
    sanitizeApiErrorMessage("  Please   select a PDF first.  "),
    "Please select a PDF first.",
  );
});

test("getApiErrorMessage reads error or message fields from API results", () => {
  assert.equal(getApiErrorMessage({ error: "Upload failed" }), "Upload failed");
  assert.equal(getApiErrorMessage({ message: "Try again later" }), "Try again later");
  assert.equal(getApiErrorMessage({}, "Fallback"), "Fallback");
});

