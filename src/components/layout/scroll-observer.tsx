"use client";

import { useEffect } from "react";

export function ScrollObserver() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll<HTMLElement>(
      ".scroll-reveal, .headline-reveal, .watermark-reveal, .script-reveal, .path-draw"
    );

    if (reduced) {
      targets.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: window.innerWidth < 640 ? 0.04 : 0.08,
        rootMargin: window.innerWidth < 640 ? "0px 0px -24px 0px" : "0px 0px -40px 0px",
      }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
