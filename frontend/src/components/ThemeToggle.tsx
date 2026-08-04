import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggle, isExplicit } = useTheme();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isExplicit ? 'Theme' : `Theme (${isDark ? 'dark' : 'light'}, following system)`}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg2)] text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)] transition-colors"
    >
      {/* Sun / moon crossfade with a subtle rotate on hover */}
      <span className="relative block h-5 w-5 overflow-hidden">
        <i
          className={`ti ti-sun absolute inset-0 flex items-center justify-center text-lg transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          aria-hidden="true"
        />
        <i
          className={`ti ti-moon absolute inset-0 flex items-center justify-center text-lg transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          aria-hidden="true"
        />
      </span>
    </button>
  );
};
