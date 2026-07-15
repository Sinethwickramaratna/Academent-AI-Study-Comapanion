import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  processDueStudyPlannerReminders,
  subscribeStudyPlannerEvents,
} from "../Services/studyPlannerService";
import { useNotificationToasts } from "../components/notifications/NotificationToastProvider";

const POLL_INTERVAL_MS = 30 * 1000;

export const useStudyPlannerReminderProcessor = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotificationToasts();
  const eventsRef = useRef([]);
  const processingRef = useRef(false);

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      eventsRef.current = [];
      return undefined;
    }

    let disposed = false;

    const processReminders = async () => {
      if (disposed || processingRef.current) return;
      processingRef.current = true;
      try {
        const notifications = await processDueStudyPlannerReminders(uid, eventsRef.current);
        notifications.forEach((notification) => {
          addToast({
            type: "info",
            message: `${notification.title}: ${notification.message}`,
            timeout: 7000,
          });
        });
      } catch (error) {
        console.warn("Study planner reminder processing failed:", error);
      } finally {
        processingRef.current = false;
      }
    };

    const unsubscribe = subscribeStudyPlannerEvents(
      uid,
      (events) => {
        eventsRef.current = events;
        processReminders();
      },
      (error) => console.warn("Study planner reminder listener failed:", error),
    );

    const intervalId = window.setInterval(processReminders, POLL_INTERVAL_MS);
    processReminders();

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      unsubscribe?.();
    };
  }, [addToast, currentUser?.uid]);
};

export default useStudyPlannerReminderProcessor;
