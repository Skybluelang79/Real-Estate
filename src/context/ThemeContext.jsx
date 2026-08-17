import { useState, useEffect, useCallback } from 'react';
import ThemeContext from './ThemeCtx';

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('dreamhomes_theme');
    return stored ? stored === 'dark' : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark', 'dark-mode');
    } else {
      document.body.classList.remove('dark', 'dark-mode');
    }
    localStorage.setItem('dreamhomes_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
