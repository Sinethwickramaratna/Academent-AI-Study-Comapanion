/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToNotifications } from "../Services/notificationService";

export const useNotifications = (options = {}) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const maxItems = options.maxItems;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToNotifications(
      uid,
      (items) => {
        setNotifications(items);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      },
      { maxItems },
    );

    return unsubscribe;
  }, [uid, maxItems]);

  return useMemo(() => ({
    uid,
    notifications,
    loading,
    error,
  }), [uid, notifications, loading, error]);
};

export default useNotifications;

