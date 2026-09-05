import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('eco_theme') || 'dark');

  useEffect(() => {
    // Apply theme class directly to <body> and <html> so background covers the whole page
    document.body.className = `theme-${theme}`;
    document.documentElement.className = `theme-${theme}`;
    localStorage.setItem('eco_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
