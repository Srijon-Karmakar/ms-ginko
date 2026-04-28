"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { getLogoImageUrl } from "@/lib/media";

const HOLD_MS = 900;
const MOVE_MS = 860;
const REVEAL_MS = 1800;
const REDUCED_HOLD_MS = 80;
const REDUCED_MOVE_MS = 240;
const REDUCED_FADE_MS = 180;
const START_SIZE = 200;

type Phase = "hold" | "move" | "reveal";

export function IntroCurtain() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("hold");
  const [motion, setMotion] = useState({ dx: 0, dy: 0, scale: 1 });
  const [moveMs, setMoveMs] = useState(MOVE_MS);
  const [revealMs, setRevealMs] = useState(REVEAL_MS);
  const logoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const safeUnlock = () => document.documentElement.classList.remove("intro-lock");
    const finish = (revealDuration: number) => {
      setPhase("reveal");
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setActive(false);
          safeUnlock();
        }, revealDuration),
      );
    };

    const runIntro = (reducedMotion: boolean) => {
      const moveDuration = reducedMotion ? REDUCED_MOVE_MS : MOVE_MS;
      const revealDuration = reducedMotion ? REDUCED_FADE_MS : REVEAL_MS;
      setMoveMs(moveDuration);
      setRevealMs(revealDuration);

      const startMove = () => {
        const target = document.querySelector("[data-site-header-logo]") as HTMLElement | null;
        const movingLogo = logoRef.current;

        if (target && movingLogo) {
          const from = movingLogo.getBoundingClientRect();
          const to = target.getBoundingClientRect();
          const dx = to.left + to.width / 2 - (from.left + from.width / 2);
          const dy = to.top + to.height / 2 - (from.top + from.height / 2);
          const scale = to.width / Math.max(from.width, 1);
          setMotion({ dx, dy, scale });
        }

        requestAnimationFrame(() => {
          if (cancelled) return;
          setPhase("move");
        });

        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            finish(revealDuration);
          }, moveDuration),
        );
      };

      let tries = 0;
      const findTargetAndMove = () => {
        if (cancelled) return;
        const target = document.querySelector("[data-site-header-logo]");
        if (target || tries >= 24) {
          startMove();
          return;
        }
        tries += 1;
        timers.push(window.setTimeout(findTargetAndMove, 30));
      };

      timers.push(window.setTimeout(findTargetAndMove, reducedMotion ? REDUCED_HOLD_MS : HOLD_MS));
    };

    setActive(true);
    document.documentElement.classList.add("intro-lock");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runIntro(reducedMotion);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      safeUnlock();
    };
  }, []);

  if (!active) return null;

  const style = {
    "--intro-dx": `${motion.dx}px`,
    "--intro-dy": `${motion.dy}px`,
    "--intro-scale": `${motion.scale}`,
    "--intro-move-ms": `${moveMs}ms`,
    "--intro-reveal-ms": `${revealMs}ms`,
  } as CSSProperties;

  return (
    <>
      <div className={`intro-curtain ${phase === "reveal" ? "intro-curtain--reveal" : ""}`} aria-hidden="true" />
      <div
        ref={logoRef}
        className={`intro-curtain-logo ${phase !== "hold" ? "intro-curtain-logo--move" : ""}`}
        style={style}
        aria-hidden="true"
      >
        <Image
          src={getLogoImageUrl()}
          alt=""
          width={START_SIZE}
          height={START_SIZE}
          priority
          className="intro-curtain-logo-img"
        />
      </div>
    </>
  );
}
