import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "./notification-ui.css";

const NotificationToastContext = createContext({
  addToast: () => {},
  removeToast: () => {},
});

const makeToastId = () => globalThis.crypto?.randomUUID?.() || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function NotificationToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ type = "info", message, timeout = 3600 }) => {
    if (!message) return null;
    const id = makeToastId();
    setToasts((current) => [...current, { id, type, message }].slice(-4));
    if (timeout) window.setTimeout(() => removeToast(id), timeout);
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <NotificationToastContext.Provider value={value}>
      {children}
      <div className="notification-toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`notification-toast ${toast.type}`} key={toast.id}>
            <span className="material-symbols-outlined">
              {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </NotificationToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotificationToasts = () => useContext(NotificationToastContext);

export default NotificationToastProvider;

