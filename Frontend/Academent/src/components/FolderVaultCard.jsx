function FolderVaultCard({ folder, kicker, onClick }) {
  return (
    <button
      className={`folder-vault-card folder-vault-card--${folder.accent}`}
      type="button"
      aria-label={`Open ${folder.title}`}
      onClick={onClick}
    >
      <span className="folder-card-scanline" aria-hidden="true" />
      <span className="folder-card-glow" aria-hidden="true" />

      <span className="folder-visual" aria-hidden="true">
        <span className="folder-tab" />
        <span className="folder-body">
          <span className="folder-grid" />
          <span className="folder-icon material-symbols-outlined">{folder.icon}</span>
        </span>
      </span>

      <span className="folder-card-content">
        <span className="folder-card-kicker">{kicker}</span>
        <span className="folder-card-title">{folder.title}</span>
        <span className="folder-card-subtitle">{folder.subtitle}</span>
      </span>

      <span className="folder-card-footer">
        <span className="folder-file-count">
          <span className="material-symbols-outlined">description</span>
          {folder.files} files
        </span>
        <span className="folder-open-icon material-symbols-outlined">arrow_forward</span>
      </span>

      <span className="folder-progress-track" aria-hidden="true">
        <span className="folder-progress-fill" style={{ width: `${folder.progress}%` }} />
      </span>
    </button>
  );
}

export default FolderVaultCard;
