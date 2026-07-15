import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  REMINDER_OPTIONS,
  describeReminders,
  isEndTimeReminder,
  makeReminderId,
  normalizeReminderInput,
  reminderLabel,
} from "../../Services/reminderService";
import CustomReminderModal from "./CustomReminderModal";
import "./notification-ui.css";

const reminderIdentityKeys = (reminder = {}) => [
  reminder.id,
  makeReminderId({ value: reminder.value, unit: reminder.unit, isCustom: reminder.isCustom, remindAt: reminder.remindAt }),
  `${Number(reminder.value || 0)}-${reminder.unit || "minutes"}`,
].filter(Boolean);

const isLockedReminder = (reminder = {}) => isEndTimeReminder(reminder) && reminder.isSystem;

function ReminderSelector({ eventData, reminders = [], onChange, multiple = true }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef(null);
  const dropdownId = useId();
  const triggerId = `${dropdownId}-trigger`;
  const menuId = `${dropdownId}-menu`;
  const selectedIds = useMemo(() => new Set(reminders.flatMap(reminderIdentityKeys)), [reminders]);
  const lockedIds = useMemo(() => new Set(reminders.filter(isLockedReminder).flatMap(reminderIdentityKeys)), [reminders]);
  const reminderOptions = useMemo(
    () => REMINDER_OPTIONS.filter((option) => eventData?.type === "studyPlan" || !isEndTimeReminder(option)),
    [eventData?.type],
  );

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const commit = (nextReminders) => {
    setError("");
    onChange?.(nextReminders);
  };

  const toggleReminder = (option) => {
    try {
      const normalized = normalizeReminderInput(option, eventData);
      if (selectedIds.has(normalized.id)) {
        if (lockedIds.has(normalized.id)) return true;
        commit(reminders.filter((reminder) => !reminderIdentityKeys(reminder).includes(normalized.id)));
        return true;
      }
      commit(multiple ? [...reminders, normalized] : [normalized]);
      return true;
    } catch (validationError) {
      setError(validationError.message || "Choose a valid event time before adding reminders.");
      return false;
    }
  };

  const selectReminder = (option) => {
    const didSelect = toggleReminder(option);
    if (didSelect && !multiple) setMenuOpen(false);
  };

  const addCustomReminder = (reminder) => {
    commit(multiple ? [...reminders.filter((item) => item.id !== reminder.id), reminder] : [reminder]);
    setCustomOpen(false);
  };

  return (
    <section className="reminder-selector wide">
      <div>
        <strong>Reminder times</strong>
        {/*<p>{describeReminders(reminders)}</p>*/}
      </div>
      <div className={`reminder-dropdown ${menuOpen ? "is-open" : ""}`} ref={dropdownRef}>
        <button
          id={triggerId}
          className="reminder-dropdown-trigger"
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span className="reminder-dropdown-trigger-copy">
            <span>Choose reminder time</span>
            <strong>{reminders.length ? describeReminders(reminders) : "Select an option"}</strong>
          </span>
          <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
        </button>
        {menuOpen && (
          <div className="reminder-dropdown-menu" id={menuId} role="menu" aria-labelledby={triggerId}>
            {reminderOptions.map((option) => {
              const selected = selectedIds.has(option.id);
              return (
                <button
                  className={`reminder-option ${selected ? "is-selected" : ""}`}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={selected}
                  key={option.id}
                  onClick={() => selectReminder(option)}
                >
                  <span className="material-symbols-outlined">{option.icon}</span>
                  <span className="reminder-option-label">{option.label}</span>
                  {selected && <span className="material-symbols-outlined reminder-option-check" aria-hidden="true">check</span>}
                </button>
              );
            })}
            <button
              className="reminder-option"
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setCustomOpen(true);
              }}
            >
              <span className="material-symbols-outlined">edit_calendar</span>
              <span className="reminder-option-label">Custom date and time</span>
            </button>
          </div>
        )}
      </div>
      {reminders.length > 0 && (
        <div className="reminder-selected-list">
          {reminders.map((reminder) => (
            <span className="reminder-selected-chip" key={reminder.id}>
              {reminderLabel(reminder)}
              {!isLockedReminder(reminder) && (
                <button type="button" aria-label={`Remove ${reminderLabel(reminder)}`} onClick={() => commit(reminders.filter((item) => item.id !== reminder.id))}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
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
