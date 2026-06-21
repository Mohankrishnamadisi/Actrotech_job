import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@constants/index';

type ThemeMode = 'light' | 'dark' | 'professional' | 'modern';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'professional',
  setThemeMode: () => {},
});

export const ThemeModeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('professional');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'light' || stored === 'dark' || stored === 'professional' || stored === 'modern') {
      setThemeModeState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.THEME, themeMode);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
