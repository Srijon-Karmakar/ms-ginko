import Image from "next/image";
import Link from "next/link";

import { HeroTakeover } from "@/components/home/hero-takeover";
import { siteConfig } from "@/lib/site-data";

const galleryPhotos = [
  {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=75",
    alt: "Warmly lit café interior",
  },
  {
    src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=75",
    alt: "Pancakes with strawberry sauce",
  },
  {
    src: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=75",
    alt: "Salmon dish with fresh herbs",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: siteConfig.name,
  description: siteConfig.description,
  servesCuisine: ["Australian", "Brunch", "Coffee"],
  url: siteConfig.url,
  telephone: siteConfig.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address,
    addressLocality: "Downtown District",
    addressCountry: "US",
  },
};

export default function Home() {
  return (
    <>
      <HeroTakeover />

      {/* ── THIS SEASON ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--accent)] py-10 sm:py-16">
        {/* Decorative botanical line */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 500"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
          >
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "rgba(255,245,235,0.28)", strokeWidth: "2.5" }}
              d="M 950,20 C 970,80 980,150 960,210 C 940,270 900,300 900,360 C 900,420 940,450 950,500
                 M 960,210 C 995,218 1028,232 1048,262 C 1068,292 1055,332 1032,350 C 1010,368 980,365 968,395"
            />
          </svg>
        </div>

        <div className="page-inner relative z-10 text-[var(--accent-contrast)]">
          <p className="ui-eyebrow text-center tracking-[0.22em] !text-[rgba(255,248,242,0.6)]">
            This Season at Ms Ginko
          </p>

          {/* Handwriting draw animation */}
          <p
            className="script-reveal my-4 block"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize: "clamp(2.8rem, 9vw, 9rem)",
              lineHeight: 1.05,
              color: "rgba(255,248,242,0.88)",
            }}
          >
            Not Hype
          </p>

          {/* Two columns */}
          <div className="mt-6 grid gap-0 sm:grid-cols-2">
            <div className="space-y-3 sm:border-r sm:border-[rgba(255,248,242,0.18)] sm:pr-8">
              <h2 className="scroll-reveal text-2xl font-bold uppercase tracking-[0.04em]">
                Seasonal Brunch, Slow Coffee
              </h2>
              <p
                className="scroll-reveal text-base leading-7 text-[rgba(255,248,242,0.78)]"
                data-delay="1"
              >
                Fresh focaccia, delicate tiramisu brioche with mascarpone cream, rotating seasonal
                pancakes with house-made compotes. Every menu is generous without being heavy.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal mt-2 block text-[var(--accent-contrast)] opacity-90"
                data-delay="2"
              >
                ← Brunch time
              </Link>
            </div>
            <div className="mt-6 space-y-3 border-t border-[rgba(255,248,242,0.18)] pt-6 sm:mt-0 sm:border-t-0 sm:pl-8 sm:pt-0">
              <h2
                className="scroll-reveal text-2xl font-bold uppercase tracking-[0.04em]"
                data-delay="1"
              >
                Guest Coffee: Specialty Rotation
              </h2>
              <p
                className="scroll-reveal text-base leading-7 text-[rgba(255,248,242,0.78)]"
                data-delay="2"
              >
                Each season we bring in a specialty roaster. This month discover single-origin
                filter and espresso coffees — available on-site and to take home.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal mt-2 block text-[var(--accent-contrast)] opacity-90"
                data-delay="3"
              >
                Coffee time →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRUNCH ──────────────────────────────────────── */}
      <section className="overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none select-none overflow-hidden">
          <p className="section-watermark">BRUNCH</p>
        </div>

        <div className="page-inner -mt-10 pb-14 sm:-mt-20 lg:-mt-28">
          <p
            className="script-reveal block"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize: "clamp(2.5rem, 7vw, 8rem)",
              color: "var(--accent)",
              lineHeight: 1.15,
            }}
          >
            9am – 2pm
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <p
              className="scroll-reveal text-4xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Fresh and tasty recipes inspired by the Australian brunch scene
            </p>
            <div className="space-y-4 lg:pt-3">
              <p className="scroll-reveal ui-copy text-base leading-7" data-delay="1">
                Aussie vibes in the heart of the city — at Ms Ginko, brunch means colourful,
                generous and creative plates, prepared with local and seasonal ingredients.
              </p>
              <p
                className="scroll-reveal font-semibold italic text-[var(--foreground)]"
                data-delay="2"
              >
                Every season brings its own brunch!
              </p>
              <p className="scroll-reveal ui-copy text-base leading-7" data-delay="2">
                Three months to explore new sweet and savoury recipes imagined by our kitchen team.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal text-[var(--foreground)]"
                data-delay="3"
              >
                The Aussie brunch →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ───────────────────────────────── */}
      <section
        className="flex gap-2 overflow-x-auto px-3 sm:gap-0 sm:overflow-hidden sm:px-0"
        style={{ height: "clamp(190px, 40vw, 520px)" }}
      >
        {galleryPhotos.map((photo, i) => (
          <div key={photo.src} className="relative min-w-[78%] overflow-hidden rounded-md sm:min-w-0 sm:flex-1 sm:rounded-none">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="33vw"
              priority={i === 0}
            />
          </div>
        ))}
      </section>

      {/* ── COFFEE ──────────────────────────────────────── */}
      <section className="overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none select-none overflow-hidden">
          <p className="section-watermark">COFFEE</p>
        </div>

        <div className="page-inner -mt-10 pb-14 sm:-mt-20 lg:-mt-28">
          <p
            className="script-reveal block"
            style={{
              fontFamily: "var(--font-script), cursive",
              fontSize: "clamp(2.5rem, 7vw, 8rem)",
              color: "var(--accent)",
              lineHeight: 1.15,
            }}
          >
            All day
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <p
              className="scroll-reveal text-4xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Explore specialty coffee in a warm, welcoming atmosphere
            </p>
            <div className="space-y-4 lg:pt-3">
              <p className="scroll-reveal ui-copy text-base leading-7" data-delay="1">
                We work with different brewing methods to satisfy every preference: espresso, creamy
                cappuccino, Aussie-style flat white, filter brews...
              </p>
              <p
                className="scroll-reveal font-semibold italic text-[var(--foreground)]"
                data-delay="2"
              >
                Coffee not your cup of tea?
              </p>
              <p className="scroll-reveal ui-copy text-base leading-7" data-delay="2">
                Try our white drinks — chai, matcha — our teas, fresh drinks and selected juices.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal text-[var(--foreground)]"
                data-delay="3"
              >
                The specialty coffee →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAFÉ STORY ──────────────────────────────────── */}
      <section className="overflow-hidden bg-[var(--background)]">
        {/* SVG café illustration — draws in on scroll */}
        <div className="relative mx-auto max-w-5xl px-2 sm:px-4">
          <svg
            viewBox="0 0 1000 520"
            className="w-full"
            aria-hidden="true"
            style={{
              fill: "none",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            } as React.CSSProperties}
          >
            {/* Stone arch */}
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 60,520 L 60,295 Q 500,20 940,295 L 940,520"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
            {/* Stone blocks — left */}
            {(
              [
                [60, 238], [135, 238], [60, 183], [135, 183], [60, 128], [135, 128],
              ] as [number, number][]
            ).map(([x, y], i) => (
              <rect
                key={`bl${i}`}
                x={x}
                y={y}
                width={70}
                height={48}
                rx={3}
                className="scroll-reveal"
                style={{
                  stroke: "color-mix(in srgb, var(--accent) 28%, #dcc0b0)",
                  strokeWidth: "1.5",
                  transitionDelay: `${i * 55}ms`,
                }}
              />
            ))}
            {/* Stone blocks — right */}
            {(
              [
                [795, 238], [868, 238], [795, 183], [868, 183], [795, 128], [868, 128],
              ] as [number, number][]
            ).map(([x, y], i) => (
              <rect
                key={`br${i}`}
                x={x}
                y={y}
                width={70}
                height={48}
                rx={3}
                className="scroll-reveal"
                style={{
                  stroke: "color-mix(in srgb, var(--accent) 28%, #dcc0b0)",
                  strokeWidth: "1.5",
                  transitionDelay: `${i * 55}ms`,
                }}
              />
            ))}
            {/* Counter */}
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 60,430 L 940,430 L 940,520 L 60,520"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 45%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
            {/* Shelves */}
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 185,340 L 375,340 M 185,385 L 375,385 M 625,340 L 815,340 M 625,385 L 815,385"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 36%, #dcc0b0)",
                strokeWidth: "1.8",
              }}
            />
            {/* Centre window */}
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 385,255 L 385,410 L 615,410 L 615,255 Z"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "1.8",
              }}
            />
            {/* Plant */}
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 500,430 L 500,365 C 478,338 452,312 442,278 M 500,388 C 524,358 546,338 556,302"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
            {/* Logo inside window */}
            <text
              x="500"
              y="330"
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-script), cursive",
                fontSize: "38px",
                fill: "color-mix(in srgb, var(--accent) 55%, #dcc0b0)",
                stroke: "none",
              }}
            >
              ms ginko
            </text>
            <text
              x="500"
              y="362"
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: "11px",
                fill: "color-mix(in srgb, var(--accent) 48%, #dcc0b0)",
                stroke: "none",
                letterSpacing: "0.14em",
              }}
            >
              COFFEE + KITCHEN
            </text>
          </svg>
        </div>

        {/* Story on terracotta */}
        <div className="bg-[var(--accent)] py-10 sm:py-12">
          <div className="page-inner grid gap-6 text-[var(--accent-contrast)] lg:grid-cols-2">
            <p
              className="scroll-reveal text-3xl font-bold italic leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              A warm place, a passionate team — a story to share in the heart of the city
            </p>
            <div className="space-y-4">
              <p
                className="scroll-reveal text-base leading-7 text-[rgba(255,248,242,0.8)]"
                data-delay="1"
              >
                Ms Ginko promises an Australian-inspired escape where passion and people are at the
                centre of everything. Between creativity and craftsmanship, we share a love for
                flavour.
              </p>
              <Link
                href="/about"
                className="arrow-link scroll-reveal text-[var(--accent-contrast)]"
                data-delay="2"
              >
                Hey mate! →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
