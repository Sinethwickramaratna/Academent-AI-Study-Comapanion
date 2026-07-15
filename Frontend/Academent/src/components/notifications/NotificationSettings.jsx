import { DEFAULT_NOTIFICATION_PREFERENCES } from "../../Services/notificationTypes";
import useNotificationPreferences from "../../hooks/useNotificationPreferences";
import BrowserNotificationPermissionCard from "./BrowserNotificationPermissionCard";
import { useNotificationToasts } from "./NotificationToastProvider";
import "./notification-ui.css";

const toggles = [
  { key: "inAppEnabled", label: "In-app notifications" },
  { key: "quizNotifications", label: "Quiz generation notifications" },
  { key: "flashcardNotifications", label: "Flashcard generation notifications" },
  { key: "pdfUploadNotifications", label: "PDF upload notifications" },
  { key: "examReminders", label: "Exam reminders" },
  { key: "assignmentReminders", label: "Assignment reminders" },
  { key: "taskReminders", label: "Task reminders" },
  { key: "studyPlanReminders", label: "Study-plan reminders" },
  { key: "multipleRemindersAllowed", label: "Allow multiple reminders" },
];

function NotificationSettings() {
  const { preferences, loading, saving, updatePreferences } = useNotificationPreferences();
  const { addToast } = useNotificationToasts();

  const patchPreferences = async (patch) => {
    try {
      await updatePreferences(patch);
      addToast({ type: "success", message: "Notification preferences saved." });
    } catch (error) {
      addToast({ type: "error", message: error.message || "Could not save notification preferences." });
    }
  };

  if (loading) {
    return (
      <section className="notification-settings">
        <h2>Notification Settings</h2>
        <div className="notification-skeleton"><span /><span /></div>
      </section>
    );
  }

  return (
    <section className="notification-settings">
      <div>
        <h2>Notification Settings</h2>
        <p>Choose which study activity and reminder notifications Academent should keep in your history.</p>
      </div>

      <BrowserNotificationPermissionCard />

      <div className="notification-settings-grid">
        {toggles.map((toggle) => (
          <label className="notification-settings-toggle" key={toggle.key}>
            <strong>{toggle.label}</strong>
            <input
              type="checkbox"
              checked={Boolean(preferences[toggle.key])}
              disabled={saving}
              onChange={(event) => patchPreferences({ [toggle.key]: event.target.checked })}
            />
            <i className="notification-switch" aria-hidden="true" />
          </label>
        ))}
      </div>

      <div className="notification-settings-grid">
        <label className="notification-settings-field">
          <span>Default reminder value</span>
          <input
            min="0"
            type="number"
            value={preferences.defaultReminder?.value ?? DEFAULT_NOTIFICATION_PREFERENCES.defaultReminder.value}
            onChange={(event) => patchPreferences({
              defaultReminder: {
                ...preferences.defaultReminder,
                value: Number(event.target.value),
              },
            })}
          />
        </label>
        <label className="notification-settings-field">
          <span>Default reminder unit</span>
          <select
            value={preferences.defaultReminder?.unit || "minutes"}
            onChange={(event) => patchPreferences({
              defaultReminder: {
                ...preferences.defaultReminder,
                unit: event.target.value,
              },
            })}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </label>
        <label className="notification-settings-field">
          <span>User timezone</span>
          <input value={preferences.timezone || "UTC"} onChange={(event) => patchPreferences({ timezone: event.target.value })} />
        </label>
        <label className="notification-settings-toggle">
          <strong>Quiet hours</strong>
          <input
            type="checkbox"
            checked={Boolean(preferences.quietHours?.enabled)}
            onChange={(event) => patchPreferences({
              quietHours: { ...preferences.quietHours, enabled: event.target.checked },
            })}
          />
          <i className="notification-switch" aria-hidden="true" />
        </label>
        <label className="notification-settings-field">
          <span>Quiet hours start</span>
          <input
            type="time"
            value={preferences.quietHours?.start || "22:00"}
            onChange={(event) => patchPreferences({ quietHours: { ...preferences.quietHours, start: event.target.value } })}
          />
        </label>
        <label className="notification-settings-field">
          <span>Quiet hours end</span>
          <input
            type="time"
            value={preferences.quietHours?.end || "07:00"}
            onChange={(event) => patchPreferences({ quietHours: { ...preferences.quietHours, end: event.target.value } })}
          />
        </label>
      </div>
    </section>
  );
}

export default NotificationSettings;

