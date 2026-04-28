"use client";

import { useEffect, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HomeScrollLines() {
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
      setProgress((prev) => (Math.abs(prev - next) > 0.008 ? next : prev));
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
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

  const lineOffset = 1 - progress;
  const lineLift = progress * -130;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[12] hidden overflow-hidden sm:block"
    >
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ transform: `translate3d(0, ${lineLift}px, 0)` }}
      >
        <path
          pathLength="1"
          className="path-draw"
          style={{
            stroke: "color-mix(in srgb, var(--accent) 30%, #f0d0c0)",
            strokeWidth: "2.5",
            strokeDashoffset: lineOffset,
          }}
          d="M 420,30 C 400,70 380,110 370,160 C 360,210 370,260 360,310 C 350,360 320,390 310,440 C 300,490 310,540 330,590
             M 370,160 C 400,140 440,120 480,100 C 520,80 560,70 600,80 C 640,90 660,120 650,160 C 640,200 610,220 610,260 C 610,300 640,330 650,370 C 660,410 640,450 620,480
             M 600,80 C 650,60 700,60 740,80 C 780,100 800,140 790,180 C 780,220 750,240 750,280 C 750,320 780,350 800,380"
        />
      </svg>
    </div>
  );
}
