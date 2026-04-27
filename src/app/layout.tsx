import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";

import { ScrollObserver } from "@/components/layout/scroll-observer";
import { ScrollTypographyBackground } from "@/components/layout/scroll-typography-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/lib/site-data";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [{ url: "/favicon.ico?v=2", type: "image/x-icon" }, { url: "/icon.png?v=2", type: "image/png" }],
    shortcut: "/favicon.ico?v=2",
    apple: "/icon.png?v=2",
  },
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
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
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
