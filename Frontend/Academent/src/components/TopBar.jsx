import { useState } from 'react';
import NotificationBell from './notifications/NotificationBell';
import './TopBar.css';

function TopBar({
  fullName,
  photoURL,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchClear,
  onSearchSubmit,
}) {
  const [failedPhotoURL, setFailedPhotoURL] = useState('');
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const showPhoto = Boolean(photoURL) && failedPhotoURL !== photoURL;
  const isSearchControlled = searchValue !== undefined;
  const currentSearchValue = isSearchControlled ? searchValue : internalSearchValue;


  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    if (!isSearchControlled) setInternalSearchValue(nextValue);
    onSearchChange?.(nextValue);
  };

  const clearSearch = () => {
    if (!isSearchControlled) setInternalSearchValue('');
    onSearchChange?.('');
    onSearchClear?.();
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onSearchSubmit?.(currentSearchValue.trim());
  };

  return (
    <header className="app-topbar flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-md">
      <form className="app-topbar__search relative flex-1 max-w-md" role="search" onSubmit={handleSearchSubmit}>
        <span className="app-topbar__search-icon material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          aria-label={searchPlaceholder || 'Search'}
          className="app-topbar__search-input w-full pl-xxl pr-xxl py-md bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md"
          placeholder={searchPlaceholder}
          type="search"
          value={currentSearchValue}
          onChange={handleSearchChange}
        />
        {currentSearchValue && (
          <button
            aria-label="Clear search"
            className="app-topbar__clear-button absolute right-sm top-1/2 -translate-y-1/2 p-xs rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center"
            type="button"
            onClick={clearSearch}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </form>
      <div className="app-topbar__actions flex items-center justify-between sm:justify-end gap-md">

        <NotificationBell />

        <div className="app-topbar__profile flex items-center gap-md p-xs pl-md bg-surface-container-low rounded-full">
          <span className="app-topbar__profile-name font-label-md text-label-md text-primary font-bold">{fullName}</span>
          {showPhoto ? (
            <img alt="Student Profile" className="app-topbar__avatar w-8 h-8 rounded-full object-cover" src={photoURL} onError={() => setFailedPhotoURL(photoURL)} />
          ) : (
            <div className="app-topbar__avatar app-topbar__avatar--fallback w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;

