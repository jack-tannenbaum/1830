import { useThemeStore } from '../store/themeStore';
import { lightTheme, darkTheme } from './themes';

// Hook to get current theme colors
export const useColors = () => {
  const { theme } = useThemeStore();
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Legacy export for backward compatibility (will be removed)
export const colors = lightTheme;
