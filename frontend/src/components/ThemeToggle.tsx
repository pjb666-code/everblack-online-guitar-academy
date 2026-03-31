import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerThemePreference, useSetCallerThemePreference } from '../hooks/useQueries';
import { ThemePreference } from '../backend';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { identity } = useInternetIdentity();
  const { data: savedTheme } = useGetCallerThemePreference();
  const setThemePreference = useSetCallerThemePreference();

  // Sync theme from backend when user logs in
  useEffect(() => {
    if (identity && savedTheme) {
      const themeValue = savedTheme === ThemePreference.dark ? 'dark' : 'light';
      if (theme !== themeValue) {
        setTheme(themeValue);
      }
    }
  }, [identity, savedTheme, theme, setTheme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Save to backend if user is logged in
    if (identity) {
      try {
        await setThemePreference.mutateAsync(
          newTheme === 'dark' ? ThemePreference.dark : ThemePreference.light
        );
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
