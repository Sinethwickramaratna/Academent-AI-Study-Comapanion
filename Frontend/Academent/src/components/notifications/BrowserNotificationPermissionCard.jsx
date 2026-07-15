import useBrowserNotifications from "../../hooks/useBrowserNotifications";
import { useNotificationToasts } from "./NotificationToastProvider";
import "./notification-ui.css";

function BrowserNotificationPermissionCard() {
  const {
    supported,
    permission,
    enabled,
    working,
    error,
    enableBrowserNotifications,
    disableBrowserNotifications,
  } = useBrowserNotifications();
  const { addToast } = useNotificationToasts();

  const handleEnable = async () => {
    try {
      await enableBrowserNotifications();
      addToast({ type: "success", message: "Browser notifications enabled." });
    } catch (enableError) {
      addToast({ type: "error", message: enableError.message || "Could not enable browser notifications." });
    }
  };

  const handleDisable = async () => {
    try {
      await disableBrowserNotifications();
      addToast({ type: "success", message: "Browser notifications disabled." });
    } catch (disableError) {
      addToast({ type: "error", message: disableError.message || "Could not disable browser notifications." });
    }
  };

  return (
    <section className="notification-permission-card">
      <div>
        <h3 className="notification-section-title">Browser Push Notifications</h3>
        <p>Academent can alert you when generation finishes or a scheduled reminder is due, even if the dashboard is not the active tab.</p>
      </div>
      <div className="notification-permission-actions">
        {!supported ? (
          <span className="notification-status-text notification-status-text--unsupported">Not supported in this browser</span>
        ) : enabled ? (
          <button className="notification-danger-button" type="button" disabled={working} onClick={handleDisable}>
            <span className="material-symbols-outlined">notifications_off</span>
            Disable browser notifications
          </button>
        ) : (
          <button className="notification-page-button" type="button" disabled={working || permission === "denied"} onClick={handleEnable}>
            <span className="material-symbols-outlined">notifications_active</span>
            {permission === "denied" ? "Permission blocked" : "Enable browser notifications"}
          </button>
        )}
        {permission !== "default" && (
          <span className={`notification-status-text notification-status-text--${permission}`}>
            Permission: {permission}
          </span>
        )}
      </div>
      {error && <p className="reminder-error">{error.message}</p>}
    </section>
  );
}

export default BrowserNotificationPermissionCard;

