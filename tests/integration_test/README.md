# Integration Tests

Run the integration tests from the repository root:

```powershell
node --test --test-isolation=none "tests/integration_test/*.test.mjs"
```

These tests use Node's built-in test runner. They cover backend route behavior through an in-process Express server and frontend website workflows across routing, notes, reminders, notifications, and flashcard review scheduling.

