"use client";

import { useEffect, useId, useState } from "react";

const STORAGE_KEY = "msginko-theme";
type Theme = "clean" | "amoled";
type ThemeToggleProps = {
  compact?: boolean;
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("clean");
  const compactToggleId = useId().replace(/:/g, "");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const rootTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme: Theme = stored === "amoled" || rootTheme === "amoled" ? "amoled" : "clean";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const onToggle = () => {
    const nextTheme: Theme = theme === "clean" ? "amoled" : "clean";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  if (compact) {
    const isAmoled = theme === "amoled";
    return (
      <div className="theme-toggle-power">
        <input
          id={`theme-toggle-${compactToggleId}`}
          className="theme-toggle-power-input"
          type="checkbox"
          checked={isAmoled}
          onChange={onToggle}
          aria-label="Toggle theme"
          aria-checked={isAmoled}
        />
        <label
          className="theme-toggle-power-switch"
          htmlFor={`theme-toggle-${compactToggleId}`}
          title={theme === "amoled" ? "Switch to White theme" : "Switch to Amoled theme"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="theme-toggle-power-slider" aria-hidden="true">
            <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V256c0 17.7 14.3 32 32 32s32-14.3 32-32V32zM143.5 120.6c13.6-11.3 15.4-31.5 4.1-45.1s-31.5-15.4-45.1-4.1C49.7 115.4 16 181.8 16 256c0 132.5 107.5 240 240 240s240-107.5 240-240c0-74.2-33.8-140.6-86.6-184.6c-13.6-11.3-33.8-9.4-45.1 4.1s-9.4 33.8 4.1 45.1c38.9 32.3 63.5 81 63.5 135.4c0 97.2-78.8 176-176 176s-176-78.8-176-176c0-54.4 24.7-103.1 63.5-135.4z" />
          </svg>
        </label>
      </div>
    );
  }

  return (
    <button type="button" onClick={onToggle} className="theme-toggle" aria-label="Toggle theme">
      <span className="theme-toggle-dot" />
      <span suppressHydrationWarning>{theme === "amoled" ? "Amoled" : "White"}</span>
    </button>
  );
}
