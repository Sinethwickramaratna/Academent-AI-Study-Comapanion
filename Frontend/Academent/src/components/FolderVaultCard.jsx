const PRESET_ACCENTS = new Set(["cyan", "violet", "emerald", "amber", "rose"]);
const isCustomColor = (accent) => /^#[0-9a-f]{6}$/i.test(accent || "");

function FolderVaultCard({ folder, kicker, onClick, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);
  const accent = folder.accent || "cyan";
  const customAccent = isCustomColor(accent);
  const accentClass = PRESET_ACCENTS.has(accent) ? `folder-vault-card--${accent}` : "folder-vault-card--cyan";
  const accentStyle = customAccent
    ? {
        "--folder-accent": accent,
        "--folder-accent-soft": `color-mix(in srgb, ${accent} 16%, transparent)`,
      }
    : undefined;

  const handleKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={`folder-vault-card ${accentClass}`}
      style={accentStyle}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${folder.title}` : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="folder-card-scanline" aria-hidden="true" />
      <span className="folder-card-glow" aria-hidden="true" />

      {hasActions && (
        <div className="folder-card-menu" onClick={(event) => event.stopPropagation()}>
          <button className="folder-card-menu__trigger" type="button" aria-label={`Actions for ${folder.title}`}>
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
          <div className="folder-card-menu__content">
            {onEdit && (
              <button type="button" onClick={onEdit}>
                <span className="material-symbols-outlined">edit</span>
                Edit
              </button>
            )}
            {onDelete && (
              <button className="folder-card-menu__danger" type="button" onClick={onDelete}>
                <span className="material-symbols-outlined">delete</span>
                Remove
              </button>
            )}
          </div>
        </div>
      )}

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
    </article>
  );
}

export default FolderVaultCard;