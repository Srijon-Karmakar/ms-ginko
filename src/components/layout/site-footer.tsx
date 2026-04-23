import Link from "next/link";

import { siteConfig } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)] bg-[var(--surface-alt)]">
      <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
        <p className="footer-script script-reveal">See ya!</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-36 sm:px-6">
        <div className="split-rule border-t" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-8 sm:grid-cols-3 sm:px-6">
        <div className="sm:border-r sm:border-[color-mix(in_srgb,var(--border)_55%,transparent)] sm:pr-6">
          <p className="text-3xl font-semibold uppercase tracking-[0.03em] text-[var(--foreground)]">{siteConfig.name}</p>
          <p className="ui-copy mt-4 text-base">{siteConfig.address}</p>
          <p className="ui-copy text-base">{siteConfig.phone}</p>
          <p className="ui-copy text-base">{siteConfig.email}</p>
        </div>

        <div className="sm:border-r sm:border-[color-mix(in_srgb,var(--border)_55%,transparent)] sm:px-6">
          <p className="text-3xl font-semibold uppercase tracking-[0.03em] text-[var(--foreground)]">Cafe & Brunch</p>
          <p className="ui-copy mt-4 text-base">Tuesday to Sunday</p>
          <p className="ui-copy text-base">12:00 pm - 3:00 pm</p>
          <p className="ui-copy mt-4 text-base">Dinner</p>
          <p className="ui-copy text-base">6:00 pm - 10:30 pm</p>
        </div>

        <div className="sm:pl-6">
          <p className="text-3xl font-semibold uppercase tracking-[0.03em] text-[var(--foreground)]">Explore</p>
          <div className="ui-copy mt-4 flex flex-col gap-2 text-base">
            <Link href="/menu" className="hover:text-[var(--accent)]">
              Coffee & Menu
            </Link>
            <Link href="/reserve" className="hover:text-[var(--accent)]">
              Reserve
            </Link>
            <Link
              href={siteConfig.social.zomato}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              Order on Zomato
            </Link>
            <Link
              href={siteConfig.social.swiggy}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              Order on Swiggy
            </Link>
            <div className="mt-4 flex gap-3">
              <Link href="/reserve" className="ui-btn-primary px-6 py-2 text-[12px]">
                Reserve
              </Link>
              <button type="button" className="ui-btn-secondary px-6 py-2 text-[12px]">
                Gifting
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--border)_45%,transparent)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-[var(--muted)] sm:px-6">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="hover:text-[var(--accent)]">
              About
            </Link>
            <Link href="/reserve" className="hover:text-[var(--accent)]">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
