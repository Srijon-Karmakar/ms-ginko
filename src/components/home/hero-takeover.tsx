"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

const heroVideoReversedWebm = "/video/hero1-reversed.webm";
const heroVideoReversedMp4 = "/video/hero1-reversed.mp4";
const heroVideoFallbackMp4 = "/video/hero1.mp4";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HeroTakeover() {
  const sectionRef = useRef<HTMLElement>(null);
  const rawMaskId = useId();
  const maskId = `hero-ginko-mask-${rawMaskId.replace(/:/g, "")}`;
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

  const contentOpacity = clamp(1 - progress * 1.12, 0, 1);
  const contentLift = progress * -30;
  const wordScale = 1 + progress * 5.25;
  const inverseVideoScale = 1 / wordScale;
  const wordOpacity = clamp(1 - progress * 0.05, 0.94, 1);
  const lineOffset = 1 - progress;
  const lineLift = progress * -92;

  return (
    <section ref={sectionRef} className="hero-takeover">
      <div className="hero-stage">
        <div
          className="hero-takeover-lines pointer-events-none absolute inset-0 z-0 hidden overflow-hidden sm:block"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 700"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            style={{ transform: `translate3d(0, ${lineLift}px, 0)` }}
          >
            <path
              pathLength="1"
              style={{
                fill: "none",
                stroke: "color-mix(in srgb, var(--accent) 30%, #f0d0c0)",
                strokeWidth: "2.5",
                strokeDasharray: 1,
                strokeDashoffset: lineOffset,
                strokeLinecap: "round",
                strokeLinejoin: "round",
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
                opacity: wordOpacity,
                transform: `scale(${wordScale}) translateY(${progress * 62}px)`,
                transformOrigin: "center 46%",
                "--hero-progress": progress,
                "--hero-video-inverse-scale": inverseVideoScale,
              } as CSSProperties
            }
          >
            <div className="hero-wordmark" aria-label="Miss Ginko">
              <svg
                aria-hidden="true"
                className="hero-wordmark-mask"
                viewBox="0 0 1800 720"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1800" height="720">
                    <rect x="0" y="0" width="1800" height="720" fill="black" />
                    <text
                      x="900"
                      y="128"
                      textAnchor="middle"
                      fill="white"
                      className="hero-wordmark-mask-miss"
                    >
                      MISS
                    </text>
                    <text
                      x="900"
                      y="626"
                      textAnchor="middle"
                      fill="white"
                      className="hero-wordmark-mask-ginko"
                    >
                      GINKO
                    </text>
                  </mask>
                </defs>

                <foreignObject x="-18" y="-18" width="1836" height="756" mask={`url(#${maskId})`}>
                  <div xmlns="http://www.w3.org/1999/xhtml" className="hero-mask-video-wrap">
                    <video
                      className="hero-mask-video"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    >
                      <source src={heroVideoReversedWebm} type="video/webm" />
                      <source src={heroVideoReversedMp4} type="video/mp4" />
                      <source src={heroVideoFallbackMp4} type="video/mp4" />
                    </video>
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>

          <div
            className="hero-copy-track mt-2 grid gap-4 pb-10 sm:mt-4 sm:gap-6 sm:pb-16 lg:grid-cols-2"
            style={{ opacity: contentOpacity, transform: `translateY(${contentLift}px)` }}
          >
            <h1
              className="reveal-text text-2xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.4rem]"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Indian Brunch & Coffee Shop in the Heart of the City
            </h1>
            <div className="space-y-4 lg:pt-3">
              <p className="reveal-text ui-copy text-lg leading-8 sm:text-xl" style={{ animationDelay: "140ms" }}>
                We believe coffee and food are more than simple pleasures. They are moments to connect, to slow down,
                and to feel right at home.
              </p>
              <p className="reveal-text font-semibold italic text-[var(--foreground)]" style={{ animationDelay: "240ms" }}>
                Welcome to Miss Ginko!
              </p>
              <div className="reveal-text pt-1" style={{ animationDelay: "320ms" }}>
                <Link href="/reserve" className="ui-btn-primary px-6 py-3 text-[11px] sm:text-xs">
                  Reserve Your Table
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
