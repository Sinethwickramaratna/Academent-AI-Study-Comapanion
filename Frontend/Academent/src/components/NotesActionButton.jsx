function NotesActionButton({ icon = "create_new_folder", label, className = "notes-add-folder-btn", onClick }) {
  return (
    <button className={className} type="button" onClick={onClick}>
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </button>
  );
}

export default NotesActionButton;
