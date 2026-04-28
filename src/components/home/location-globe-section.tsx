"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted)]">
      Loading interactive globe...
    </div>
  ),
});

const RESTAURANT_LOCATION = {
  lat: 22.520431299538842,
  lng: 88.36600789920163,
};

const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT_LOCATION.lat},${RESTAURANT_LOCATION.lng}`;

const getTheme = () => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") ?? "light";
};

function buildMeshData() {
  let seed = 54321;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };

  const nodes: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < 220; i++) {
    nodes.push({ lat: rand() * 160 - 80, lng: rand() * 360 - 180 });
  }

  const arcs: Array<{ startLat: number; startLng: number; endLat: number; endLng: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    const nbrs: Array<{ j: number; dist: number }> = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dlat = nodes[i].lat - nodes[j].lat;
      let dlng = Math.abs(nodes[i].lng - nodes[j].lng);
      if (dlng > 180) dlng = 360 - dlng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      if (dist < 20) nbrs.push({ j, dist });
    }
    nbrs
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .forEach(({ j }) => {
        arcs.push({
          startLat: nodes[i].lat,
          startLng: nodes[i].lng,
          endLat: nodes[j].lat,
          endLng: nodes[j].lng,
        });
      });
  }

  return { nodes, arcs };
}

const MESH = buildMeshData();

const GLOBE_COLOR: Record<string, string> = {
  light: "#f5f3ef",
  dark: "#08080d",
  amoled: "#000000",
};

export function LocationGlobeSection() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const globeStageRef = useRef<HTMLDivElement | null>(null);

  const [theme, setTheme] = useState<string>("light");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [globeSize, setGlobeSize] = useState(0);
  const [countries, setCountries] = useState<{ features: object[] }>({ features: [] });
  const [globeTexture, setGlobeTexture] = useState<string | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px), (pointer: coarse)");
    const update = () => setIsTouchDevice(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((data: { features: object[] }) => setCountries(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const update = () => setTheme(getTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hex = GLOBE_COLOR[theme] ?? GLOBE_COLOR.light;
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 4, 4);
    setGlobeTexture(canvas.toDataURL("image/png"));
  }, [theme]);

  useEffect(() => {
    const stage = globeStageRef.current;
    if (!stage) return;

    const updateSize = () => {
      setGlobeSize(Math.floor(Math.min(stage.clientWidth, stage.clientHeight)));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let removeTouchGuards: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      const globe = globeRef.current;
      if (!globe) return;

      globe.pointOfView({ ...RESTAURANT_LOCATION, altitude: 1.5 }, 1200);
      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.36;
      controls.enableDamping = true;
      controls.dampingFactor = 0.085;
      controls.minDistance = 120;
      controls.maxDistance = 420;
      controls.enablePan = false;

      const controlDom = controls.domElement as HTMLElement | undefined;
      if (controlDom) {
        controlDom.style.touchAction = isTouchDevice ? "pan-y" : "none";
      }

      if (!isTouchDevice || !controlDom) {
        controls.enabled = true;
        controls.enableRotate = true;
        controls.enableZoom = true;
        return;
      }

      // Mobile behavior:
      // 1 finger -> page scroll (globe controls off)
      // 2+ fingers -> globe interaction (rotate/zoom on)
      controls.enabled = false;
      controls.enableRotate = false;
      controls.enableZoom = false;

      const setInteractionMode = (event: TouchEvent) => {
        const twoFingerGesture = event.touches.length >= 2;

        controls.enabled = twoFingerGesture;
        controls.enableRotate = twoFingerGesture;
        controls.enableZoom = twoFingerGesture;
        controls.autoRotate = !twoFingerGesture;

        if (twoFingerGesture) {
          event.preventDefault();
        }
      };

      const onTouchStart = (event: TouchEvent) => setInteractionMode(event);
      const onTouchMove = (event: TouchEvent) => setInteractionMode(event);
      const onTouchEnd = () => {
        controls.enabled = false;
        controls.enableRotate = false;
        controls.enableZoom = false;
        controls.autoRotate = true;
      };

      const options: AddEventListenerOptions = { capture: true, passive: false };
      controlDom.addEventListener("touchstart", onTouchStart, options);
      controlDom.addEventListener("touchmove", onTouchMove, options);
      controlDom.addEventListener("touchend", onTouchEnd, options);
      controlDom.addEventListener("touchcancel", onTouchEnd, options);

      removeTouchGuards = () => {
        controlDom.removeEventListener("touchstart", onTouchStart, options);
        controlDom.removeEventListener("touchmove", onTouchMove, options);
        controlDom.removeEventListener("touchend", onTouchEnd, options);
        controlDom.removeEventListener("touchcancel", onTouchEnd, options);
      };
    }, 160);

    return () => {
      window.clearTimeout(timer);
      removeTouchGuards?.();
    };
  }, [isTouchDevice]);

  const meshPoints = useMemo(
    () => [
      ...MESH.nodes.map((n) => ({ ...n, kind: "mesh" as const })),
      { ...RESTAURANT_LOCATION, kind: "anchor" as const },
    ],
    [],
  );
  const markerData = useMemo(() => [{ ...RESTAURANT_LOCATION, label: "Ms Ginko" }], []);

  const isAmoled = theme === "amoled";
  const isDark = theme === "dark" || isAmoled;

  const polyStroke = isAmoled ? "#ffaa55" : isDark ? "#d97b3a" : "#c46a28";
  const polyCap = isDark ? "rgba(220,110,40,0.09)" : "rgba(185,75,15,0.05)";
  const polySide = isAmoled ? "rgba(255,150,60,0.52)" : isDark ? "rgba(220,110,40,0.38)" : "rgba(185,75,15,0.24)";
  const arcCol = isAmoled ? "rgba(100,220,255,0.30)" : isDark ? "rgba(130,185,255,0.30)" : "rgba(65,125,210,0.38)";
  const nodeCol = isAmoled ? "rgba(130,225,255,0.70)" : isDark ? "rgba(150,195,255,0.65)" : "rgba(75,140,215,0.62)";
  const markerColor = isAmoled ? "#97f3ff" : "#e07835";

  const onGetDirections = useCallback(() => {
    window.open(DIRECTIONS_URL, "_blank", "noopener,noreferrer");
  }, []);

  const renderPinElement = useCallback(() => {
    const anchor = document.createElement("div");
    anchor.className = "globe-pin-anchor";

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "globe-pin-marker";
    marker.style.setProperty("--pin-main", markerColor);
    marker.style.setProperty("--pin-core", isAmoled ? "#e8fcff" : "#fff7f2");
    marker.setAttribute("aria-label", "Open directions to Ms Ginko");
    marker.innerHTML = `
      <span class="globe-pin-glow" aria-hidden="true"></span>
      <svg class="globe-pin-svg" viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="pinFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="var(--pin-main)" stop-opacity="0.98" />
            <stop offset="100%" stop-color="var(--pin-main)" stop-opacity="0.58" />
          </linearGradient>
        </defs>
        <path d="M32 4C19.3 4 9 14.2 9 26.9c0 15 11.2 24.8 21.7 40.9a1.8 1.8 0 0 0 2.9 0C43.8 51.8 55 42 55 26.9 55 14.2 44.7 4 32 4Z" fill="url(#pinFill)" />
        <path d="M32 4C19.3 4 9 14.2 9 26.9c0 15 11.2 24.8 21.7 40.9a1.8 1.8 0 0 0 2.9 0C43.8 51.8 55 42 55 26.9 55 14.2 44.7 4 32 4Z" fill="none" stroke="rgba(255,255,255,0.72)" stroke-width="1.6" />
        <circle cx="32" cy="27" r="10.5" fill="var(--pin-core)" fill-opacity="0.95" />
        <circle cx="32" cy="27" r="6.4" fill="var(--pin-main)" fill-opacity="0.9" />
      </svg>
      <span class="globe-pin-pulse" aria-hidden="true"></span>
    `;
    marker.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      onGetDirections();
    };
    anchor.appendChild(marker);
    return anchor;
  }, [isAmoled, markerColor, onGetDirections]);

  return (
    <section id="location" className="bg-[var(--background)] py-12 sm:py-16">
      <div className="page-inner">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="ui-eyebrow">Find Us</p>
          <h2 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.03em] text-[var(--foreground)] sm:text-6xl">
            MISS GINKO
          </h2>
          <p className="ui-copy mt-4 max-w-2xl text-sm leading-6 sm:text-base">
            Desktop: drag to rotate, scroll to zoom. Mobile: use one finger to scroll the page, two fingers to
            rotate/zoom the globe. Tap the marker to open directions to Ms Ginko in Kolkata.
          </p>

          <div
            ref={globeStageRef}
            className="relative mt-6 grid h-[28rem] w-full place-items-center sm:h-[40rem] lg:h-[48rem]"
          >
            {globeSize > 0 && globeTexture ? (
              <div
                className="grid place-items-center"
                style={{ width: `${globeSize}px`, height: `${globeSize}px` }}
              >
                <Globe
                  ref={globeRef}
                  width={globeSize}
                  height={globeSize}
                  animateIn
                  waitForGlobeReady
                  backgroundColor="rgba(0,0,0,0)"
                  showGlobe
                  globeImageUrl={globeTexture}
                  showAtmosphere={false}
                  polygonsData={countries.features}
                  polygonCapColor={() => polyCap}
                  polygonSideColor={() => polySide}
                  polygonStrokeColor={() => polyStroke}
                  polygonAltitude={0.013}
                  polygonLabel={() => ""}
                  arcsData={MESH.arcs}
                  arcStartLat="startLat"
                  arcStartLng="startLng"
                  arcEndLat="endLat"
                  arcEndLng="endLng"
                  arcColor={() => arcCol}
                  arcStroke={0.22}
                  arcAltitude={0.01}
                  pointsData={meshPoints}
                  pointLat="lat"
                  pointLng="lng"
                  pointColor={(d: object) =>
                    (d as { kind: "mesh" | "anchor" }).kind === "anchor" ? "rgba(0,0,0,0)" : nodeCol
                  }
                  pointRadius={(d: object) =>
                    (d as { kind: "mesh" | "anchor" }).kind === "anchor" ? 0.52 : 0.16
                  }
                  pointAltitude={(d: object) =>
                    (d as { kind: "mesh" | "anchor" }).kind === "anchor" ? 0.02 : 0.01
                  }
                  onPointClick={(d: object) => {
                    if ((d as { kind: "mesh" | "anchor" }).kind === "anchor") onGetDirections();
                  }}
                  htmlElementsData={markerData}
                  htmlLat="lat"
                  htmlLng="lng"
                  htmlAltitude={0.012}
                  htmlElement={renderPinElement}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex max-w-md flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--label)]">Ms Ginko</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">22.5204313, 88.3660079</p>
            <p className="ui-copy text-sm leading-6">
              Tap the glowing marker on the globe or use the button below to start navigation.
            </p>
            <button
              type="button"
              onClick={onGetDirections}
              className="ui-btn-primary mt-2 w-full justify-center px-5 py-3 text-[11px] sm:w-auto sm:min-w-[13rem]"
            >
              Get Directions
            </button>
            <Link href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="ui-copy text-xs">
              Open in Maps
            </Link>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .globe-pin-anchor {
          height: 1px;
          overflow: visible;
          position: relative;
          pointer-events: auto !important;
          width: 1px;
        }

        .globe-pin-marker {
          left: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 76px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          pointer-events: auto !important;
        }

        .globe-pin-svg {
          width: 50px;
          height: 68px;
          display: block;
          filter:
            drop-shadow(0 0 8px color-mix(in srgb, var(--pin-main) 60%, transparent))
            drop-shadow(0 0 18px color-mix(in srgb, var(--pin-main) 40%, transparent));
          animation: globe-pin-float 2.1s ease-in-out infinite;
        }

        .globe-pin-glow {
          position: absolute;
          top: 18px;
          left: 50%;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--pin-main) 88%, white) 0%,
            color-mix(in srgb, var(--pin-main) 24%, transparent) 60%,
            transparent 100%
          );
          filter: blur(1.3px);
          pointer-events: none;
        }

        .globe-pin-pulse {
          position: absolute;
          left: 50%;
          bottom: 5px;
          width: 15px;
          height: 15px;
          border-radius: 999px;
          transform: translate(-50%, 50%);
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--pin-main) 72%, transparent);
          animation: globe-pin-pulse 1.45s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          pointer-events: none;
        }

        .globe-pin-marker:hover .globe-pin-svg {
          filter:
            drop-shadow(0 0 10px color-mix(in srgb, var(--pin-main) 70%, transparent))
            drop-shadow(0 0 26px color-mix(in srgb, var(--pin-main) 55%, transparent));
        }

        .globe-pin-marker:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--pin-main) 76%, white);
          outline-offset: 2px;
          border-radius: 999px;
        }

        @keyframes globe-pin-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes globe-pin-pulse {
          0% {
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--pin-main) 70%, transparent);
            opacity: 0.95;
          }
          100% {
            box-shadow: 0 0 0 18px color-mix(in srgb, var(--pin-main) 0%, transparent);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
