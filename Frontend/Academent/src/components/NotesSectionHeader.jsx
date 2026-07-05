function NotesSectionHeader({ title, description, action, backAction }) {
  return (
    <div className="notes-section-header mt-md flex flex-col lg:flex-row lg:items-end lg:justify-between gap-md">
      <div>
        {backAction}
        <h2 className={`font-headline-md text-lg font-bold text-on-surface ${backAction ? "mt-md" : ""}`}>{title}</h2>
        <p className="font-label-md text-label-md text-on-surface-variant mt-[2px]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default NotesSectionHeader;
