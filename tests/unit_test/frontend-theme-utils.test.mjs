import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  THEME_STORAGE_KEY,
  applyThemeMode,
  getStoredThemeMode,
  normalizeThemeMode,
  resolveThemeMode,
  storeThemeMode,
} from "../../Frontend/Academent/src/utils/theme.js";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

afterEach(() => {
  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }

  if (originalDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = originalDocument;
  }
});

test("normalizeThemeMode accepts light, dark, and system values", () => {
  assert.equal(normalizeThemeMode("dark"), "Dark");
  assert.equal(normalizeThemeMode("SYSTEM"), "System");
  assert.equal(normalizeThemeMode("unknown"), "Light");
  assert.equal(normalizeThemeMode(null), "Light");
});

test("theme helpers return safe defaults without browser globals", () => {
  delete globalThis.window;
  delete globalThis.document;

  assert.equal(getStoredThemeMode(), "Light");
  assert.equal(resolveThemeMode("System"), "Light");
  assert.equal(applyThemeMode("Dark"), "Light");
});

test("storeThemeMode and getStoredThemeMode normalize localStorage values", () => {
  const storage = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };

  storeThemeMode("system");

  assert.equal(storage.get(THEME_STORAGE_KEY), "System");
  assert.equal(getStoredThemeMode(), "System");
});

test("applyThemeMode updates root classes and dataset from system preference", () => {
  const classNames = new Set();
  const dataset = {};
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
  };
  globalThis.document = {
    documentElement: {
      classList: {
        toggle: (className, enabled) => {
          if (enabled) classNames.add(className);
          else classNames.delete(className);
        },
      },
      dataset,
    },
  };

  assert.equal(applyThemeMode("System"), "Dark");
  assert.equal(classNames.has("dark"), true);
  assert.equal(dataset.theme, "dark");
  assert.equal(dataset.themeMode, "system");
});

