"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Seeded LCG for deterministic mesh across renders
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

// Globe surface CSS colors per theme
const GLOBE_COLOR: Record<string, string> = {
  light:  "#f5f3ef",
  dark:   "#08080d",
  amoled: "#000000",
};

export function LocationGlobeSection() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const globeStageRef = useRef<HTMLDivElement | null>(null);

  const [theme, setTheme] = useState<string>("light");
  const [globeSize, setGlobeSize] = useState(0);
  const [countries, setCountries] = useState<{ features: object[] }>({ features: [] });
  const [globeTexture, setGlobeTexture] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((data: { features: object[] }) => setCountries(data))
      .catch(() => {});
  }, []);

  // Track theme changes
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

  // Rebuild solid-color globe texture whenever theme changes
  useEffect(() => {
    const hex = GLOBE_COLOR[theme] ?? GLOBE_COLOR.light;
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext("2d")!;
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
    }, 160);
    return () => window.clearTimeout(timer);
  }, []);

  const allPoints = useMemo(
    () => [
      ...MESH.nodes.map((n) => ({ ...n, type: "mesh" as const })),
      { ...RESTAURANT_LOCATION, type: "pin" as const, label: "Ms Ginko" },
    ],
    [],
  );

  const markerData = useMemo(() => [RESTAURANT_LOCATION], []);

  const onGetDirections = () => {
    window.open(DIRECTIONS_URL, "_blank", "noopener,noreferrer");
  };

  const isAmoled = theme === "amoled";
  const isDark   = theme === "dark" || isAmoled;

  // Theme-adaptive line colors
  const polyStroke = isAmoled ? "#ffaa55" : isDark ? "#d97b3a" : "#c46a28";
  const polyCap    = isDark ? "rgba(220,110,40,0.09)" : "rgba(185,75,15,0.05)";
  const polySide   = isAmoled ? "rgba(255,150,60,0.52)" : isDark ? "rgba(220,110,40,0.38)" : "rgba(185,75,15,0.24)";
  const arcCol     = isAmoled ? "rgba(100,220,255,0.30)" : isDark ? "rgba(130,185,255,0.30)" : "rgba(65,125,210,0.38)";
  const nodeCol    = isAmoled ? "rgba(130,225,255,0.70)" : isDark ? "rgba(150,195,255,0.65)" : "rgba(75,140,215,0.62)";
  const markerColor = isAmoled ? "#97f3ff" : "#e07835";
  const ringStart   = isAmoled ? "rgba(151,243,255,0.98)" : "rgba(224,120,53,0.92)";
  const ringEnd     = isAmoled ? "rgba(151,243,255,0)"    : "rgba(224,120,53,0)";

  return (
    <section id="location" className="bg-[var(--background)] py-12 sm:py-16">
      <div className="page-inner">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="ui-eyebrow">Find Us</p>
          <h2 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.03em] text-[var(--foreground)] sm:text-6xl">
            MISS GINKO
          </h2>
          <p className="ui-copy mt-4 max-w-2xl text-sm leading-6 sm:text-base">
            Drag to rotate, pinch or scroll to zoom. Tap the marker to open directions to Ms Ginko in Kolkata.
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
                  // Solid-color sphere — color matches page theme
                  showGlobe
                  globeImageUrl={globeTexture}
                  showAtmosphere={false}
                  // Continent outlines
                  polygonsData={countries.features}
                  polygonCapColor={() => polyCap}
                  polygonSideColor={() => polySide}
                  polygonStrokeColor={() => polyStroke}
                  polygonAltitude={0.013}
                  polygonLabel={() => ""}
                  // Mesh arc network
                  arcsData={MESH.arcs}
                  arcStartLat="startLat"
                  arcStartLng="startLng"
                  arcEndLat="endLat"
                  arcEndLng="endLng"
                  arcColor={() => arcCol}
                  arcStroke={0.22}
                  arcAltitude={0.01}
                  // Mesh nodes + restaurant pin
                  pointsData={allPoints}
                  pointLat="lat"
                  pointLng="lng"
                  pointColor={(d: object) => {
                    const p = d as { type: "mesh" | "pin" };
                    return p.type === "pin" ? markerColor : nodeCol;
                  }}
                  pointRadius={(d: object) => {
                    const p = d as { type: "mesh" | "pin" };
                    return p.type === "pin" ? 0.82 : 0.16;
                  }}
                  pointAltitude={(d: object) => {
                    const p = d as { type: "mesh" | "pin" };
                    return p.type === "pin" ? 0.08 : 0.01;
                  }}
                  pointLabel={(d: object) => {
                    const p = d as { type: "mesh" | "pin"; label?: string };
                    if (p.type !== "pin") return "";
                    return `<div style="padding:6px 8px;border-radius:10px;background:rgba(0,0,0,.78);color:#fff;font-size:12px;letter-spacing:.03em;">${p.label ?? "Ms Ginko"} — Click for directions</div>`;
                  }}
                  onPointClick={(d: object) => {
                    const p = d as { type: "mesh" | "pin" };
                    if (p.type === "pin") onGetDirections();
                  }}
                  // Pulsing ring on restaurant
                  ringsData={markerData}
                  ringLat="lat"
                  ringLng="lng"
                  ringColor={() => [ringStart, ringEnd]}
                  ringMaxRadius={isAmoled ? 10.5 : 8.5}
                  ringPropagationSpeed={1.15}
                  ringRepeatPeriod={760}
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
    </section>
  );
}
