import express from "express";
import { authenticateFirebaseUser, requireCronSecret } from "../middleware/authenticateFirebaseUser.js";
import {
  deleteNotification,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService.js";
import {
  cancelEventReminders,
  processDueReminders,
  rescheduleEventReminders,
} from "../services/reminderService.js";

const router = express.Router();

router.post("/process-due-reminders", requireCronSecret, async (req, res) => {
  try {
    const results = await processDueReminders({ limit: Number(req.body?.limit || 50) });
    res.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("Reminder processor failed:", error);
    res.status(500).json({ success: false, message: "Due reminders could not be processed." });
  }
});

router.use(authenticateFirebaseUser);

router.get("/unread-count", async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user.uid);
    res.json({ success: true, count });
  } catch (error) {
    console.error("Unread notification count failed:", error);
    res.status(500).json({ success: false, message: "Unread notifications could not be counted." });
  }
});

router.patch("/:notificationId/read", async (req, res) => {
  try {
    await markNotificationAsRead(req.user.uid, req.params.notificationId, req.body?.isRead !== false);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    res.status(500).json({ success: false, message: "Notification could not be updated." });
  }
});

router.patch("/mark-all-read", async (req, res) => {
  try {
    const count = await markAllNotificationsAsRead(req.user.uid);
    res.json({ success: true, count });
  } catch (error) {
    console.error("Mark all notifications read failed:", error);
    res.status(500).json({ success: false, message: "Notifications could not be updated." });
  }
});

router.delete("/:notificationId", async (req, res) => {
  try {
    await deleteNotification(req.user.uid, req.params.notificationId);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete notification failed:", error);
    res.status(500).json({ success: false, message: "Notification could not be deleted." });
  }
});

router.post("/events/:eventId/reminders/reschedule", async (req, res) => {
  try {
    const event = {
      ...(req.body?.event || {}),
      eventId: req.params.eventId,
      userId: req.user.uid,
    };
    const count = await rescheduleEventReminders(req.user.uid, event);
    res.json({ success: true, scheduled: count });
  } catch (error) {
    console.error("Reminder reschedule failed:", error);
    res.status(500).json({ success: false, message: "Event reminders could not be rescheduled." });
  }
});

router.delete("/events/:eventId/reminders", async (req, res) => {
  try {
    const count = await cancelEventReminders(req.user.uid, req.params.eventId);
    res.json({ success: true, cancelled: count });
  } catch (error) {
    console.error("Reminder cancellation failed:", error);
    res.status(500).json({ success: false, message: "Event reminders could not be cancelled." });
  }
});

export default router;
