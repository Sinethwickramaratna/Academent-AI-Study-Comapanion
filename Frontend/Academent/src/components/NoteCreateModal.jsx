function NoteCreateModal({ values, onChange, onClose, onSubmit }) {
  return (
    <div className="notes-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="notes-create-modal notes-create-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-create-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notes-create-modal__header">
          <div>
            <p className="notes-create-modal__eyebrow">Note Composer</p>
            <h3 id="note-create-modal-title">Create New Note</h3>
            <p>Add a note directly into this module workspace.</p>
          </div>
          <button className="notes-create-modal__close" type="button" onClick={onClose} aria-label="Close window">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="notes-create-form" onSubmit={onSubmit}>
          <label className="notes-create-field">
            <span>Note Title</span>
            <input
              type="text"
              value={values.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="Example: Lecture 01 Summary"
              required
            />
          </label>

          <label className="notes-create-field">
            <span>Note Content</span>
            <textarea
              value={values.content}
              onChange={(event) => onChange("content", event.target.value)}
              placeholder="Write the key points, formulas, questions, or reminders..."
              required
            />
          </label>

          <div className="notes-create-modal__actions">
            <button className="notes-create-modal__ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="notes-create-modal__primary" type="submit">
              <span className="material-symbols-outlined">note_add</span>
              Create Note
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default NoteCreateModal;
