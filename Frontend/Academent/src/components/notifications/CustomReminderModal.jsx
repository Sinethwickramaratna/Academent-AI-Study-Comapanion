import { useState } from "react";
import { normalizeReminderInput } from "../../Services/reminderService";
import "./notification-ui.css";

const toDateTimeLocal = (date = new Date()) => {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
};

function CustomReminderModal({ eventData, onCancel, onAdd }) {
  const [value, setValue] = useState(() => toDateTimeLocal(new Date()));
  const [error, setError] = useState("");

  const addReminder = () => {
    try {
      const reminder = normalizeReminderInput({
        isCustom: true,
        unit: "custom",
        remindAt: new Date(value),
      }, eventData);
      onAdd(reminder);
    } catch (validationError) {
      setError(validationError.message || "Choose a valid custom reminder time.");
    }
  };

  return (
    <div className="planner-confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <section className="planner-confirm-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="planner-confirm-icon"><span className="material-symbols-outlined">edit_calendar</span></div>
        <div>
          <p className="planner-confirm-kicker">Custom reminder</p>
          <h2>Add reminder date and time</h2>
          <div className="reminder-custom-grid">
            <input type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
          {error && <p className="reminder-error">{error}</p>}
        </div>
        <div className="reminder-custom-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="notification-page-button" onClick={addReminder}>Add reminder</button>
        </div>
      </section>
    </div>
  );
}

export default CustomReminderModal;

