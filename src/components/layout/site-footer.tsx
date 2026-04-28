"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/lib/site-data";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <footer className="relative overflow-hidden rounded-t-[1.6rem] border-t border-white/10 bg-[#0b0d12] text-white sm:rounded-t-[2.1rem]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(100% 120% at 0% 0%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(120% 120% at 100% 0%, rgba(255,255,255,0.05), transparent 52%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[55vh] w-full max-w-7xl flex-col px-5 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-12">
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.02em] text-white/95">The Good</p>
            <div className="mt-3 flex flex-col gap-2 text-[15px] text-white/68">
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <Link href="/menu" className="transition-colors hover:text-white">
                Menu
              </Link>
              <Link href="/reserve" className="transition-colors hover:text-white">
                Book
              </Link>
              <Link href="/about" className="transition-colors hover:text-white">
                About
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.02em] text-white/95">The Boring</p>
            <div className="mt-3 flex flex-col gap-2 text-[15px] text-white/68">
              <p>{siteConfig.address}</p>
              <p>{siteConfig.phone}</p>
              <p>{siteConfig.email}</p>
              <p>Tue-Sun | 12:00 pm - 12:00 am</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.02em] text-white/95">The Cool</p>
            <div className="mt-3 flex flex-col gap-2 text-[15px] text-white/68">
              <Link href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                Instagram
              </Link>
              <Link href={siteConfig.social.zomato} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                Zomato
              </Link>
              <Link href={siteConfig.social.swiggy} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                Swiggy
              </Link>
              <Link href="/reserve" className="transition-colors hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/12 pt-5 text-xs tracking-[0.015em] text-white/50 sm:text-sm">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </div>

      <div className="pointer-events-none relative -mb-2 flex justify-center px-4 pb-1 sm:px-7" aria-hidden="true">
        <p className="select-none text-center text-[6rem] font-semibold uppercase leading-[0.8] tracking-[-0.04em] text-white sm:text-[12.2rem] lg:text-[15rem]">
          {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
