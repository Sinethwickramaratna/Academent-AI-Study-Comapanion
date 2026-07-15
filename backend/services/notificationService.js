import { getAdminDb, getAdminMessaging, getFirebaseAdmin } from "../config/firebaseAdmin.js";

export const notificationMeta = {
  quiz_success: { category: "activity", status: "success", preferenceKey: "quizNotifications" },
  quiz_failure: { category: "activity", status: "failure", preferenceKey: "quizNotifications", alwaysEnabled: true },
  flashcard_success: { category: "activity", status: "success", preferenceKey: "flashcardNotifications" },
  flashcard_failure: { category: "activity", status: "failure", preferenceKey: "flashcardNotifications", alwaysEnabled: true },
  pdf_upload_success: { category: "activity", status: "success", preferenceKey: "pdfUploadNotifications" },
  pdf_upload_failure: { category: "activity", status: "failure", preferenceKey: "pdfUploadNotifications", alwaysEnabled: true },
  exam_reminder: { category: "reminder", status: "reminder", preferenceKey: "examReminders" },
  assignment_reminder: { category: "reminder", status: "reminder", preferenceKey: "assignmentReminders" },
  task_reminder: { category: "reminder", status: "reminder", preferenceKey: "taskReminders" },
  study_plan_reminder: { category: "reminder", status: "reminder", preferenceKey: "studyPlanReminders" },
  general_info: { category: "system", status: "info", preferenceKey: "systemNotifications" },
  warning: { category: "system", status: "warning", preferenceKey: "systemNotifications" },
};

const defaultPreferences = {
  inAppEnabled: true,
  browserPushEnabled: true,
  quizNotifications: true,
  flashcardNotifications: true,
  pdfUploadNotifications: true,
  examReminders: true,
  assignmentReminders: true,
  taskReminders: true,
  studyPlanReminders: true,
  systemNotifications: true,
};

const sanitizeIdPart = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 96) || "notification";

export const buildNotificationId = ({ type, entityType, entityId, idempotencyKey }) => [
  sanitizeIdPart(type),
  sanitizeIdPart(entityType || "general"),
  sanitizeIdPart(entityId || idempotencyKey || Date.now()),
].join("_");

const validateNotificationPayload = (payload = {}) => {
  if (!payload.userId) throw new Error("Notification userId is required.");
  if (!notificationMeta[payload.type]) throw new Error(`Unsupported notification type: ${payload.type}`);
  if (!payload.title || !payload.message) throw new Error("Notification title and message are required.");
  if (payload.actionUrl && (!String(payload.actionUrl).startsWith("/") || String(payload.actionUrl).startsWith("//"))) {
    throw new Error("Notification actionUrl must be an application-relative path.");
  }
  if (payload.entityType && !payload.entityId) throw new Error("Notification entityId is required when entityType is present.");
};

export async function getNotificationPreferences(userId) {
  const db = await getAdminDb();
  const snapshot = await db.doc(`users/${userId}/settings/notifications`).get();
  return {
    ...defaultPreferences,
    ...(snapshot.exists ? snapshot.data() : {}),
  };
}

async function shouldCreateNotification(userId, type, deliveryChannels = {}) {
  const meta = notificationMeta[type];
  if (meta.alwaysEnabled || meta.status === "failure") return true;

  const preferences = await getNotificationPreferences(userId);
  if (deliveryChannels.inApp !== false && preferences.inAppEnabled === false) return false;
  if (preferences[meta.preferenceKey] === false) return false;
  return true;
}

