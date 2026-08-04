import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  /** True when the user has explicitly picked a theme (vs. following the OS). */
  isExplicit: boolean;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'chaintrack_theme';
const SYSTEM_QUERY = '(prefers-color-scheme: light)';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const readSavedTheme = (): { theme: Theme | null } => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return { theme: saved };
  } catch {
    // Ignore storage access errors (private mode etc.)
  }
  return { theme: null };
};

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia(SYSTEM_QUERY).matches ? 'light' : 'dark';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // First paint should never flash: resolve before render.
  const [theme, setTheme] = useState<Theme>(() => readSavedTheme().theme ?? systemTheme());
  const [isExplicit, setIsExplicit] = useState<boolean>(() => readSavedTheme().theme !== null);

  // Apply the theme attribute whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist only explicit user choices.
  useEffect(() => {
    if (!isExplicit) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme, isExplicit]);

  // Follow OS changes until the user makes an explicit choice.
  useEffect(() => {
    if (isExplicit) return;
    const mq = window.matchMedia(SYSTEM_QUERY);
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [isExplicit]);

  const toggle = () => {
    setIsExplicit(true);
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeExplicit = (t: Theme) => {
    setIsExplicit(true);
    setTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, isExplicit, toggle, setTheme: setThemeExplicit }}>
      {children}
    </ThemeContext.Provider>
  );
};
