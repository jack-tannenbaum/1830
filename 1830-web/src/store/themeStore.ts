import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '../styles/themes';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        console.log('Toggling theme from', currentTheme, 'to', newTheme);
        set({ theme: newTheme });
      },
      setTheme: (theme: Theme) => {
        console.log('Setting theme to', theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
