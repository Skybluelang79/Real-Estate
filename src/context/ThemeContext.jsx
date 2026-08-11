import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
