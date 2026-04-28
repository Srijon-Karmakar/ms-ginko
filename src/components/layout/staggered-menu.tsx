"use client";

import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { getLogoImageUrl } from "@/lib/media";

export type StaggeredMenuItem = {
  label: string;
  ariaLabel: string;
  link: string;
  onClick?: () => void;
};

export type StaggeredMenuSocialItem = {
  label: string;
  link: string;
};

export type StaggeredMenuProps = {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed?: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  embedded?: boolean;
  showLogo?: boolean;
  headerActions?: ReactNode;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
};

const isExternalLink = (href: string) => /^https?:\/\//i.test(href);

export function StaggeredMenu({
  position = "right",
  colors = ["var(--surface-alt)", "var(--surface)"],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = getLogoImageUrl(),
  menuButtonColor = "#ffffff",
  openMenuButtonColor = "#ffffff",
  changeMenuColorOnOpen = true,
  accentColor = "#5227FF",
  isFixed = true,
  closeOnClickAway = true,
  embedded = false,
  showLogo = true,
  headerActions,
  onMenuOpen,
  onMenuClose,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState<string[]>(["Menu", "Close"]);
  const [mobileLiteMode, setMobileLiteMode] = useState(false);
  const openRef = useRef(false);
  const busyRef = useRef(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    const update = () => setMobileLiteMode(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = preContainer
        ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[])
        : [];
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });

      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });

    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
    ) as HTMLElement[];
    const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];

    const offscreen = position === "left" ? -100 : 100;

    if (mobileLiteMode) {
      gsap.set(itemEls, { clearProps: "transform" });
      if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as never]: 1 });
      if (socialTitle) gsap.set(socialTitle, { opacity: 1 });
      if (socialLinks.length) gsap.set(socialLinks, { clearProps: "transform,opacity" });

      const tlLite = gsap.timeline({ paused: true });
      tlLite.fromTo(
        panel,
        { xPercent: offscreen },
        { xPercent: 0, duration: 0.26, ease: "power2.out" },
        0,
      );
      openTlRef.current = tlLite;
      return tlLite;
    }

    const layerStates = layers.map((el) => ({ el, start: offscreen }));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as never]: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: offscreen },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime,
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;

      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: "power4.out", stagger: { each: 0.1, from: "start" } },
        itemsStart,
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            ["--sm-num-opacity" as never]: 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1,
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: () => gsap.set(socialLinks, { clearProps: "opacity" }),
          },
          socialsStart + 0.04,
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [mobileLiteMode, position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (!tl) {
      busyRef.current = false;
      return;
    }

    tl.eventCallback("onComplete", () => {
      busyRef.current = false;
    });
    tl.play(0);
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === "left" ? -100 : 100;

    if (mobileLiteMode) {
      closeTweenRef.current = gsap.to(panel, {
        xPercent: offscreen,
        duration: 0.22,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => {
          busyRef.current = false;
        },
      });
      return;
    }

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(
          panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"),
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as never]: 0 });

        const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        busyRef.current = false;
      },
    });
  }, [mobileLiteMode, position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();
    if (mobileLiteMode) {
      gsap.set(h, { rotate: opening ? 45 : 0 });
      gsap.set(v, { rotate: opening ? -45 : 90 });
      gsap.set(icon, { rotate: 0 });
      return;
    }
    if (opening) {
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
      return;
    }

    spinTweenRef.current = gsap
      .timeline({ defaults: { ease: "power3.inOut" } })
      .to(h, { rotate: 0, duration: 0.35 }, 0)
      .to(v, { rotate: 90, duration: 0.35 }, 0)
      .to(icon, { rotate: 0, duration: 0.001 }, 0);
  }, [mobileLiteMode]);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;

      colorTweenRef.current?.kill();
      if (mobileLiteMode) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        gsap.set(btn, { color: targetColor });
        return;
      }
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, { color: targetColor, delay: 0.18, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [changeMenuColorOnOpen, menuButtonColor, mobileLiteMode, openMenuButtonColor],
  );

  useEffect(() => {
    if (!toggleBtnRef.current) return;

    if (changeMenuColorOnOpen) {
      const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
      gsap.set(toggleBtnRef.current, { color: targetColor });
      return;
    }

    gsap.set(toggleBtnRef.current, { color: menuButtonColor });
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    if (mobileLiteMode) {
      setTextLines([opening ? "Close" : "Menu"]);
      gsap.set(inner, { yPercent: 0 });
      return;
    }

    const currentLabel = opening ? "Menu" : "Close";
    const targetLabel = opening ? "Close" : "Menu";
    const cycles = 3;

    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i += 1) {
      last = last === "Menu" ? "Close" : "Menu";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: "power4.out",
    });
  }, [mobileLiteMode]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [animateColor, animateIcon, animateText, onMenuClose, onMenuOpen, playClose, playOpen]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;

    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
  }, [animateColor, animateIcon, animateText, onMenuClose, playClose]);

  const handleItemClick = useCallback(
    (item: StaggeredMenuItem) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (item.onClick) {
        event.preventDefault();
        item.onClick();
      }
      closeMenu();
    },
    [closeMenu],
  );

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!panelRef.current || !toggleBtnRef.current) return;
      if (panelRef.current.contains(event.target as Node) || toggleBtnRef.current.contains(event.target as Node)) return;
      closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeOnClickAway, closeMenu, open]);

  return (
    <div
      className={`sm-scope ${isFixed ? "fixed inset-0 z-[70] h-screen w-screen overflow-hidden" : "relative z-[70] h-full w-full"}`}
      data-embedded={embedded || undefined}
    >
      <div
        className={`${className ? `${className} ` : ""}staggered-menu-wrapper pointer-events-none relative h-full w-full z-[70]`}
        style={accentColor ? ({ ["--sm-accent" as string]: accentColor } as CSSProperties) : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        {!mobileLiteMode ? (
          <div
            ref={preLayersRef}
            className="sm-prelayers absolute top-0 bottom-0 right-0 pointer-events-none z-[65]"
            aria-hidden="true"
          >
            {(() => {
              const raw = colors.length ? colors.slice(0, 4) : ["#1e1e22", "#35353c"];
              const arr = [...raw];
              if (arr.length >= 3) arr.splice(Math.floor(arr.length / 2), 1);

              return arr.map((c, i) => (
                <div key={`${c}-${i}`} className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0" style={{ background: c }} />
              ));
            })()}
          </div>
        ) : null}

        <header className="staggered-menu-header absolute top-0 left-0 z-[75] flex w-full items-center justify-between bg-transparent p-[1.1rem] pointer-events-none sm:p-[1.3rem]">
          {showLogo ? (
            <div className="sm-logo flex items-center select-none pointer-events-auto" aria-label="Logo">
              <Image
                src={logoUrl}
                alt="Logo"
                className="sm-logo-img block h-10 w-auto object-contain sm:h-12"
                width={110}
                height={40}
                priority
              />
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 pointer-events-auto">
            {headerActions}
            <button
              ref={toggleBtnRef}
              className="sm-toggle relative inline-flex items-center gap-[0.35rem] bg-transparent border-0 cursor-pointer font-medium leading-none overflow-visible pointer-events-auto"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="staggered-menu-panel"
              onClick={toggleMenu}
              type="button"
            >
              <span
                className="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap w-[var(--sm-toggle-width,auto)] min-w-[var(--sm-toggle-width,auto)]"
                aria-hidden="true"
              >
                <span ref={textInnerRef} className="sm-toggle-textInner flex flex-col leading-none">
                  {textLines.map((line, i) => (
                    <span className="sm-toggle-line block h-[1em] leading-none" key={`${line}-${i}`}>
                      {line}
                    </span>
                  ))}
                </span>
              </span>

              <span
                ref={iconRef}
                className="sm-icon relative inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center [will-change:transform]"
                aria-hidden="true"
              >
                <span
                  ref={plusHRef}
                  className="sm-icon-line absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-current [will-change:transform]"
                />
                <span
                  ref={plusVRef}
                  className="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-current [will-change:transform]"
                />
              </span>
            </button>
          </div>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 z-[68] flex h-full flex-col overflow-y-auto p-[6em_2em_2em_2em] pointer-events-auto"
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex flex-1 flex-col gap-5">
            <ul className="sm-panel-list m-0 flex list-none flex-col gap-2 p-0" role="list" data-numbering={displayItemNumbering || undefined}>
              {items.length ? (
                items.map((item, idx) => {
                  const content = (
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      {item.label}
                    </span>
                  );

                  return (
                    <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={`${item.label}-${idx}`}>
                      {isExternalLink(item.link) ? (
                        <a
                          className="sm-panel-item relative inline-block cursor-pointer pr-[1.4em] text-[4rem] font-semibold uppercase leading-none tracking-[-2px] no-underline transition-[background,color] duration-150 ease-linear"
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={item.ariaLabel}
                          data-index={idx + 1}
                          onClick={handleItemClick(item)}
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          className="sm-panel-item relative inline-block cursor-pointer pr-[1.4em] text-[4rem] font-semibold uppercase leading-none tracking-[-2px] no-underline transition-[background,color] duration-150 ease-linear"
                          href={item.link}
                          aria-label={item.ariaLabel}
                          data-index={idx + 1}
                          onClick={handleItemClick(item)}
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item relative inline-block cursor-pointer pr-[1.4em] text-[4rem] font-semibold uppercase leading-none tracking-[-2px]">
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      No items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {displaySocials && socialItems.length > 0 ? (
              <div className="sm-socials mt-auto flex flex-col gap-3 pt-8" aria-label="Social links">
                <h3 className="sm-socials-title m-0 text-base font-medium [color:var(--sm-accent,#ff0000)]">Socials</h3>
                <ul className="sm-socials-list m-0 flex list-none flex-row flex-wrap items-center gap-4 p-0" role="list">
                  {socialItems.map((social, i) => (
                    <li key={`${social.label}-${i}`} className="sm-socials-item">
                      <a
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link relative inline-block py-[2px] text-[1.2rem] font-medium no-underline transition-[color,opacity] duration-300 ease-linear"
                        onClick={closeMenu}
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 70; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1.1rem; background: transparent; pointer-events: none; z-index: 75; }
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope[data-embedded] { position: relative !important; inset: auto !important; width: auto !important; height: auto !important; overflow: visible !important; }
.sm-scope[data-embedded] .staggered-menu-wrapper { width: auto; height: auto; }
.sm-scope[data-embedded] .staggered-menu-header { position: relative; width: auto; left: auto; top: auto; padding: 0; justify-content: flex-end; }
.sm-scope[data-embedded] .sm-logo { display: none; }
.sm-scope[data-embedded] .staggered-menu-panel { position: fixed; top: 0; right: 0; height: 100vh; }
.sm-scope[data-embedded] .staggered-menu-wrapper[data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope[data-embedded] .sm-prelayers { position: fixed; top: 0; bottom: 0; right: 0; height: 100vh; }
.sm-scope[data-embedded] .staggered-menu-wrapper[data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-logo-img { display: block; height: 40px; width: auto; object-fit: contain; }
.sm-scope .sm-toggle { position: relative; display: inline-flex; align-items: center; gap: 0.35rem; background: transparent; border: none; cursor: pointer; color: var(--header-nav-solid-text-active); font-weight: 500; line-height: 1; overflow: visible; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid #ffffffaa; outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-toggle-textWrap { position: relative; margin-right: 0.5em; display: inline-block; height: 1em; overflow: hidden; white-space: nowrap; width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); }
.sm-scope .sm-toggle-textInner { display: flex; flex-direction: column; line-height: 1; }
.sm-scope .sm-toggle-line { display: block; height: 1em; line-height: 1; }
.sm-scope .sm-icon { position: relative; width: 14px; height: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; will-change: transform; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; width: 100%; height: 2px; background: currentColor; border-radius: 2px; transform: translate(-50%, -50%); will-change: transform; }
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: clamp(280px, 42vw, 480px); height: 100%; background: color-mix(in srgb, var(--background) 95%, transparent); color: var(--header-nav-solid-text-active); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; padding: 6em 2em 2em 2em; overflow-y: auto; z-index: 68; border-left: 1px solid color-mix(in srgb, var(--border) 45%, transparent); -ms-overflow-style: none; scrollbar-width: none; scrollbar-color: transparent transparent; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; will-change: transform; }
.sm-scope .staggered-menu-panel::-webkit-scrollbar { width: 2px; }
.sm-scope .staggered-menu-panel::-webkit-scrollbar-track { background: transparent; }
.sm-scope .staggered-menu-panel::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; }
.sm-scope .staggered-menu-panel:hover::-webkit-scrollbar-thumb,
.sm-scope .staggered-menu-panel:focus-within::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--foreground) 18%, transparent); }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: clamp(280px, 42vw, 480px); pointer-events: none; z-index: 65; }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 1rem; font-weight: 500; color: var(--sm-accent, #ff0000); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff0000); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.2rem; font-weight: 500; color: var(--header-nav-solid-text-active); text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sm-scope .sm-panel-item { position: relative; color: var(--header-nav-solid-text-active); font-weight: 600; font-size: 4rem; cursor: pointer; line-height: 1; letter-spacing: -2px; text-transform: uppercase; transition: background 0.25s, color 0.25s; display: inline-block; text-decoration: none; padding-right: 1.4em; }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff0000); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 3.2em; font-size: 18px; font-weight: 400; color: var(--sm-accent, #ff0000); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
@media (max-width: 1024px) {
  .sm-scope .staggered-menu-panel,
  .sm-scope .sm-prelayers { width: 100%; left: 0; right: 0; }
}
@media (max-width: 640px) {
  .sm-scope .staggered-menu-panel,
  .sm-scope .sm-prelayers { width: 100%; left: 0; right: 0; }
  .sm-scope .staggered-menu-panel { background: var(--background); backdrop-filter: none; -webkit-backdrop-filter: none; border-left: none; }
  .sm-scope .sm-prelayers { display: none; }
  .sm-scope .sm-panel-itemLabel { will-change: auto; }
  .sm-scope .sm-panel-item { font-size: clamp(2.2rem, 12vw, 3.2rem); }
}
      `}</style>
    </div>
  );
}

export default StaggeredMenu;
