import { deleteDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { app } from "../firebase/firebase";
import { userDeviceRef } from "./notificationService";

const FCM_SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

const getMessagingSdk = async () => {
  const messaging = await import("firebase/messaging");
  const supported = await messaging.isSupported().catch(() => false);
  if (!supported) return null;
  return messaging;
};

const getBrowserName = () => {
  const agent = navigator.userAgent;
  if (agent.includes("Edg/")) return "Edge";
  if (agent.includes("Chrome/")) return "Chrome";
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Safari/")) return "Safari";
  return "Browser";
};

export const getDeviceId = () => {
  const storageKey = "academent.notificationDeviceId";
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(storageKey, next);
  return next;
};

export const getBrowserNotificationSupport = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { supported: false, permission: "unsupported" };
  }

  const sdk = await getMessagingSdk();
  return {
    supported: Boolean(sdk),
    permission: Notification.permission,
  };
};

export const registerMessagingServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register(FCM_SERVICE_WORKER_PATH);
};

export const saveFcmTokenForUser = async (uid, fcmToken, patch = {}) => {
  if (!uid || !fcmToken) throw new Error("A signed-in user and FCM token are required.");
  const deviceId = getDeviceId();
  await setDoc(userDeviceRef(uid, deviceId), {
    fcmToken,
    platform: "web",
    browser: getBrowserName(),
    notificationsEnabled: true,
    createdAt: patch.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastUsedAt: serverTimestamp(),
    ...patch,
  }, { merge: true });
  return deviceId;
};

export const requestAndSaveFcmToken = async (uid) => {
  const sdk = await getMessagingSdk();
  if (!sdk) throw new Error("Browser push notifications are not supported in this browser.");
  if (!uid) throw new Error("Please sign in before enabling browser notifications.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Browser notification permission was not granted.");
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("VITE_FIREBASE_VAPID_KEY is required to enable browser push notifications.");

  const registration = await registerMessagingServiceWorker();
  const messaging = sdk.getMessaging(app);
  const fcmToken = await sdk.getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration || undefined,
  });

  if (!fcmToken) throw new Error("Firebase Cloud Messaging did not return a token.");
  const snapshot = await getDoc(userDeviceRef(uid, getDeviceId()));
  await saveFcmTokenForUser(uid, fcmToken, {
    createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
  });
  return fcmToken;
};

export const disableBrowserNotificationsForUser = async (uid) => {
  if (!uid) return;
  const deviceId = getDeviceId();
  await setDoc(userDeviceRef(uid, deviceId), {
    notificationsEnabled: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const removeBrowserNotificationToken = async (uid) => {
  if (!uid) return;
  await deleteDoc(userDeviceRef(uid, getDeviceId()));
};

export const subscribeToForegroundMessages = async (onMessageReceived) => {
  const sdk = await getMessagingSdk();
  if (!sdk) return () => {};

  const messaging = sdk.getMessaging(app);
  return sdk.onMessage(messaging, onMessageReceived);
};

