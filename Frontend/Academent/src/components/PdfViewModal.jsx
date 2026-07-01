function PdfViewModal({ pdf, onClose }) {
  if (!pdf) return null;

  const pdfUrl = pdf.url?.includes('#') ? pdf.url : `${pdf.url}#toolbar=1&navpanes=0`;

  return (
    <div className="notes-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="notes-create-modal pdf-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-view-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="notes-create-modal__header">
          <div>
            <p className="notes-create-modal__eyebrow">PDF Viewer</p>
            <h3 id="pdf-view-modal-title">{pdf.title}</h3>
            <p>{pdf.url}</p>
          </div>
          <button className="notes-create-modal__close" type="button" onClick={onClose} aria-label="Close PDF viewer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="pdf-viewer-frame-wrap">
          <iframe title={pdf.title} src={pdfUrl} className="pdf-viewer-frame" />
        </div>

        <div className="notes-create-modal__actions note-viewer-actions">
          <button className="notes-create-modal__ghost" type="button" onClick={onClose}>Close</button>
          <a className="notes-create-modal__primary pdf-viewer-open-link" href={pdf.url} target="_blank" rel="noreferrer">
            <span className="material-symbols-outlined">open_in_new</span>
            Open Original
          </a>
        </div>
      </section>
    </div>
  );
}

export default PdfViewModal;