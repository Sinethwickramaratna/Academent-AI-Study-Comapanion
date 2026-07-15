import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationEmptyState from "../components/notifications/NotificationEmptyState";
import NotificationList from "../components/notifications/NotificationList";
import NotificationSkeleton from "../components/notifications/NotificationSkeleton";
import { useNotificationToasts } from "../components/notifications/NotificationToastProvider";
import useNotifications from "../hooks/useNotifications";
import useUnreadNotificationCount from "../hooks/useUnreadNotificationCount";
import {
  clearAllNotifications,
  deleteNotification,
  deleteNotifications,
  disableNotificationCategory,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  toNotificationDate,
} from "../Services/notificationService";
import "./notificationspage.css";

const PAGE_SIZE = 12;

const categoryOptions = [
  { value: "all", label: "All categories" },
  { value: "activity", label: "Activity" },
  { value: "reminder", label: "Reminders" },
  { value: "system", label: "System" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const dateOptions = [
  { value: "all", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
];

const dateMatches = (notification, dateFilter) => {
  if (dateFilter === "all") return true;
  const date = toNotificationDate(notification.createdAt);
  if (!date) return dateFilter === "today";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (dateFilter === "today") return date.getTime() >= startToday;
  if (dateFilter === "7days") return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  if (dateFilter === "30days") return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
  return true;
};

function NotificationsPage() {
  const navigate = useNavigate();
  const { addToast } = useNotificationToasts();
  const { uid, notifications, loading, error } = useNotifications({ maxItems: 100 });
  const { count: unreadCount } = useUnreadNotificationCount();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = notifications.filter((notification) => {
      if (category !== "all" && notification.category !== category) return false;
      if (status === "unread" && notification.isRead) return false;
      if (status === "read" && !notification.isRead) return false;
      if (!dateMatches(notification, dateFilter)) return false;
      if (!term) return true;
      return [
        notification.title,
        notification.message,
        notification.entityTitle,
        notification.type,
        notification.actionLabel,
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });

    return visible.sort((left, right) => {
      const leftTime = toNotificationDate(left.createdAt)?.getTime() || 0;
      const rightTime = toNotificationDate(right.createdAt)?.getTime() || 0;
      return sort === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [category, dateFilter, notifications, search, sort, status]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNotifications = filteredNotifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectNotification = (id, selected) => {
    setSelectedIds((current) => selected ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  };

  const openNotification = async (notification) => {
    if (uid && !notification.isRead) await markNotificationAsRead(uid, notification.id, true);
    navigate(notification.actionUrl || "/notifications");
  };

  const markSelectedRead = async () => {
    if (!uid || !selectedIds.length) return;
    await Promise.all(selectedIds.map((id) => markNotificationAsRead(uid, id, true)));
    setSelectedIds([]);
    addToast({ type: "success", message: "Selected notifications marked as read." });
  };

  const deleteSelected = async () => {
    if (!uid || !selectedIds.length) return;
    await deleteNotifications(uid, selectedIds);
    setSelectedIds([]);
    addToast({ type: "success", message: "Selected notifications deleted." });
  };

  const clearAll = async () => {
    if (!uid) return;
    const confirmed = window.confirm("Clear all notifications? This will remove them from your notification history.");
    if (!confirmed) return;
    const deletedCount = await clearAllNotifications(uid);
    setSelectedIds([]);
    addToast({ type: "success", message: `${deletedCount} notification${deletedCount === 1 ? "" : "s"} cleared.` });
  };

  const markAllRead = async () => {
    if (!uid) return;
    const markedCount = await markAllNotificationsAsRead(uid);
    addToast({ type: "success", message: markedCount ? "All notifications marked as read." : "No unread notifications." });
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
    <main className="notifications-page">
      <section className="notifications-page__hero">
        <div>
          <h1>Notifications</h1>
          <p>Search, filter, review, and manage your Academent activity updates and scheduled reminders.</p>
        </div>
        <aside className="notifications-page__summary">
          <span className="material-symbols-outlined">notifications_active</span>
          <div>
            <strong>{unreadCount}</strong>
            <p>Unread notifications</p>
          </div>
        </aside>
      </section>

      {isOffline && (
        <div className="notifications-page__offline">
          <span className="material-symbols-outlined">wifi_off</span>
          You are offline. Recent changes will refresh when your connection returns.
        </div>
      )}

      <section className="notifications-page__toolbar">
        <label className="notifications-search">
          <span className="material-symbols-outlined">search</span>
          <input value={search} type="search" placeholder="Search notifications" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <div className="notifications-filter-grid">
          <label>
            Category
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              {categoryOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              {statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Date
            <select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }}>
              {dateOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </section>

      <section className="notifications-page__bulkbar">
        <label className="notification-settings-toggle">
          <strong>{selectedIds.length ? `${selectedIds.length} selected` : "Select page"}</strong>
          <input
            type="checkbox"
            checked={pagedNotifications.length > 0 && pagedNotifications.every((notification) => selectedSet.has(notification.id))}
            onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...pagedNotifications.map((notification) => notification.id)])] : selectedIds.filter((id) => !pagedNotifications.some((notification) => notification.id === id)))}
          />
          <i className="notification-switch" aria-hidden="true" />
        </label>
        <div className="notifications-bulk-actions">
          <button className="notification-text-button" type="button" onClick={markAllRead}>
            <span className="material-symbols-outlined">done_all</span>
            Mark all read
          </button>
          <button className="notification-text-button" type="button" disabled={!selectedIds.length} onClick={markSelectedRead}>
            <span className="material-symbols-outlined">drafts</span>
            Mark selected read
          </button>
          <button className="notification-danger-button" type="button" disabled={!selectedIds.length} onClick={deleteSelected}>
            <span className="material-symbols-outlined">delete</span>
            Delete selected
          </button>
          <button className="notification-danger-button" type="button" onClick={clearAll}>
            <span className="material-symbols-outlined">delete_sweep</span>
            Clear all
          </button>
        </div>
      </section>

      <section className="notifications-page__panel">
        <div className="notifications-page__list">
          {error ? (
            <NotificationEmptyState title="Could not load notifications" message={error.message || "Check Firestore permissions and try again."} icon="error" />
          ) : (
            <NotificationList
              notifications={pagedNotifications}
              loading={loading}
              selectable
              selected={false}
              renderSkeleton={() => <NotificationSkeleton count={6} />}
              emptyState={<NotificationEmptyState title="No notifications found" message="Try a different search or filter." icon="search_off" />}
              onSelect={selectNotification}
              onOpen={openNotification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onDisableCategory={handleDisable}
              selectedIds={selectedSet}
            />
          )}
        </div>
        <footer className="notifications-page__pagination">
          <span>Page {currentPage} of {totalPages}</span>
          <div>
            <button className="notification-text-button" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <button className="notification-page-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default NotificationsPage;

