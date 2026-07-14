import { useState } from 'react';

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
    <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-md">
      <form className="relative flex-1 max-w-md" role="search" onSubmit={handleSearchSubmit}>
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
        <input
          aria-label={searchPlaceholder || 'Search'}
          className="w-full pl-xxl pr-xxl py-md bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-body-md text-body-md"
          placeholder={searchPlaceholder}
          type="search"
          value={currentSearchValue}
          onChange={handleSearchChange}
        />
        {currentSearchValue && (
          <button
            aria-label="Clear search"
            className="absolute right-sm top-1/2 -translate-y-1/2 p-xs rounded-lg text-outline hover:text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center"
            type="button"
            onClick={clearSearch}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </form>
      <div className="flex items-center justify-between sm:justify-end gap-md">
        <button className="p-md bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center" type="button">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="flex items-center gap-md p-xs pl-md bg-surface-container-low rounded-full">
          <span className="font-label-md text-label-md text-primary font-bold">{fullName}</span>
          {showPhoto ? (
            <img alt="Student Profile" className="w-8 h-8 rounded-full object-cover" src={photoURL} onError={() => setFailedPhotoURL(photoURL)} />
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

