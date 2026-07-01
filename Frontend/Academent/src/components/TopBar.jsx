function TopBar({ fullName, photoURL, searchPlaceholder }) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-md">
      <div className="relative flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          className="w-full pl-xxl pr-md py-md bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md"
          placeholder={searchPlaceholder}
          type="text"
        />
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-md">
        <button className="p-md bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="flex items-center gap-md p-xs pl-md bg-surface-container-low rounded-full">
          <span className="font-label-md text-label-md text-primary font-bold">{fullName}</span>
          {photoURL ? (
            <img alt="Student Profile" className="w-8 h-8 rounded-full object-cover" src={photoURL} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
