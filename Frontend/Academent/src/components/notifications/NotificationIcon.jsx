import { getNotificationMeta } from "../../Services/notificationTypes";
import "./notification-ui.css";

function NotificationIcon({ type }) {
  const meta = getNotificationMeta(type);
  return (
    <span className={`notification-icon notification-tone-${meta.tone}`} aria-hidden="true">
      <span className="material-symbols-outlined">{meta.icon}</span>
    </span>
  );
}

export default NotificationIcon;

