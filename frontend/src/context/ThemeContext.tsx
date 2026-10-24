"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("codelens-theme") as ThemeMode | null;
    return saved === "light" || saved === "dark" || saved === "system"
      ? saved
      : "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("codelens-theme") as ThemeMode | null;
    const mode =
      saved === "light" || saved === "dark" || saved === "system"
        ? saved
        : "system";
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    return mode;
  });

  // Sync resolved theme to document attribute and handle system preference changes
  useEffect(() => {
    const effective: ResolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : theme;
    setResolvedTheme(effective);
    document.documentElement.setAttribute("data-theme", effective);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const nextEffective = e.matches ? "light" : "dark";
        setResolvedTheme(nextEffective);
        document.documentElement.setAttribute("data-theme", nextEffective);
      };

      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
  }, [theme]);

  // Persist user theme selection
  useEffect(() => {
    localStorage.setItem("codelens-theme", theme);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const effectiveTheme =
        current === "system"
          ? typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : current;
      return effectiveTheme === "dark" ? "light" : "dark";
    });
  }, []);

  const cycleTheme = toggleTheme;

  const contextValue = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme, cycleTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
