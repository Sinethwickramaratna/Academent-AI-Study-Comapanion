const ACCENT_OPTIONS = [
  { value: "cyan", label: "Cyan" },
  { value: "violet", label: "Violet" },
  { value: "emerald", label: "Emerald" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" },
];

function FolderCreateModal({ type, values, onChange, onClose, onSubmit }) {
  const copy = {
    semester: {
      title: "Create New Semester",
      subtitle: "Add a new semester folder to your notes archive.",
      eyebrow: "Semester Generator",
      submit: "Create Semester",
      titlePlaceholder: "Example: Semester 6",
      subtitlePlaceholder: "Example: Research vault",
    },
    module: {
      title: "Create New Module",
      subtitle: "Add a module folder to this semester vault.",
      eyebrow: "Module Generator",
      submit: "Create Module",
      titlePlaceholder: "Example: Machine Learning",
      subtitlePlaceholder: "Example: Neural workspace",
    },
    folder: {
      title: "Create Note Folder",
      subtitle: "Group notes inside this module workspace.",
      eyebrow: "Folder Generator",
      submit: "Create Folder",
      titlePlaceholder: "Example: Lecture Notes",
      subtitlePlaceholder: "Example: Week 1 to Week 4",
    },
  }[type];

  const isModule = type === "module";

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
            <h3 id="notes-create-modal-title">{copy.title}</h3>
            <p>{copy.subtitle}</p>
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
              value={values.subtitle}
              onChange={(event) => onChange("subtitle", event.target.value)}
              placeholder={copy.subtitlePlaceholder}
              required
            />
          </label>

          <fieldset className="notes-accent-picker">
            <legend>Accent Color</legend>
            <div className="notes-accent-picker__options">
              {ACCENT_OPTIONS.map((accent) => (
                <label key={accent.value} className={`notes-accent-choice notes-accent-choice--${accent.value}`}>
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
            </div>
          </fieldset>

          <div className="notes-create-modal__actions">
            <button className="notes-create-modal__ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="notes-create-modal__primary" type="submit">
              <span className="material-symbols-outlined">create_new_folder</span>
              {copy.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default FolderCreateModal;
