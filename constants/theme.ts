import { createContext, useContext, useState, createElement } from 'react';

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

export const lightColors = {
  background: '#ffffff',
  surface: '#fafafa',
  border: '#f0f0f0',
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#888888',
  primary: '#4CAF50',
  secondary: '#FF9800',
  card: '#ffffff',
  input: '#fafafa',
  navBg: '#ffffff',
  inputBorder: '#dddddd',
};

export const darkColors = {
  background: '#121212',
  surface: '#1e1e1e',
  border: '#2c2c2c',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textMuted: '#888888',
  primary: '#4CAF50',
  secondary: '#FF9800',
  card: '#1e1e1e',
  input: '#2c2c2c',
  navBg: '#1a1a1a',
  inputBorder: '#3c3c3c',
};

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((prev: boolean) => !prev);
  const colors = isDark ? darkColors : lightColors;

  return createElement(
    ThemeContext.Provider,
    { value: { isDark, toggleTheme, colors } },
    children
  );
}