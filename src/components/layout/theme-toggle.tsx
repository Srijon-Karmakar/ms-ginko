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
  const inputId = `theme-toggle-${compactToggleId}`;
  const maskId = `moon-mask-${compactToggleId}`;

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

  const isAmoled = theme === "amoled";

  return (
    <label
      htmlFor={inputId}
      className={`themeToggle st-sunMoonThemeToggleBtn ${compact ? "themeToggle--compact" : ""}`}
      title={isAmoled ? "Switch to White theme" : "Switch to Amoled theme"}
    >
      <input
        id={inputId}
        className="themeToggleInput"
        type="checkbox"
        checked={isAmoled}
        onChange={onToggle}
        aria-label="Toggle theme"
        aria-checked={isAmoled}
      />
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" stroke="none" aria-hidden="true">
        <mask id={maskId}>
          <rect x="0" y="0" width="20" height="20" fill="white" />
          <circle cx="11" cy="3" r="8" fill="black" />
        </mask>
        <circle className="sunMoon" cx="10" cy="10" r="8" mask={`url(#${maskId})`} />
        <g>
          <circle className="sunRay sunRay1" cx="18" cy="10" r="1.5" />
          <circle className="sunRay sunRay2" cx="14" cy="16.928" r="1.5" />
          <circle className="sunRay sunRay3" cx="6" cy="16.928" r="1.5" />
          <circle className="sunRay sunRay4" cx="2" cy="10" r="1.5" />
          <circle className="sunRay sunRay5" cx="6" cy="3.1718" r="1.5" />
          <circle className="sunRay sunRay6" cx="14" cy="3.1718" r="1.5" />
        </g>
      </svg>
      {!compact ? <span suppressHydrationWarning className="sr-only">{isAmoled ? "Amoled" : "White"}</span> : null}
    </label>
  );
}
