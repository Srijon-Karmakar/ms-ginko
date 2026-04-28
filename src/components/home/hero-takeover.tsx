"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { getHeroVideoSourceUrls } from "@/lib/media";

const heroVideoSources = getHeroVideoSourceUrls();

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

        <div className="hero-food-doodles pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
          <svg className="hero-food-doodle hero-food-doodle--cup" viewBox="0 0 220 220">
            <path className="hero-food-doodle-path" d="M52 120h96v14a30 30 0 0 1-30 30H82a30 30 0 0 1-30-30Z" />
            <path className="hero-food-doodle-path" d="M148 126h18a17 17 0 0 1 0 34h-14" />
            <path className="hero-food-doodle-path" d="M46 166h112" />
            <path className="hero-food-doodle-steam" d="M78 94c-7-9-2-19 4-26" />
            <path className="hero-food-doodle-steam" d="M101 88c-6-10 0-19 6-27" />
            <path className="hero-food-doodle-steam" d="M124 93c-6-10 0-18 6-26" />
          </svg>

          <svg className="hero-food-doodle hero-food-doodle--plate" viewBox="0 0 240 240">
            <ellipse className="hero-food-doodle-path" cx="120" cy="134" rx="82" ry="32" />
            <ellipse className="hero-food-doodle-path" cx="120" cy="134" rx="46" ry="16" />
            <path className="hero-food-doodle-path" d="M48 126c18-18 40-28 72-28s54 10 72 28" />
            <path className="hero-food-doodle-path" d="M120 98c8 10 7 23 0 33-7-10-8-23 0-33Z" />
            <path className="hero-food-doodle-path" d="M102 112h36" />
          </svg>

          <svg className="hero-food-doodle hero-food-doodle--cloche" viewBox="0 0 260 220">
            <path className="hero-food-doodle-path" d="M32 156h196" />
            <path className="hero-food-doodle-path" d="M56 154c4-52 38-92 74-101" />
            <path className="hero-food-doodle-path" d="M204 154c-4-52-38-92-74-101" />
            <path className="hero-food-doodle-path" d="M130 53c-4-15 6-27 19-27s23 12 19 27" />
            <path className="hero-food-doodle-path" d="M110 182h40" />
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
                  <div className="hero-mask-video-wrap">
                    <video
                      className="hero-mask-video"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    >
                      {heroVideoSources.map((src) => (
                        <source key={src} src={src} />
                      ))}
                    </video>
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>

          {/* Ginko leaf ornament — fills middle gap on mobile */}
          <div
            className="hero-mobile-ornament"
            aria-hidden="true"
            style={{ opacity: contentOpacity }}
          >
            <svg
              className="hero-ornament-svg"
              viewBox="0 0 80 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stem */}
              <path className="hero-ornament-path" d="M40 96 L40 70" strokeWidth="1.8" pathLength="1" />
              {/* Left lobe */}
              <path
                className="hero-ornament-path"
                d="M40 70 C35 68 18 62 9 48 C2 36 4 20 14 13 C24 6 36 10 40 22"
                strokeWidth="1.8"
                pathLength="1"
                style={{ animationDelay: "200ms" }}
              />
              {/* Right lobe */}
              <path
                className="hero-ornament-path"
                d="M40 22 C44 10 56 6 66 13 C76 20 78 36 71 48 C62 62 45 68 40 70"
                strokeWidth="1.8"
                pathLength="1"
                style={{ animationDelay: "440ms" }}
              />
              {/* Central vein */}
              <path
                className="hero-ornament-path"
                d="M40 70 L40 24"
                strokeWidth="1"
                pathLength="1"
                style={{ animationDelay: "700ms" }}
              />
              {/* Left veins */}
              <path
                className="hero-ornament-path"
                d="M40 62 C33 54 19 46 11 38 M40 50 C31 43 17 33 12 22"
                strokeWidth="0.9"
                pathLength="1"
                style={{ animationDelay: "880ms" }}
              />
              {/* Right veins */}
              <path
                className="hero-ornament-path"
                d="M40 62 C47 54 61 46 69 38 M40 50 C49 43 63 33 68 22"
                strokeWidth="0.9"
                pathLength="1"
                style={{ animationDelay: "1020ms" }}
              />
            </svg>
          </div>

          <div
            className="hero-copy-track hero-mobile-copy mt-2 grid gap-4 pb-10 sm:mt-4 sm:gap-6 sm:pb-16 lg:grid-cols-2"
            style={{ opacity: contentOpacity, transform: `translateY(${contentLift}px)` }}
          >
            <h1
              className="reveal-text hero-mobile-title text-2xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.4rem]"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Indian Brunch & Coffee Shop in the Heart of the City
            </h1>
            <div className="hero-mobile-copy-body space-y-0 sm:space-y-4 lg:pt-3">
              <p className="reveal-text hero-mobile-lead ui-copy text-lg leading-8 sm:text-xl" style={{ animationDelay: "140ms" }}>
                We believe coffee and food are more than simple pleasures. They are moments to connect, to slow down,
                and to feel right at home.
              </p>
              <p
                className="reveal-text hero-mobile-welcome font-semibold italic text-[var(--foreground)]"
                style={{ animationDelay: "240ms" }}
              >
                Welcome to Miss Ginko!
              </p>
              <div className="reveal-text hero-mobile-cta pt-1" style={{ animationDelay: "320ms" }}>
                <Link href="/reserve" className="ui-btn-primary hero-mobile-cta-btn px-6 py-3 text-[11px] sm:text-xs">
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
