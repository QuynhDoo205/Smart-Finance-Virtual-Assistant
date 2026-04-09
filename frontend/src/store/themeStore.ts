import { useState, useEffect } from 'react';

export type AppTheme = 'cyberpunk' | 'light-tech' | 'matrix';

// Global state using module-level variable + subscriber pattern (no Zustand needed)
let currentTheme: AppTheme = (localStorage.getItem('app-theme') as AppTheme) || 'cyberpunk';
const subscribers = new Set<() => void>();

function notifyAll() {
  subscribers.forEach(fn => fn());
}

export function getTheme(): AppTheme {
  return currentTheme;
}

export function setTheme(theme: AppTheme) {
  currentTheme = theme;
  localStorage.setItem('app-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  notifyAll();
}

// Initialize on load
document.documentElement.setAttribute('data-theme', currentTheme);

export function useTheme(): [AppTheme, (t: AppTheme) => void] {
  const [theme, setLocalTheme] = useState<AppTheme>(currentTheme);

  useEffect(() => {
    const update = () => setLocalTheme(currentTheme);
    subscribers.add(update);
    return () => { subscribers.delete(update); };
  }, []);

  return [theme, setTheme];
}
