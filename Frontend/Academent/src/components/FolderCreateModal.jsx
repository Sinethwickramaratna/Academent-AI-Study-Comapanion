const ACCENT_OPTIONS = [
  { value: "cyan", label: "Cyan", color: "#12c4c4" },
  { value: "violet", label: "Violet", color: "#7c4dff" },
  { value: "emerald", label: "Emerald", color: "#24b47e" },
  { value: "amber", label: "Amber", color: "#f2a51a" },
  { value: "rose", label: "Rose", color: "#e15b8f" },
];

const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(value || "");

function FolderCreateModal({ type, values, onChange, onClose, onSubmit, mode = "create" }) {
  const copy = {
    semester: {
      title: "Create New Semester",
      editTitle: "Edit Semester",
      subtitle: "Add a new semester folder to your notes archive.",
      editSubtitle: "Update this semester folder details.",
      eyebrow: "Semester Generator",
      submit: "Create Semester",
      editSubmit: "Save Semester",
      titlePlaceholder: "Example: Semester 6",
      subtitlePlaceholder: "Example: Research vault",
    },
    module: {
      title: "Create New Module",
      editTitle: "Edit Module",
      subtitle: "Add a module folder to this semester vault.",
      editSubtitle: "Update this module folder details.",
      eyebrow: "Module Generator",
      submit: "Create Module",
      editSubmit: "Save Module",
      titlePlaceholder: "Example: Machine Learning",
      subtitlePlaceholder: "Example: Neural workspace",
    },
    folder: {
      title: "Create Note Folder",
      editTitle: "Edit Folder",
      subtitle: "Group notes inside this workspace.",
      editSubtitle: "Update this folder title, subtitle, or accent.",
      eyebrow: "Folder Generator",
      submit: "Create Folder",
      editSubmit: "Save Folder",
      titlePlaceholder: "Example: Lecture Notes",
      subtitlePlaceholder: "Example: Week 1 to Week 4",
    },
  }[type];

  const isModule = type === "module";
  const isEdit = mode === "edit";
  const selectedPreset = ACCENT_OPTIONS.some((accent) => accent.value === values.accent);
  const customAccent = isHexColor(values.accent) ? values.accent : "#12c4c4";

  return (
    <div className="notes-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="notes-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-create-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notes-create-modal__header">
          <div>
            <p className="notes-create-modal__eyebrow">{copy.eyebrow}</p>
            <h3 id="notes-create-modal-title">{isEdit ? copy.editTitle : copy.title}</h3>
            <p>{isEdit ? copy.editSubtitle : copy.subtitle}</p>
          </div>
          <button className="notes-create-modal__close" type="button" onClick={onClose} aria-label="Close window">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="notes-create-form" onSubmit={onSubmit}>
          {isModule && (
            <label className="notes-create-field">
              <span>Module ID</span>
              <input
                type="text"
                value={values.moduleId}
                onChange={(event) => onChange("moduleId", event.target.value)}
                placeholder="Example: CS501"
                disabled={isEdit}
                required
              />
            </label>
          )}

          <label className="notes-create-field">
            <span>Title</span>
            <input
              type="text"
              value={values.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder={copy.titlePlaceholder}
              required
            />
          </label>

          <label className="notes-create-field">
            <span>Subtitle</span>
            <input
              type="text"
              value={values.subtitle || ""}
              onChange={(event) => onChange("subtitle", event.target.value)}
              placeholder={copy.subtitlePlaceholder}
              />
          </label>

          <fieldset className="notes-accent-picker">
            <legend>Accent Color</legend>
            <div className="notes-accent-picker__options">
              {ACCENT_OPTIONS.map((accent) => (
                <label key={accent.value} className="notes-accent-choice" style={{ "--choice-accent": accent.color }}>
                  <input
                    type="radio"
                    name="accent"
                    value={accent.value}
                    checked={values.accent === accent.value}
                    onChange={(event) => onChange("accent", event.target.value)}
                  />
                  <span className="notes-accent-choice__swatch" />
                  <span>{accent.label}</span>
                </label>
              ))}
              <label className="notes-accent-choice notes-accent-choice--custom" style={{ "--choice-accent": customAccent }}>
                <input
                  type="radio"
                  name="accent"
                  value={customAccent}
                  checked={!selectedPreset}
                  onChange={() => onChange("accent", customAccent)}
                />
                <span className="notes-accent-choice__custom-orb" aria-hidden="true" />
                <span className="notes-accent-choice__custom-copy">
                  <span>Custom Color</span>
                  <span>{customAccent.toUpperCase()}</span>
                </span>
                <span className="notes-accent-choice__custom-action">Pick</span>
                <input
                  className="notes-accent-choice__color"
                  type="color"
                  value={customAccent}
                  aria-label="Custom accent color"
                  onChange={(event) => onChange("accent", event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <div className="notes-create-modal__actions">
            <button className="notes-create-modal__ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="notes-create-modal__primary" type="submit">
              <span className="material-symbols-outlined">{isEdit ? "save" : "create_new_folder"}</span>
              {isEdit ? copy.editSubmit : copy.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default FolderCreateModal;


