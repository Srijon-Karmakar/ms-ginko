import type { Metadata } from "next";
import { Barlow_Condensed, Caveat, Manrope } from "next/font/google";

import { ScrollObserver } from "@/components/layout/scroll-observer";
import { ScrollTypographyBackground } from "@/components/layout/scroll-typography-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/lib/site-data";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Ms Ginko | Contemporary Restaurant",
    template: "%s | Ms Ginko",
  },
  description:
    "Discover Ms Ginko: refined dining, curated menus, online reservations, and gallery-led storytelling.",
  keywords: [
    "Ms Ginko",
    "restaurant website",
    "table booking",
    "fine dining",
    "restaurant menu",
    "restaurant gallery",
  ],
  applicationName: "Ms Ginko",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: "Ms Ginko | Contemporary Restaurant",
    description:
      "Reserve tables, browse signature dishes, and explore the Ms Ginko gallery and story.",
    siteName: "Ms Ginko",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ms Ginko | Contemporary Restaurant",
    description: "Reserve a table and explore our signature menu.",
  },
};

const themeInitScript = `
(() => {
  try {
    const saved = localStorage.getItem("msginko-theme");
    const theme = saved === "amoled" ? "amoled" : "clean";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "clean");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlowCondensed.variable} ${manrope.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <div className="site-shell relative min-h-screen overflow-x-clip">
          <ScrollObserver />
          <ScrollTypographyBackground />
          <SiteHeader />
          <main className="relative z-10 flex w-full flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
