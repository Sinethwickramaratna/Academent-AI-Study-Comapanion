# Academent Notification System Setup

## Firestore Layout

Persistent in-app notifications are stored per user:

```text
users/{userId}/notifications/{notificationId}
users/{userId}/settings/notifications
users/{userId}/devices/{deviceId}
scheduledNotifications/{scheduledNotificationId}
```

The frontend listens to `users/{userId}/notifications` in real time for the header dropdown and `/notifications` page. Scheduled reminder jobs are backend-owned and denied to untrusted clients in `firestore.rules`.

## Backend Environment

Install backend dependencies after pulling these changes:

```bash
cd backend
npm install
```

Add Firebase Admin credentials through one of these options. For local development, set `FIREBASE_PROJECT_ID` explicitly so the Admin SDK can verify Firebase ID tokens without relying on Google Cloud metadata:

```bash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
# or use Google Application Default Credentials:
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
```

Optional frontend origin for notification-click links:

```bash
FRONTEND_ORIGIN=http://localhost:5173
```

Optional cron protection:

```bash
NOTIFICATION_CRON_SECRET=replace-with-a-long-random-secret
```

Process due reminders from a scheduler every minute:

```bash
curl -X POST http://localhost:5000/api/notifications/process-due-reminders \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $NOTIFICATION_CRON_SECRET" \
  -d '{"limit":50}'
```

## Browser Push Notifications

Set the Firebase Web Push certificate key in the Vite app:

```bash
VITE_FIREBASE_VAPID_KEY=your_web_push_certificate_key
```

The app asks for browser notification permission only from the profile notification settings card. FCM tokens are stored per device in `users/{userId}/devices/{deviceId}`. Invalid tokens are removed by the backend sender.

Generation and app-open reminder flows call `POST /api/notifications` with the signed-in Firebase ID token. The backend creates the in-app notification and sends Firebase Cloud Messaging browser push to enabled device tokens. If the backend is unavailable, the frontend falls back to creating the in-app Firestore notification only.

Scheduled reminders require the backend scheduler to call `/api/notifications/process-due-reminders`; otherwise reminders can only be checked while the app is open.

## Existing Flow Examples

Quiz generation creates a success notification only after the quiz document is saved:

```js
const quiz = await createGeneratedQuiz(userId, payload);
// Internally creates quiz_success with actionUrl /quizzes/{quizId}
```

Flashcard generation creates a success notification after the collection and cards are committed:

```js
const collection = await createGeneratedFlashCardCollection(userId, payload);
// Internally creates flashcard_success with actionUrl /flashcards/{collectionId}
```

PDF upload success is emitted after storage upload, note metadata save, and knowledge extraction:

```js
const uploadedPdf = await uploadPdfToCloudinary(file);
await notes.addPdf(semesterId, moduleId, folderId, uploadedPdf);
// addPdf creates pdf_upload_success with actionUrl /pdfs/{pdfId}
```

Planner reminders are stored on the event as `reminders[]` with UTC-compatible Firestore timestamps. To create backend scheduled jobs from a trusted context:

```js
await fetch(`/api/notifications/events/${event.eventId}/reminders/reschedule`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
  },
  body: JSON.stringify({ event }),
});
```

When an event is edited, call the same reschedule endpoint. When deleted or completed, call:

```js
await fetch(`/api/notifications/events/${eventId}/reminders`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${await firebaseUser.getIdToken()}` },
});
```

## Security Notes

- Firebase Admin credentials are backend-only.
- Users can read only their own notifications.
- Users can only update notification read/delete state fields.
- Failure notifications remain enabled by default.
- Scheduled notification jobs are not client-writable.
- Reminder processing claims jobs transactionally before creating notifications.

