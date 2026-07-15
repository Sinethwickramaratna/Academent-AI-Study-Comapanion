import "./notification-ui.css";

function NotificationBadge({ count = 0 }) {
  if (!count) return null;
  return <span className="notification-badge" aria-label={`${count} unread notifications`}>{count > 99 ? "99+" : count}</span>;
}

export default NotificationBadge;

