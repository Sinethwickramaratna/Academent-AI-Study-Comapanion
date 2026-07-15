import "./notification-ui.css";

function NotificationEmptyState({
  title = "You're all caught up.",
  message = "New reminders and activity updates will appear here.",
  icon = "notifications_active",
}) {
  return (
    <div className="notification-empty-state">
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default NotificationEmptyState;

