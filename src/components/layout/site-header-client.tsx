"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ContactModal } from "@/components/layout/contact-modal";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/#gallery" },
];

export function SiteHeaderClient() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-none bg-transparent pt-3 sm:pt-4">
        <div className="flex w-full items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--background)_18%,transparent)] px-3 py-3 backdrop-blur-xl sm:gap-4 sm:px-6 sm:py-3.5">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/logo/logo.png"
              alt="Miss Ginko logo"
              width={72}
              height={72}
              priority
              className="h-11 w-11 rounded-full object-cover sm:h-14 sm:w-14 md:h-16 md:w-16"
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={`nav-link-glass ${
                  (link.href === "/" && pathname === "/") ||
                  (link.href === "/menu" && pathname.startsWith("/menu")) ||
                  (link.href === "/about" && pathname.startsWith("/about"))
                    ? "nav-link-active"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="nav-link-glass"
            >
              Contact
            </button>
          </nav>

          <div className="hidden items-center lg:flex">
            <Link href="/reserve" className="ui-btn-primary px-6 py-2.5 text-[12px]">
              Book Table
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/reserve" className="ui-btn-primary px-4 py-2 text-[11px]">
              Book Table
            </Link>
            <button
              type="button"
              className="rounded-lg bg-[color-mix(in_srgb,var(--background)_24%,transparent)] px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="mt-2 w-full bg-[color-mix(in_srgb,var(--background)_18%,transparent)] px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link-glass nav-link-mobile ${
                    pathname === link.href ? "nav-link-active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className="nav-link-glass nav-link-mobile text-left"
                onClick={() => {
                  setContactOpen(true);
                  setMobileOpen(false);
                }}
              >
                Contact
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
