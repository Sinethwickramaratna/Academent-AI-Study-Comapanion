import { useEffect, useRef, useState } from "react";
import useUnreadNotificationCount from "../../hooks/useUnreadNotificationCount";
import NotificationBadge from "./NotificationBadge";
import NotificationDropdown from "./NotificationDropdown";
import "./notification-ui.css";

function NotificationBell() {
  const { count } = useUnreadNotificationCount();
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const previousCountRef = useRef(count);
  const shellRef = useRef(null);

  useEffect(() => {
    if (count > previousCountRef.current) {
      setHasNew(true);
      const timer = window.setTimeout(() => setHasNew(false), 900);
      previousCountRef.current = count;
      return () => window.clearTimeout(timer);
    }
    previousCountRef.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="notification-shell" ref={shellRef}>
      <button
        className={`notification-bell-button ${open ? "is-open" : ""} ${count ? "has-unread" : ""} ${hasNew ? "has-new" : ""}`}
        type="button"
        aria-label={count ? `Open notifications, ${count} unread` : "Open notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="material-symbols-outlined">notifications</span>
        <NotificationBadge count={count} />
      </button>
      {open && <NotificationDropdown unreadCount={count} onClose={() => setOpen(false)} />}
    </div>
  );
}

export default NotificationBell;

