"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const selector =
      ".scroll-reveal, .headline-reveal, .watermark-reveal, .script-reveal, .path-draw";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const markVisible = (elements: Iterable<HTMLElement>) => {
      for (const element of elements) {
        element.classList.add("visible");
      }
    };

    if (reduced) {
      markVisible(document.querySelectorAll<HTMLElement>(selector));
      return;
    }

    const observed = new WeakSet<HTMLElement>();
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: window.innerWidth < 640 ? 0.04 : 0.08,
        rootMargin: window.innerWidth < 640 ? "0px 0px -24px 0px" : "0px 0px -40px 0px",
      }
    );

    const register = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        if (element.classList.contains("visible") || observed.has(element)) return;
        observed.add(element);
        intersectionObserver.observe(element);
      });
    };

    register(document);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          if (node.matches(selector) && !node.classList.contains("visible") && !observed.has(node)) {
            observed.add(node);
            intersectionObserver.observe(node);
          }

          register(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
