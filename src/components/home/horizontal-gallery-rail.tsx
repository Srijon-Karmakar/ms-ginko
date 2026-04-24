"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GalleryPhoto = {
  src: string;
  alt: string;
};

type HorizontalGalleryRailProps = {
  photos: GalleryPhoto[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HorizontalGalleryRail({ photos }: HorizontalGalleryRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageViewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const textViewportRef = useRef<HTMLDivElement>(null);
  const textTrackRef = useRef<HTMLDivElement>(null);

  const [travel, setTravel] = useState(0);
  const [textTravel, setTextTravel] = useState(0);
  const [sectionHeight, setSectionHeight] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [textTranslateX, setTextTranslateX] = useState(0);

  useEffect(() => {
    const updateMetrics = () => {
      const viewport = imageViewportRef.current ?? viewportRef.current;
      const track = trackRef.current;
      const textViewport = textViewportRef.current;
      const textTrack = textTrackRef.current;
      if (!viewport || !track || !textViewport || !textTrack) return;

      const nextTravel = Math.max(track.scrollWidth - viewport.clientWidth, 0);
      const nextTextTravel = Math.max(textTrack.scrollWidth - textViewport.clientWidth, 0);
      const nextSectionHeight = Math.max(window.innerHeight + nextTravel, window.innerHeight * 1.25);

      setTravel(nextTravel);
      setTextTravel(nextTextTravel);
      setSectionHeight(nextSectionHeight);
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, [photos.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;

      raf = window.requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const maxProgressDistance = Math.max(sectionHeight - window.innerHeight, 1);
        const progress = clamp(-rect.top / maxProgressDistance, 0, 1);
        setTranslateX(progress * travel);
        setTextTranslateX(-textTravel + progress * textTravel);
        raf = 0;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [sectionHeight, travel, textTravel]);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="gallery-scroll-section bg-[var(--background)]"
      style={{ height: sectionHeight > 0 ? `${sectionHeight}px` : "220vh" }}
    >
      <div className="gallery-scroll-sticky">
        <div className="gallery-scroll-header page-inner pb-3 pt-5 sm:pb-4 sm:pt-7">
          <p className="ui-eyebrow">Gallery</p>
          <h2
            className="mt-2 text-3xl font-bold italic leading-tight text-[var(--foreground)] sm:text-4xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Signature moments from Ms Ginko
          </h2>
        </div>

        <div ref={viewportRef} className="gallery-scroll-viewport">
          <div className="gallery-scroll-stack">
            <div className="gallery-scroll-tilt">
              <div ref={imageViewportRef} className="gallery-image-viewport">
                <div
                  ref={trackRef}
                  className="gallery-scroll-track"
                  style={{ transform: `translate3d(-${translateX}px, 0, 0)` }}
                >
                  {photos.map((photo, index) => (
                    <article key={`${photo.src}-${index}`} className="gallery-scroll-card">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="gallery-scroll-image"
                        sizes="(max-width: 639px) 72vw, (max-width: 1024px) 44vw, 30vw"
                        priority={index < 3}
                      />
                    </article>
                  ))}
                </div>
              </div>

              <div ref={textViewportRef} className="gallery-text-viewport" aria-hidden="true">
                <div
                  ref={textTrackRef}
                  className="gallery-text-track"
                  style={{ transform: `translate3d(${textTranslateX}px, 0, 0)` }}
                >
                  {Array.from({ length: 18 }).map((_, index) => (
                    <span key={`gallery-text-${index}`} className="gallery-text-item">
                      ms ginko gallery
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
