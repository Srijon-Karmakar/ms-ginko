import type { Metadata } from "next";
import Link from "next/link";

import { MenuBrowser } from "@/components/menu/menu-browser";
import { siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Menu",
  description: "Explore Ms Ginko dishes by category with filter and search.",
};

export default function MenuPage() {
  return (
    <div className="page-wrapper space-y-8">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">Menu</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          Curated Dishes for Every Course
        </h1>
        <p className="ui-copy mt-4 max-w-3xl text-base leading-7">
          Use filters or search to find your preferred dish style. Online ordering is available from our delivery
          partners.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={siteConfig.social.zomato} target="_blank" rel="noreferrer" className="ui-btn-primary px-6 py-3">
            Order via Zomato
          </Link>
          <Link href={siteConfig.social.swiggy} target="_blank" rel="noreferrer" className="ui-btn-secondary px-6 py-3">
            Order via Swiggy
          </Link>
        </div>
      </section>

      <MenuBrowser />
    </div>
  );
}
