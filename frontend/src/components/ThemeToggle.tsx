import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200/60 bg-white/80 text-ink-700 shadow-sm transition-all duration-300 hover:border-primary-400 hover:shadow-md dark:border-ink-700/60 dark:bg-ink-800/60 dark:text-ink-200 dark:hover:border-primary-400"
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === 'dark' ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}
