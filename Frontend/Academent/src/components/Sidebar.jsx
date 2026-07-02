import { useEffect, useState } from 'react';
import logo from '../assets/Logo/Logo.png';

/**
 * Sidebar component represents the navigation drawer and user profile status panel.
 * Used on dashboard/account management pages.
 * 
 * @param {string} activeTab - Currently active navigation tab ID.
 * @param {function} onTabChange - Callback when switching tabs.
 * @param {boolean} isMobileMenuOpen - Mobile viewport visibility state.
 * @param {function} onMobileMenuClose - Mobile overlay close handler.
 * @param {object} currentUser - Logged in user auth details from Firebase.
 * @param {object} profile - Loaded student profile data from Firestore.
 * @param {function} onLogout - Action to log out.
 * @param {function} onNewNote - Callback to trigger a new study session / note creation.
 * @param {array} [items] - Optional list of navigation items overrides.
 */
function Sidebar({
  activeTab,
  onTabChange,
  isMobileMenuOpen,
  onMobileMenuClose,
  currentUser,
  profile,
  onLogout,
  onNewNote,
  items
}) {
  const defaultItems = [
    { id: 'home', label: 'Dashboard', icon: 'dashboard' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: 'psychology' },
    { id: 'study-planner', label: 'Study Planner', icon: 'calendar_today' },
    { id: 'my-notes', label: 'My Notes', icon: 'description' },
    { id: 'flashcards', label: 'Flashcards', icon: 'style' },
    { id: 'quiz-generator', label: 'Quiz Generator', icon: 'quiz' },
    { id: 'analytics', label: 'Analytics', icon: 'leaderboard' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const sidebarItems = items || defaultItems;

  const fullName = profile?.fullName || currentUser?.displayName || "Student";
  const photoURL = currentUser?.photoURL || profile?.photoURL || "";
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(photoURL) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [photoURL]);
  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col p-md z-50 transition-transform duration-300 ${
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Logo and Premium Access */}
      <div className="mb-xxl flex items-center gap-sm px-sm mt-sm">
        <div className="w-15 h-15 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
          <img alt="Academent AI Logo" className="w-20 object-contain" src={logo} />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-headline-md text-lg font-black text-primary leading-none truncate">Academent AI</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70 mt-[2px]">Premium Access</p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-sm overflow-y-auto custom-scrollbar pr-xs">
        {sidebarItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              if (onMobileMenuClose) onMobileMenuClose();
            }}
            className={`w-full flex items-center gap-md p-md rounded-xl transition-all ${
              activeTab === item.id
                ? 'bg-primary-fixed/30 text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile and Sign Out at the Bottom */}
      <div className="mt-auto pt-md border-t border-outline-variant/20 mb-sm">
        <div className="flex items-center gap-md px-sm py-xs mb-md">
          {showPhoto ? (
            <img alt="Student Profile" className="w-9 h-9 rounded-full object-cover shrink-0" src={photoURL} onError={() => setImageFailed(true)} />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h5 className="font-label-md text-label-md font-bold text-on-surface truncate">{fullName}</h5>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70 truncate">{currentUser?.email}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-sm py-md mb-md rounded-xl border border-error/20 text-error hover:bg-error/5 transition-colors font-bold text-xs"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Sign Out</span>
        </button>

        <button 
          onClick={onNewNote}
          className="w-full ai-gradient text-white p-md rounded-xl font-label-md text-label-md flex items-center justify-center gap-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
          New Study Session
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

