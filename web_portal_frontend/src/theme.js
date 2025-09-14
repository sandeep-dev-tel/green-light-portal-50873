import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme definitions via CSS custom properties applied at :root level
 * Light (Green): existing brand palette
 * Dark: dark surfaces & light text
 * Day: soft warm light theme variant
 */

const THEME_CLASS_MAP = {
  light: "theme-light",
  dark: "theme-dark",
  day: "theme-day",
};

// PUBLIC_INTERFACE
export const ThemeContext = createContext({
  /** Current theme key: 'light' | 'dark' | 'day' */
  theme: "light",
  /** PUBLIC_INTERFACE: setTheme to switch theme at runtime */
  setTheme: (_t) => {},
  /** Available themes array */
  themes: ["light", "dark", "day"],
});

/**
 * PUBLIC_INTERFACE
 * ThemeProvider: wraps the app and manages the theme selection via a class on <html>.
 * Persists selection in sessionStorage under 'glp_theme'.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Load persisted theme once
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("glp_theme");
      if (stored && (stored === "light" || stored === "dark" || stored === "day")) {
        setTheme(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply and persist theme
  useEffect(() => {
    const root = document.documentElement;
    // Remove any previously set theme classes
    Object.values(THEME_CLASS_MAP).forEach((cls) => root.classList.remove(cls));
    // Add the current one
    root.classList.add(THEME_CLASS_MAP[theme]);
    // Persist
    try {
      sessionStorage.setItem("glp_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      themes: Object.keys(THEME_CLASS_MAP),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// PUBLIC_INTERFACE
export function useTheme() {
  /** Hook to access current theme and setter */
  return useContext(ThemeContext);
}
