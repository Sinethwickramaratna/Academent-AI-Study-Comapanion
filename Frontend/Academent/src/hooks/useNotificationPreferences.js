/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  mergeNotificationPreferences,
  saveNotificationPreferences,
  subscribeNotificationPreferences,
} from "../Services/notificationService";

export const useNotificationPreferences = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const [preferences, setPreferences] = useState(() => mergeNotificationPreferences());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setPreferences(mergeNotificationPreferences());
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);
    return subscribeNotificationPreferences(
      uid,
      (nextPreferences) => {
        setPreferences(nextPreferences);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      },
    );
  }, [uid]);

  const updatePreferences = useCallback(async (patch) => {
    if (!uid) throw new Error("Please sign in before updating notification preferences.");
    setSaving(true);
    setError(null);
    try {
      const next = mergeNotificationPreferences({
        ...preferences,
        ...(typeof patch === "function" ? patch(preferences) : patch),
      });
      await saveNotificationPreferences(uid, next);
      setPreferences(next);
      return next;
    } catch (saveError) {
      setError(saveError);
      throw saveError;
    } finally {
      setSaving(false);
    }
  }, [preferences, uid]);

  return useMemo(() => ({
    uid,
    preferences,
    loading,
    saving,
    error,
    updatePreferences,
  }), [uid, preferences, loading, saving, error, updatePreferences]);
};

export default useNotificationPreferences;