export async function createNotification(payload = {}, options = {}) {
  validateNotificationPayload(payload);
  const shouldCreate = await shouldCreateNotification(payload.userId, payload.type, payload.deliveryChannels);
  if (!shouldCreate) return null;

  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const meta = notificationMeta[payload.type];
  const notificationId = payload.id || buildNotificationId({
    type: payload.type,
    entityType: payload.entityType,
    entityId: payload.entityId,
    idempotencyKey: options.idempotencyKey || payload.idempotencyKey,
  });
  const ref = db.doc(`users/${payload.userId}/notifications/${notificationId}`);

  const notification = {
    id: notificationId,
    userId: payload.userId,
    type: payload.type,
    category: payload.category || meta.category,
    status: payload.status || meta.status,
    title: payload.title,
    message: payload.message,
    entityType: payload.entityType || "",
    entityId: payload.entityId || "",
    entityTitle: payload.entityTitle || "",
    actionLabel: payload.actionLabel || "",
    actionUrl: payload.actionUrl || "",
    isRead: false,
    isDeleted: false,
    deliveryChannels: {
      inApp: true,
      browserPush: true,
      ...(payload.deliveryChannels || {}),
    },
    createdAt: FieldValue.serverTimestamp(),
    readAt: null,
    expiresAt: payload.expiresAt || null,
    metadata: payload.metadata || {},
  };

  await ref.set(notification, { merge: false });
  return { ...notification, ref };
}

export async function markNotificationAsRead(userId, notificationId, isRead = true) {
  const admin = await getFirebaseAdmin();
  const FieldValue = admin.firestore.FieldValue;
  await admin.firestore().doc(`users/${userId}/notifications/${notificationId}`).update({
    isRead,
    readAt: isRead ? FieldValue.serverTimestamp() : null,
  });
}

export async function markAllNotificationsAsRead(userId) {
  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const snapshot = await db.collection(`users/${userId}/notifications`)
    .where("isRead", "==", false)
    .where("isDeleted", "==", false)
    .get();
  const batch = db.batch();
  snapshot.docs.forEach((item) => batch.update(item.ref, { isRead: true, readAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  return snapshot.size;
}

export async function deleteNotification(userId, notificationId) {
  const admin = await getFirebaseAdmin();
  await admin.firestore().doc(`users/${userId}/notifications/${notificationId}`).update({
    isDeleted: true,
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getUnreadNotificationCount(userId) {
  const db = await getAdminDb();
  const snapshot = await db.collection(`users/${userId}/notifications`)
    .where("isRead", "==", false)
    .where("isDeleted", "==", false)
    .get();
  return snapshot.size;
}

export async function sendBrowserPushNotification(userId, notification) {
  const preferences = await getNotificationPreferences(userId);
  if (!preferences.browserPushEnabled || notification.deliveryChannels?.browserPush === false) return { sent: 0, removed: 0 };

  const admin = await getFirebaseAdmin();
  const db = admin.firestore();
  const messaging = await getAdminMessaging();
  const devicesSnapshot = await db.collection(`users/${userId}/devices`)
    .where("notificationsEnabled", "==", true)
    .get();

  let sent = 0;
  let removed = 0;

  await Promise.all(devicesSnapshot.docs.map(async (device) => {
    const token = device.data().fcmToken;
    if (!token) return;
    try {
      const actionUrl = notification.actionUrl || "/notifications";
      const message = {
        token,
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          notificationId: String(notification.id || ""),
          type: String(notification.type || ""),
          actionUrl,
        },
      };

      const frontendOrigin = process.env.FRONTEND_ORIGIN || process.env.CLIENT_ORIGIN || process.env.APP_ORIGIN || "";
      if (frontendOrigin) {
        try {
          message.webpush = {
            fcmOptions: {
              link: new URL(actionUrl, frontendOrigin).href,
            },
          };
        } catch {
          // The service worker still receives data.actionUrl, so an invalid
          // frontend origin should not block notification delivery.
        }
      }

      await messaging.send(message);
      sent += 1;
    } catch (error) {
      const code = String(error?.code || "");
      if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
        await device.ref.delete();
        removed += 1;
      } else {
        console.error("Browser push notification failed:", error);
      }
    }
  }));

  return { sent, removed };
}
