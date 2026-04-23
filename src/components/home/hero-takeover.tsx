"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const heroImage =
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=2200&q=80";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HeroTakeover() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0;
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const next = clamp(-rect.top / travel, 0, 1);
      setProgress((prev) => (Math.abs(prev - next) > 0.003 ? next : prev));
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const revealRadius = 8 + progress * 155;
  const contentOpacity = clamp(1 - progress * 1.15, 0, 1);
  const contentLift = progress * -36;

  return (
    <section ref={sectionRef} className="hero-takeover">
      <div className="hero-stage">
        <div
          className="hero-takeover-image"
          style={{
            backgroundImage: `url(${heroImage})`,
            clipPath: `circle(${revealRadius}% at 50% 32%)`,
            filter: "saturate(1.35) contrast(1.08)",
            opacity: 0.08 + progress * 0.95,
            transform: `scale(${1.16 - progress * 0.16})`,
          }}
        />
        <div className="hero-stage-scrim" />

        <div
          className="hero-takeover-lines pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden sm:block"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 700"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
            <path
              pathLength="1"
              className="path-draw visible"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 30%, #f0d0c0)",
                strokeWidth: "2.5",
              }}
              d="M 420,30 C 400,70 380,110 370,160 C 360,210 370,260 360,310 C 350,360 320,390 310,440 C 300,490 310,540 330,590
                 M 370,160 C 400,140 440,120 480,100 C 520,80 560,70 600,80 C 640,90 660,120 650,160 C 640,200 610,220 610,260 C 610,300 640,330 650,370 C 660,410 640,450 620,480
                 M 600,80 C 650,60 700,60 740,80 C 780,100 800,140 790,180 C 780,220 750,240 750,280 C 750,320 780,350 800,380"
            />
          </svg>
        </div>

        <div className="hero-takeover-content page-inner">
          <div
            style={
              {
                opacity: clamp(1 - progress * 0.95, 0.12, 1),
                transform: `translateY(${progress * -22}px)`,
                "--hero-progress": progress,
              } as CSSProperties
            }
          >
            <p className="hero-prefix" aria-hidden="true">
              MISS
            </p>
            <div className="hero-letters overflow-hidden" aria-label="Ginko">
              <span aria-hidden="true" className="photo-word" style={{ backgroundImage: `url(${heroImage})` }}>
                GINKO
              </span>
            </div>
          </div>

          <div className="hero-copy-track mt-6 grid gap-6 pb-12 sm:pb-16 lg:grid-cols-2" style={{ opacity: contentOpacity, transform: `translateY(${contentLift}px)` }}>
            <h1
              className="reveal-text text-3xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.4rem]"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Australian Brunch & Coffee Shop in the Heart of the City
            </h1>
            <div className="space-y-4 lg:pt-3">
              <p className="reveal-text ui-copy text-lg leading-8 sm:text-xl" style={{ animationDelay: "140ms" }}>
                We believe coffee and food are more than simple pleasures. They are moments to connect, to slow down,
                and to feel right at home.
              </p>
              <p className="reveal-text font-semibold italic text-[var(--foreground)]" style={{ animationDelay: "240ms" }}>
                Welcome to Miss Ginko!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
