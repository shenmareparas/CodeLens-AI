"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("codelens-theme") as ThemeMode | null;
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("codelens-theme") as ThemeMode | null;
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    if (mode === "system") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return mode;
  });

  const applyTheme = (mode: ThemeMode) => {
    let effective: ResolvedTheme = "dark";
    if (mode === "system") {
      const isLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      effective = isLight ? "light" : "dark";
    } else {
      effective = mode;
    }
    setResolvedTheme(effective);
    document.documentElement.setAttribute("data-theme", effective);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);

    // Listen for system theme changes if mode is 'system'
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentSaved = localStorage.getItem("codelens-theme");
      if (!currentSaved || currentSaved === "system") {
        const nextEffective = e.matches ? "light" : "dark";
        setResolvedTheme(nextEffective);
        document.documentElement.setAttribute("data-theme", nextEffective);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("codelens-theme", newTheme);
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const nextMode: ThemeMode =
      theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
