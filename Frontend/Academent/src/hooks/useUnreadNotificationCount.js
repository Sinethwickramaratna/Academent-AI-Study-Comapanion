/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToUnreadNotificationCount } from "../Services/notificationService";

export const useUnreadNotificationCount = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      return undefined;
    }

    return subscribeToUnreadNotificationCount(uid, setCount, setError);
  }, [uid]);

  return { uid, count, error };
};

export default useUnreadNotificationCount;

