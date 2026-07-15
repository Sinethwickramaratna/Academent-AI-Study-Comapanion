import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  disableBrowserNotificationsForUser,
  getBrowserNotificationSupport,
  requestAndSaveFcmToken,
  subscribeToForegroundMessages,
} from "../Services/firebaseMessagingService";
import { useNotificationPreferences } from "./useNotificationPreferences";

export const useBrowserNotifications = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const { preferences, updatePreferences } = useNotificationPreferences();
  const [support, setSupport] = useState({ supported: false, permission: "default" });
  const [token, setToken] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [foregroundMessage, setForegroundMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    getBrowserNotificationSupport().then((nextSupport) => {
      if (mounted) setSupport(nextSupport);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    subscribeToForegroundMessages((payload) => setForegroundMessage(payload))
      .then((nextUnsubscribe) => { unsubscribe = nextUnsubscribe; })
      .catch(() => {});
    return () => unsubscribe();
  }, []);

  const enableBrowserNotifications = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const fcmToken = await requestAndSaveFcmToken(uid);
      await updatePreferences({ browserPushEnabled: true });
      setToken(fcmToken);
      setSupport(await getBrowserNotificationSupport());
      return fcmToken;
    } catch (enableError) {
      setError(enableError);
      throw enableError;
    } finally {
      setWorking(false);
    }
  }, [uid, updatePreferences]);

  const disableBrowserNotifications = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      await disableBrowserNotificationsForUser(uid);
      await updatePreferences({ browserPushEnabled: false });
    } catch (disableError) {
      setError(disableError);
      throw disableError;
    } finally {
      setWorking(false);
    }
  }, [uid, updatePreferences]);

  return {
    supported: support.supported,
    permission: support.permission,
    enabled: Boolean(preferences.browserPushEnabled),
    token,
    working,
    error,
    foregroundMessage,
    enableBrowserNotifications,
    disableBrowserNotifications,
  };
};

export default useBrowserNotifications;

