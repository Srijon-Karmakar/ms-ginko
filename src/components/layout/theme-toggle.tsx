"use client";

import { useState } from "react";

const STORAGE_KEY = "msginko-theme";
type Theme = "clean" | "amoled";
type ThemeToggleProps = {
  compact?: boolean;
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

function SunGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <circle
        cx="12"
        cy="12"
        r="4.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2.2v2.6" />
        <path d="M12 19.2v2.6" />
        <path d="M2.2 12h2.6" />
        <path d="M19.2 12h2.6" />
        <path d="M5.05 5.05l1.85 1.85" />
        <path d="M17.1 17.1l1.85 1.85" />
        <path d="M18.95 5.05 17.1 6.9" />
        <path d="m6.9 17.1-1.85 1.85" />
      </g>
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none">
      <path
        d="M20.4 13.6a8.5 8.5 0 1 1-10-10 7.3 7.3 0 1 0 10 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.85" cy="6.15" r="1.05" fill="currentColor" />
      <circle cx="15.35" cy="4.3" r=".62" fill="currentColor" opacity=".75" />
    </svg>
  );
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
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

  if (compact) {
    const isAmoled = theme === "amoled";
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle theme"
        aria-pressed={isAmoled}
        className="group inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--background)_24%,transparent)] text-[var(--foreground)] transition hover:bg-[color-mix(in_srgb,var(--background)_38%,transparent)]"
        title={theme === "amoled" ? "Switch to White theme" : "Switch to Amoled theme"}
      >
        <span
          className="transition-transform duration-300 will-change-transform group-hover:rotate-6"
          aria-hidden="true"
        >
          {isAmoled ? <SunGlyph /> : <MoonGlyph />}
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onToggle} className="theme-toggle" aria-label="Toggle theme">
      <span className="theme-toggle-dot" />
      <span suppressHydrationWarning>{theme === "amoled" ? "Amoled" : "White"}</span>
    </button>
  );
}
