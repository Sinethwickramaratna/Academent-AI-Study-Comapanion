import assert from "node:assert/strict";
import { test } from "node:test";

import {
  dashboardRouteByTab,
  dashboardTabByRoute,
  dashboardWindowItems,
  getDashboardRouteForTab,
  getDashboardTabForPath,
} from "../../Frontend/Academent/src/routes/windowRoutes.js";

test("dashboard window route maps stay in sync with every navigation item", () => {
  assert.ok(dashboardWindowItems.length >= 8);

  for (const item of dashboardWindowItems) {
    assert.equal(dashboardRouteByTab[item.id], item.route);
    assert.equal(dashboardTabByRoute[item.route], item.id);
    assert.equal(getDashboardRouteForTab(item.id), item.route);
    assert.equal(getDashboardTabForPath(item.route), item.id);
  }
});

test("unknown dashboard tabs and routes fall back safely", () => {
  assert.equal(getDashboardRouteForTab("missing-tab"), "/dashboard");
  assert.equal(getDashboardTabForPath("/unknown-route"), null);
});

test("deep-link dashboard feature routes target existing dashboard tabs", () => {
  const deepLinks = {
    "/quizzes/:quizId": "quiz-generator",
    "/flashcards/:flashcardSetId": "flashcards",
    "/pdfs/:pdfId": "my-notes",
    "/exams/:eventId": "study-planner",
    "/assignments/:eventId": "study-planner",
    "/tasks/:eventId": "study-planner",
    "/study-plans/:eventId": "study-planner",
  };

  const knownTabs = new Set(dashboardWindowItems.map((item) => item.id));
  for (const targetTab of Object.values(deepLinks)) {
    assert.equal(knownTabs.has(targetTab), true);
    assert.ok(getDashboardRouteForTab(targetTab).startsWith("/"));
  }
});

