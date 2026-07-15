import "./notification-ui.css";

const defaultFilters = [
  { value: "all", label: "All", icon: "select_all" },
  { value: "unread", label: "Unread", icon: "mark_email_unread" },
  { value: "reminder", label: "Reminders", icon: "notifications_active" },
  { value: "activity", label: "Activity", icon: "bolt" },
];

function NotificationFilters({ value = "all", onChange, filters = defaultFilters }) {
  return (
    <div className="notification-tabs" role="tablist" aria-label="Notification filters">
      {filters.map((filter) => (
        <button
          key={filter.value}
          className={`notification-filter-button ${value === filter.value ? "is-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={value === filter.value}
          onClick={() => onChange?.(filter.value)}
        >
          <span className="material-symbols-outlined">{filter.icon}</span>
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default NotificationFilters;

