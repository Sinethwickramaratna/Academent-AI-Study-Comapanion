function NoteViewModal({ note, onClose, onEdit }) {
  if (!note) return null;

  return (
    <div className="notes-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="notes-create-modal notes-create-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-view-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notes-create-modal__header">
          <div>
            <p className="notes-create-modal__eyebrow">Note Viewer</p>
            <h3 id="note-view-modal-title">{note.title}</h3>
            <p>Saved study note</p>
          </div>
          <button className="notes-create-modal__close" type="button" onClick={onClose} aria-label="Close note viewer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="note-viewer-body">
          <p>{note.content}</p>
        </div>

        <div className="notes-create-modal__actions note-viewer-actions">
          <button className="notes-create-modal__ghost" type="button" onClick={onClose}>Close</button>
          <button className="notes-create-modal__primary" type="button" onClick={() => onEdit(note)}>
            <span className="material-symbols-outlined">edit</span>
            Edit Note
          </button>
        </div>
      </section>
    </div>
  );
}

export default NoteViewModal;
