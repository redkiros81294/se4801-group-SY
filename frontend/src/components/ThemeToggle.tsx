import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="bg-[var(--bg2)] border border-[var(--border)] rounded-lg p-2 text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)] transition-colors"
    >
      <i className={`ti ${theme === 'dark' ? 'ti-sun' : 'ti-moon'} text-lg`}></i>
    </button>
  );
};