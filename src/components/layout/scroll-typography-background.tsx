"use client";

import { useEffect, useState } from "react";

const tracks = [
  { top: "10vh", width: 220, start: -68, end: 10, opacity: 0.78, word: "HAVEN", script: false },
  { top: "45vh", width: 230, start: 55, end: -45, opacity: 0.84, word: "COFFEE", script: false },
  { top: "78vh", width: 180, start: -40, end: 34, opacity: 0.62, word: "see ya!", script: true },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ScrollTypographyBackground() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;

    const update = () => {
      const root = document.documentElement;
      const maxScroll = root.scrollHeight - window.innerHeight;
      const next = maxScroll <= 0 ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
      setProgress(next);
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) {
        raf = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {tracks.map((track, index) => {
        const offset = track.start + (track.end - track.start) * progress;
        const reveal = clamp(progress * 125 - index * 10, 0, 100);
        const clipPath =
          index % 2 === 0 ? `inset(0 ${100 - reveal}% 0 0)` : `inset(0 0 0 ${100 - reveal}%)`;

        return (
          <div
            key={track.top}
            className="absolute left-0"
            style={{
              clipPath,
              opacity: track.opacity,
              top: track.top,
              transform: `translate3d(${offset}vw, 0, 0)`,
              width: `${track.width}vw`,
            }}
          >
            <svg viewBox="0 0 1800 260" className="h-[clamp(82px,14vw,228px)] w-full">
              <text
                x="0"
                y={track.script ? "188" : "198"}
                fill="var(--watermark)"
                style={{
                  filter: "drop-shadow(0 0 16px var(--typography-shadow))",
                  fontFamily: track.script ? "var(--font-script), cursive" : "var(--font-display), sans-serif",
                  fontSize: track.script ? "226px" : "238px",
                  fontWeight: track.script ? 600 : 700,
                  letterSpacing: track.script ? "0px" : "16px",
                  textTransform: track.script ? "none" : "uppercase",
                }}
              >
                {track.word}
              </text>
            </svg>
          </div>
        );
      })}
    </div>
  );
}
