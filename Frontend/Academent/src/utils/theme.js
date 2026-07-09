export const THEME_STORAGE_KEY = 'academent-theme-mode';

export const normalizeThemeMode = (mode) => {
  const normalized = String(mode || '').toLowerCase();
  if (normalized === 'dark') return 'Dark';
  if (normalized === 'system') return 'System';
  return 'Light';
};

export const getStoredThemeMode = () => {
  if (typeof window === 'undefined') return 'Light';
  return normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
};

export const storeThemeMode = (mode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, normalizeThemeMode(mode));
};

export const resolveThemeMode = (mode) => {
  const normalizedMode = normalizeThemeMode(mode);
  if (normalizedMode !== 'System') return normalizedMode;
  if (typeof window === 'undefined') return 'Light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
};

export const applyThemeMode = (mode) => {
  if (typeof document === 'undefined') return 'Light';

  const normalizedMode = normalizeThemeMode(mode);
  const resolvedMode = resolveThemeMode(normalizedMode);
  const root = document.documentElement;

  root.classList.toggle('dark', resolvedMode === 'Dark');
  root.dataset.theme = resolvedMode.toLowerCase();
  root.dataset.themeMode = normalizedMode.toLowerCase();

  return resolvedMode;
};
