import Link from "next/link";

import { HeroTakeover } from "@/components/home/hero-takeover";
import { HorizontalGalleryRail } from "@/components/home/horizontal-gallery-rail";
import { siteConfig, testimonials } from "@/lib/site-data";

const galleryPhotos = [
  {
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80",
    alt: "Warmly lit cafe interior",
  },
  {
    src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1800&q=80",
    alt: "Pancakes with strawberry sauce",
  },
  {
    src: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1800&q=80",
    alt: "Salmon dish with fresh herbs",
  },
  {
    src: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1800&q=80",
    alt: "Chef plating a gourmet dish",
  },
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80",
    alt: "Fine dining table setting with wine glasses",
  },
  {
    src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1800&q=80",
    alt: "Brunch spread with coffee and pastries",
  },
  {
    src: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1800&q=80",
    alt: "Specialty coffee poured into cup",
  },
  {
    src: "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1800&q=80",
    alt: "Freshly prepared brunch plate",
  },
  {
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80",
    alt: "Restaurant kitchen and plated meals",
  },
  {
    src: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1800&q=80",
    alt: "Wooden table with artisanal dishes",
  },
  {
    src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1800&q=80",
    alt: "Colorful salad and healthy brunch bowl",
  },
  {
    src: "https://images.unsplash.com/photo-1457666134378-6b77915bd5f2?auto=format&fit=crop&w=1800&q=80",
    alt: "Coffee bar with pour-over equipment",
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
      <section id="hero">
        <HeroTakeover />
      </section>

      <section id="about" className="relative isolate overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ zIndex: -1 }}>
          <svg
            viewBox="0 0 1200 620"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            style={{ fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as React.CSSProperties}
          >
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 26%, #dcc0b0)", strokeWidth: "2" }}
              d="M 1065,25 C 1095,110 1106,205 1078,295 C 1050,385 1022,435 1046,522"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 20%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 1078,295 C 1112,307 1142,330 1158,366 C 1170,395 1158,428 1132,440"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 18%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 118,310 C 96,365 88,425 108,478"
            />
          </svg>
        </div>
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
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 60,520 L 60,295 Q 500,20 940,295 L 940,520"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
            {(
              [
                [60, 238],
                [135, 238],
                [60, 183],
                [135, 183],
                [60, 128],
                [135, 128],
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
            {(
              [
                [795, 238],
                [868, 238],
                [795, 183],
                [868, 183],
                [795, 128],
                [868, 128],
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
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 60,430 L 940,430 L 940,520 L 60,520"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 45%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 185,340 L 375,340 M 185,385 L 375,385 M 625,340 L 815,340 M 625,385 L 815,385"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 36%, #dcc0b0)",
                strokeWidth: "1.8",
              }}
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 385,255 L 385,410 L 615,410 L 615,255 Z"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "1.8",
              }}
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              d="M 500,430 L 500,365 C 478,338 452,312 442,278 M 500,388 C 524,358 546,338 556,302"
              style={{
                stroke: "color-mix(in srgb, var(--accent) 38%, #dcc0b0)",
                strokeWidth: "2",
              }}
            />
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

        <div className="bg-[var(--accent)] py-10 sm:py-12">
          <div className="page-inner grid gap-6 text-[var(--accent-contrast)] lg:grid-cols-2">
            <p
              className="headline-reveal text-3xl font-bold italic leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              A warm place, a passionate team - a story to share in the heart of the city
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
                Hey mate! -
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="menus" className="relative isolate overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ zIndex: -1 }}>
          <svg
            viewBox="0 0 1200 560"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            style={{ fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as React.CSSProperties}
          >
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 24%, #dcc0b0)", strokeWidth: "2" }}
              d="M 1005,18 C 1035,98 1046,188 1020,278 C 994,368 968,418 990,508"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 18%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 1020,278 C 1054,290 1082,312 1098,348 C 1112,378 1100,412 1074,424"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 16%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 1116,22 C 1148,62 1164,108 1154,154 C 1144,200 1116,226 1114,272"
            />
          </svg>
        </div>
        <div className="pointer-events-none select-none overflow-hidden">
          <p className="section-watermark watermark-reveal">BRUNCH</p>
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
            9am - 2pm
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <p
              className="headline-reveal text-4xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Fresh and tasty recipes inspired by the Australian brunch scene
            </p>
            <div className="space-y-4 lg:pt-3">
              <p className="scroll-reveal ui-copy text-base leading-7" data-delay="1">
                Aussie vibes in the heart of the city - at Ms Ginko, brunch means colourful,
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
                The Aussie brunch -&gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[var(--background)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ zIndex: -1 }}>
          <svg
            viewBox="0 0 1200 560"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            style={{ fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as React.CSSProperties}
          >
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 24%, #dcc0b0)", strokeWidth: "2" }}
              d="M 195,18 C 165,98 154,188 180,278 C 206,368 232,418 210,508"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 18%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 180,278 C 146,290 118,312 102,348 C 88,378 100,412 126,424"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 16%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 84,22 C 52,62 36,108 46,154 C 56,200 84,226 86,272"
            />
          </svg>
        </div>
        <div className="pointer-events-none select-none overflow-hidden">
          <p className="section-watermark watermark-reveal">COFFEE</p>
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
              className="headline-reveal text-4xl font-bold italic leading-tight text-[var(--foreground)] sm:text-5xl"
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
                Try our white drinks - chai, matcha - our teas, fresh drinks and selected juices.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal text-[var(--foreground)]"
                data-delay="3"
              >
                The specialty coffee -&gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="featured" className="relative overflow-hidden bg-[var(--accent)] py-10 sm:py-16">
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
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "rgba(255,245,235,0.22)", strokeWidth: "2" }}
              d="M 248,22 C 218,96 208,176 228,250 C 248,324 276,364 264,434 C 252,494 228,494 240,494"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "rgba(255,245,235,0.15)", strokeWidth: "1.5" }}
              d="M 228,250 C 194,262 164,284 148,318 C 134,348 146,380 170,392"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "rgba(255,245,235,0.13)", strokeWidth: "1.5" }}
              d="M 78,28 C 48,82 36,144 54,198 C 72,252 98,280 92,336"
            />
          </svg>
        </div>

        <div className="page-inner relative z-10 text-[var(--accent-contrast)]">
          <p className="ui-eyebrow text-center tracking-[0.22em] !text-[rgba(255,248,242,0.6)]">
            This Season at Ms Ginko
          </p>

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

          <div className="mt-6 grid gap-0 sm:grid-cols-2">
            <div className="space-y-3 sm:border-r sm:border-[rgba(255,248,242,0.18)] sm:pr-8">
              <h2 className="headline-reveal text-2xl font-bold uppercase tracking-[0.04em]">
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
                Brunch time
              </Link>
            </div>
            <div className="mt-6 space-y-3 border-t border-[rgba(255,248,242,0.18)] pt-6 sm:mt-0 sm:border-t-0 sm:pl-8 sm:pt-0">
              <h2
                className="headline-reveal text-2xl font-bold uppercase tracking-[0.04em]"
                data-delay="1"
              >
                Guest Coffee: Specialty Rotation
              </h2>
              <p
                className="scroll-reveal text-base leading-7 text-[rgba(255,248,242,0.78)]"
                data-delay="2"
              >
                Each season we bring in a specialty roaster. This month discover single-origin
                filter and espresso coffees - available on-site and to take home.
              </p>
              <Link
                href="/menu"
                className="arrow-link scroll-reveal mt-2 block text-[var(--accent-contrast)] opacity-90"
                data-delay="3"
              >
                Coffee time -&gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HorizontalGalleryRail photos={galleryPhotos} />

      <section id="reservation" className="relative isolate bg-[var(--background)] py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ zIndex: -1 }}>
          <svg
            viewBox="0 0 1200 380"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            style={{ fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as React.CSSProperties}
          >
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 22%, #dcc0b0)", strokeWidth: "2" }}
              d="M 58,22 C 82,98 74,172 50,244 C 26,316 40,352 62,374"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 15%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 50,244 C 22,256 0,278 0,314"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 22%, #dcc0b0)", strokeWidth: "2" }}
              d="M 1142,22 C 1118,98 1126,172 1150,244 C 1174,316 1160,352 1138,374"
            />
            <path
              pathLength="1"
              className="path-draw scroll-reveal"
              style={{ stroke: "color-mix(in srgb, var(--accent) 15%, #dcc0b0)", strokeWidth: "1.5" }}
              d="M 1150,244 C 1178,256 1200,278 1200,314"
            />
          </svg>
        </div>
        <div className="page-inner">
          <div className="ui-panel p-6 sm:p-10">
            <p className="ui-eyebrow scroll-reveal">Reservation</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <p
                className="headline-reveal text-3xl font-bold italic leading-tight text-[var(--foreground)] sm:text-4xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Book your table and enjoy the full Ms Ginko experience
              </p>
              <div className="space-y-4 lg:pt-2">
                <p className="scroll-reveal ui-copy text-base leading-7" data-delay="1">
                  Reserve in seconds for brunch or coffee hours. We keep service smooth, flexible,
                  and guest-first from entry to the final cup.
                </p>
                <Link
                  href="/reserve"
                  className="ui-btn-primary scroll-reveal px-6 py-3"
                  data-delay="2"
                >
                  Reserve now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonial" className="bg-[var(--surface-alt)] py-10 sm:py-14">
        <div className="page-inner">
          <p className="ui-eyebrow scroll-reveal">Testimonial</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, idx) => (
              <article
                key={item.id}
                className="ui-card scroll-reveal p-5 sm:p-6"
                data-delay={idx + 1}
              >
                <p className="text-lg font-semibold italic leading-7 text-[var(--foreground)]">
                  &quot;{item.quote}&quot;
                </p>
                <p className="ui-copy mt-4 text-sm uppercase tracking-[0.08em]">{item.name}</p>
              </article>
            ))}
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
