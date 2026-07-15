import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications";
import {
  deleteNotification,
  disableNotificationCategory,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../Services/notificationService";
import NotificationEmptyState from "./NotificationEmptyState";
import NotificationFilters from "./NotificationFilters";
import NotificationList from "./NotificationList";
import NotificationSkeleton from "./NotificationSkeleton";
import { useNotificationToasts } from "./NotificationToastProvider";
import "./notification-ui.css";

const matchesFilter = (notification, filter) => {
  if (filter === "unread") return !notification.isRead;
  if (filter === "reminder") return notification.category === "reminder";
  if (filter === "activity") return notification.category === "activity";
  return true;
};

function NotificationDropdown({ unreadCount = 0, onClose }) {
  const navigate = useNavigate();
  const { addToast } = useNotificationToasts();
  const { uid, notifications, loading, error } = useNotifications({ maxItems: 20 });
  const [filter, setFilter] = useState("all");
  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => matchesFilter(notification, filter)),
    [filter, notifications],
  );

  const openNotification = async (notification) => {
    if (uid && !notification.isRead) await markNotificationAsRead(uid, notification.id, true);
    onClose?.();
    navigate(notification.actionUrl || "/notifications");
  };

  const handleMarkAllRead = async () => {
    if (!uid) return;
    const markedCount = await markAllNotificationsAsRead(uid);
    addToast({ type: "success", message: markedCount ? "Notifications marked as read." : "No unread notifications." });
  };

  const handleMarkRead = async (notification, isRead) => {
    if (!uid) return;
    await markNotificationAsRead(uid, notification.id, isRead);
    addToast({ type: "success", message: `Notification marked as ${isRead ? "read" : "unread"}.` });
  };

  const handleDelete = async (notification) => {
    if (!uid) return;
    await deleteNotification(uid, notification.id);
    addToast({ type: "success", message: "Notification deleted." });
  };

  const handleDisable = async (notification) => {
    if (!uid) return;
    await disableNotificationCategory(uid, notification.type);
    addToast({ type: "success", message: "Notification category disabled." });
  };

  return (
    <section className="notification-dropdown" aria-label="Notifications panel">
      <header className="notification-dropdown-header">
        <div>
          <h2>Notifications</h2>
          <p>{unreadCount ? `${unreadCount} unread` : "All caught up"}</p>
        </div>
        <button className="notification-text-button" type="button" onClick={handleMarkAllRead}>
          <span className="material-symbols-outlined">done_all</span>
          Mark all as read
        </button>
      </header>

      <NotificationFilters value={filter} onChange={setFilter} />

      <div className="notification-list-scroll">
        {error ? (
          <NotificationEmptyState title="Could not load notifications" message={error.message || "Check your connection and try again."} icon="cloud_off" />
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            loading={loading}
            renderSkeleton={() => <NotificationSkeleton count={4} />}
            onOpen={openNotification}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
            onDisableCategory={handleDisable}
          />
        )}
      </div>

      <footer className="notification-dropdown-footer">
        <button className="notification-page-button" type="button" onClick={() => { onClose?.(); navigate("/notifications"); }}>
          View all notifications
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </section>
  );
}

export default NotificationDropdown;

