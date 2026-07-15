function NotesBreadcrumb({ items }) {
  return (
    <div className="flex flex-col gap-md mb-4">
      <nav className="notes-breadcrumb flex items-center gap-2 text-label-md">
        {items.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span
              className={`notes-breadcrumb__item ${item.active ? "text-primary font-bold" : "text-on-surface-variant"} ${!item.active && item.onClick ? "cursor-pointer" : ""}`}
              onClick={item.onClick}
            >
              {item.label}
            </span>
            {index < items.length - 1 && (
              <span className="material-symbols-outlined text-sm text-outline-variant">chevron_right</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}

export default NotesBreadcrumb;
