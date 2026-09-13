import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemeContextType = {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

export const lightColors = {
  background: "#ffffff",
  surface: "#fafafa",
  border: "#f0f0f0",
  text: "#111111",
  textSecondary: "#555555",
  textMuted: "#888888",
  primary: "#4CAF50",
  secondary: "#FF9800",
  card: "#ffffff",
  input: "#fafafa",
  navBg: "#ffffff",
  inputBorder: "#dddddd",
};

export const darkColors = {
  background: "#121212",
  surface: "#1e1e1e",
  border: "#2c2c2c",
  text: "#ffffff",
  textSecondary: "#cccccc",
  textMuted: "#888888",
  primary: "#4CAF50",
  secondary: "#FF9800",
  card: "#1e1e1e",
  input: "#2c2c2c",
  navBg: "#1a1a1a",
  inputBorder: "#3c3c3c",
};

const THEME_STORAGE_KEY = "themePreference";

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Load the saved theme preference once, when the app first starts
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "dark") {
          setIsDark(true);
        } else if (saved === "light") {
          setIsDark(false);
        }
        // if nothing saved yet, keep the default (light)
      } catch (err) {
        console.error("Load theme preference error:", err);
      }
    })();
  }, []);

  const toggleTheme = () => {
    setIsDark((prev: boolean) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light").catch(
        (err) => console.error("Save theme preference error:", err),
      );
      return next;
    });
  };

  const colors = isDark ? darkColors : lightColors;

  return createElement(
    ThemeContext.Provider,
    { value: { isDark, toggleTheme, colors } },
    children,
  );
}
