import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormSelect from "../components/FormSelect";
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

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
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

const percentageOf = (value, total) => {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
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
  const notificationStats = useMemo(() => {
    const total = notifications.length;
    const read = notifications.filter((notification) => notification.isRead).length;
    const reminders = notifications.filter((notification) => notification.category === "reminder").length;
    const system = notifications.filter((notification) => notification.category === "system").length;

    return [
      { label: "Unread", value: unreadCount, icon: "mark_email_unread", detail: `${percentageOf(unreadCount, total)} of inbox` },
      { label: "Read", value: read, icon: "drafts", detail: `${percentageOf(read, total)} completed` },
      { label: "Reminders", value: reminders, icon: "event_available", detail: `${percentageOf(reminders, total)} scheduled` },
      { label: "System", value: system, icon: "settings_suggest", detail: `${percentageOf(system, total)} updates` },
    ];
  }, [notifications, unreadCount]);

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
        <div className="notifications-page__hero-copy">
          <span className="notifications-page__kicker">
            <span className="material-symbols-outlined" aria-hidden="true">notifications_active</span>
            Activity inbox
          </span>
          <h1>Notifications</h1>
          <p>Review study updates, scheduled reminders, and system alerts without losing your place.</p>
        </div>
        <aside className="notifications-page__summary">
          <span className="material-symbols-outlined">notifications_active</span>
          <div>
            <strong>{unreadCount}</strong>
            <p>Unread notifications</p>
          </div>
        </aside>
      </section>

      <section className="notifications-page__stats" aria-label="Notification summary">
        {notificationStats.map((stat) => (
          <article className="notifications-stat-card" key={stat.label}>
            <span className="material-symbols-outlined" aria-hidden="true">{stat.icon}</span>
            <div>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
              <small>{stat.detail}</small>
            </div>
          </article>
        ))}
      </section>

      {isOffline && (
        <div className="notifications-page__offline">
          <span className="material-symbols-outlined">wifi_off</span>
          You are offline. Recent changes will refresh when your connection returns.
        </div>
      )}

      <section className="notifications-page__toolbar">
        <div className="notifications-toolbar-header">
          <div>
            <span className="notifications-page__section-kicker">Find and refine</span>
            <h2>Notification history</h2>
          </div>
          <span>{filteredNotifications.length} result{filteredNotifications.length === 1 ? "" : "s"}</span>
        </div>
        <div className="notifications-toolbar-body">
          <label className="notifications-search">
            <span className="material-symbols-outlined">search</span>
            <input value={search} type="search" placeholder="Search notifications" onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </label>
          <div className="notifications-filter-grid">
            <FormSelect id="notifications-category-filter" label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} containerClassName="notifications-filter-field" className="notifications-select-control" options={categoryOptions} />
            <FormSelect id="notifications-status-filter" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} containerClassName="notifications-filter-field" className="notifications-select-control" options={statusOptions} />
            <FormSelect id="notifications-date-filter" label="Date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} containerClassName="notifications-filter-field" className="notifications-select-control" options={dateOptions} />
            <FormSelect id="notifications-sort-filter" label="Sort" value={sort} onChange={(event) => setSort(event.target.value)} containerClassName="notifications-filter-field" className="notifications-select-control" options={sortOptions} />
          </div>
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
        <header className="notifications-page__panel-header">
          <div>
            <span className="notifications-page__section-kicker">Inbox</span>
            <h2>Latest updates</h2>
          </div>
          <span>{selectedIds.length ? `${selectedIds.length} selected` : `${pagedNotifications.length} shown`}</span>
        </header>
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

