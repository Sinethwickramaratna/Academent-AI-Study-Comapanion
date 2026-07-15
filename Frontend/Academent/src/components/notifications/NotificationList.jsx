import { toNotificationDate } from "../../Services/notificationService";
import NotificationEmptyState from "./NotificationEmptyState";
import NotificationItem from "./NotificationItem";
import "./notification-ui.css";

const startOfDay = (value = new Date()) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const groupLabel = (notification) => {
  const date = toNotificationDate(notification.createdAt);
  if (!date) return "Today";
  const today = startOfDay(new Date());
  const notificationDay = startOfDay(date);
  if (notificationDay === today) return "Today";
  if (notificationDay === today - 24 * 60 * 60 * 1000) return "Yesterday";
  return "Earlier";
};

function NotificationList({ notifications = [], loading = false, renderSkeleton, emptyState, selectedIds, ...itemProps }) {
  if (loading) return renderSkeleton?.() || null;
  if (!notifications.length) return emptyState || <NotificationEmptyState />;

  const groups = notifications.reduce((result, notification) => {
    const label = groupLabel(notification);
    return {
      ...result,
      [label]: [...(result[label] || []), notification],
    };
  }, {});

  return (
    <div>
      {["Today", "Yesterday", "Earlier"].filter((label) => groups[label]?.length).map((label) => (
        <section className="notification-group" key={label}>
          <h3 className="notification-group-title">{label}</h3>
          {groups[label].map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              {...itemProps}
              selected={Boolean(selectedIds?.has?.(notification.id))}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

export default NotificationList;
