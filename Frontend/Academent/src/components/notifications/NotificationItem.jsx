import { useState } from "react";
import { getNotificationMeta } from "../../Services/notificationTypes";
import { toNotificationDate } from "../../Services/notificationService";
import NotificationIcon from "./NotificationIcon";
import "./notification-ui.css";

const relativeTime = (value) => {
  const date = toNotificationDate(value);
  if (!date) return "Just now";
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function NotificationItem({
  notification,
  selectable = false,
  selected = false,
  onSelect,
  onOpen,
  onMarkRead,
  onDelete,
  onDisableCategory,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = getNotificationMeta(notification.type);

  const handleOpen = () => onOpen?.(notification);
  const handleSelect = (event) => {
    event.stopPropagation();
    onSelect?.(notification.id, event.target.checked);
  };

  return (
    <article className={`notification-item ${notification.isRead ? "" : "is-unread"} ${menuOpen ? "has-open-menu" : ""}`}>
      {selectable ? (
        <input aria-label={`Select ${notification.title}`} checked={selected} type="checkbox" onChange={handleSelect} />
      ) : (
        <NotificationIcon type={notification.type} />
      )}

      <button className="notification-item-main" type="button" onClick={handleOpen}>
        <span className="notification-item-title-row">
          <strong>{notification.title}</strong>
          <span className="notification-status-text">{meta.label}</span>
        </span>
        <p>{notification.message}</p>
        <span className="notification-item-meta">
          <span>{relativeTime(notification.createdAt)}</span>
          {notification.entityTitle && <span>{notification.entityTitle}</span>}
        </span>
        {notification.actionLabel && <span className="notification-action-button">{notification.actionLabel}</span>}
      </button>

      {!notification.isRead ? <span className="notification-dot" aria-label="Unread" /> : <span />}

      <div className="notification-more">
        <button
          className="notification-icon-button"
          type="button"
          aria-label={`More options for ${notification.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
        {menuOpen && (
          <div className="notification-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onMarkRead?.(notification, !notification.isRead); }}>
              <span className="material-symbols-outlined">{notification.isRead ? "mark_email_unread" : "drafts"}</span>
              Mark as {notification.isRead ? "unread" : "read"}
            </button>
            <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onDisableCategory?.(notification); }}>
              <span className="material-symbols-outlined">notifications_off</span>
              Disable this category
            </button>
            <button className="is-danger" type="button" role="menuitem" onClick={() => { setMenuOpen(false); onDelete?.(notification); }}>
              <span className="material-symbols-outlined">delete</span>
              Delete notification
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default NotificationItem;

