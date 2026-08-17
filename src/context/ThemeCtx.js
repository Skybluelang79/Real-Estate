import { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

export default ThemeContext;

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
