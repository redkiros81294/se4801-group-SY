import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'chaintrack_theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage access errors (private mode etc.)
    }
    return 'dark';
  });

  // Apply the theme attribute whenever it changes, and on first mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggle = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
