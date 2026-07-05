export const dashboardWindowItems = [
  { id: 'home', label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { id: 'my-notes', label: 'My Notes', icon: 'description', route: '/my-notes' },
  { id: 'ai-tutor', label: 'AI Tutor', icon: 'psychology', route: '/ai-tutor' },
  { id: 'quiz-generator', label: 'Quiz Generator', icon: 'quiz', route: '/quiz-generator' },
  { id: 'flashcards', label: 'Flashcards', icon: 'style', route: '/flashcards' },
  { id: 'study-planner', label: 'Study Planner', icon: 'calendar_today', route: '/study-planner' },
  { id: 'analytics', label: 'Analytics', icon: 'leaderboard', route: '/analytics' },
  { id: 'profile', label: 'Profile', icon: 'account_circle', route: '/profile' },
];

export const dashboardRouteByTab = dashboardWindowItems.reduce((routes, item) => ({
  ...routes,
  [item.id]: item.route,
}), {});

export const dashboardTabByRoute = dashboardWindowItems.reduce((tabs, item) => ({
  ...tabs,
  [item.route]: item.id,
}), {});

export const getDashboardRouteForTab = (tabId) => dashboardRouteByTab[tabId] || dashboardRouteByTab.home;

export const getDashboardTabForPath = (pathname) => dashboardTabByRoute[pathname] || null;
