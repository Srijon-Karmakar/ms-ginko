"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ContactModal } from "@/components/layout/contact-modal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/#gallery" },
];

type HeaderUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "customer" | "admin";
};

export function SiteHeaderClient() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerUser, setHeaderUser] = useState<HeaderUser | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHeaderUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      if (!user) {
        setHeaderUser(null);
        return;
      }

      const metaName =
        typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      setHeaderUser({
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name?.trim() || metaName || null,
        role: profile?.role === "admin" ? "admin" : "customer",
      });
    };

    void loadHeaderUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadHeaderUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [profileOpen]);

  const profileLabel = useMemo(() => {
    if (!headerUser) return "Profile";
    if (headerUser.fullName) return headerUser.fullName;
    return headerUser.email.split("@")[0] || "Profile";
  }, [headerUser]);

  const profileInitials = useMemo(() => {
    return profileLabel
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profileLabel]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header
        data-site-header
        className={`inset-x-0 top-0 border-none bg-transparent ${
          isHome ? "fixed z-50" : "sticky z-40"
        }`}
      >
        <div
          className="header-gradient flex w-full items-center justify-between gap-3 bg-gradient-to-b from-black/82 via-black/48 to-transparent px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5"
        >
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

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle compact />
            <Link href="/reserve" className="ui-btn-primary px-6 py-2.5 text-[12px]">
              Book Table
            </Link>
            {headerUser ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                    {profileInitials}
                  </span>
                  <span className="max-w-[7.2rem] truncate">{profileLabel}</span>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/20 bg-black/85 p-3 text-white">
                    <p className="truncate text-sm font-semibold">{profileLabel}</p>
                    <p className="truncate text-xs text-white/70">{headerUser.email}</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Link
                        href="/dashboard"
                        className="rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
                        onClick={() => setProfileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {headerUser.role === "admin" ? (
                        <Link
                          href="/admin"
                          className="rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
                          onClick={() => setProfileOpen(false)}
                        >
                          Admin
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-red-300 hover:bg-white/10"
                        onClick={() => void onSignOut()}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle compact />
            <Link href="/reserve" className="ui-btn-primary px-4 py-2 text-[11px]">
              Book Table
            </Link>
            <button
              type="button"
              className="rounded-lg bg-white/12 px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="header-gradient w-full bg-gradient-to-b from-black/82 via-black/48 to-transparent px-4 pb-4 pt-1 lg:hidden">
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

              {headerUser ? (
                <div className="rounded-xl border border-white/15 bg-black/35 p-3 text-white">
                  <p className="text-sm font-semibold">{profileLabel}</p>
                  <p className="truncate text-xs text-white/70">{headerUser.email}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      className="rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {headerUser.role === "admin" ? (
                      <Link
                        href="/admin"
                        className="rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
                        onClick={() => setMobileOpen(false)}
                      >
                        Admin
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-red-300 hover:bg-white/10"
                      onClick={() => void onSignOut()}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
