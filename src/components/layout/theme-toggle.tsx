"use client";

import { useState } from "react";

const STORAGE_KEY = "msginko-theme";
type Theme = "clean" | "amoled";

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "clean";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const rootTheme = document.documentElement.getAttribute("data-theme");
    return stored === "amoled" || rootTheme === "amoled" ? "amoled" : "clean";
  });

  const onToggle = () => {
    const nextTheme: Theme = theme === "clean" ? "amoled" : "clean";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button type="button" onClick={onToggle} className="theme-toggle" aria-label="Toggle theme">
      <span className="theme-toggle-dot" />
      <span suppressHydrationWarning>{theme === "amoled" ? "Amoled" : "White"}</span>
    </button>
  );
}
