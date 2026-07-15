import { useMemo, useState } from "react";
import {
  REMINDER_OPTIONS,
  describeReminders,
  normalizeReminderInput,
  reminderLabel,
} from "../../Services/reminderService";
import CustomReminderModal from "./CustomReminderModal";
import "./notification-ui.css";

function ReminderSelector({ eventData, reminders = [], onChange, multiple = true }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [error, setError] = useState("");
  const selectedIds = useMemo(() => new Set(reminders.map((reminder) => reminder.id)), [reminders]);

  const commit = (nextReminders) => {
    setError("");
    onChange?.(nextReminders);
  };

  const toggleReminder = (option) => {
    try {
      const normalized = normalizeReminderInput(option, eventData);
      if (selectedIds.has(normalized.id)) {
        commit(reminders.filter((reminder) => reminder.id !== normalized.id));
        return;
      }
      commit(multiple ? [...reminders, normalized] : [normalized]);
    } catch (validationError) {
      setError(validationError.message || "Choose a valid event time before adding reminders.");
    }
  };

  const addCustomReminder = (reminder) => {
    commit(multiple ? [...reminders.filter((item) => item.id !== reminder.id), reminder] : [reminder]);
    setCustomOpen(false);
  };

  return (
    <section className="reminder-selector wide">
      <div>
        <strong>Reminder times</strong>
        <p>{describeReminders(reminders)}</p>
      </div>
      <div className="reminder-options-grid">
        {REMINDER_OPTIONS.map((option) => (
            <button
              className={`reminder-option ${selectedIds.has(option.id) ? "is-selected" : ""}`}
              type="button"
              key={option.id}
              onClick={() => toggleReminder(option)}
            >
              <span className="material-symbols-outlined">{option.icon}</span>
              {option.label}
            </button>
          ))}
        <button className="reminder-option" type="button" onClick={() => setCustomOpen(true)}>
          <span className="material-symbols-outlined">edit_calendar</span>
          Custom date and time
        </button>
      </div>
      {reminders.length > 0 && (
        <div className="reminder-selected-list">
          {reminders.map((reminder) => (
            <span className="reminder-selected-chip" key={reminder.id}>
              {reminderLabel(reminder)}
              <button type="button" aria-label={`Remove ${reminderLabel(reminder)}`} onClick={() => commit(reminders.filter((item) => item.id !== reminder.id))}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="reminder-error">{error}</p>}
      {customOpen && <CustomReminderModal eventData={eventData} onCancel={() => setCustomOpen(false)} onAdd={addCustomReminder} />}
    </section>
  );
}

export default ReminderSelector;

