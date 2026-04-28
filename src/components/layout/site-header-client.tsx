"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ContactModal } from "@/components/layout/contact-modal";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/layout/staggered-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getLogoImageUrl } from "@/lib/media";
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
  const [scrolledIntoContent, setScrolledIntoContent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    if (!isHome) {
      return;
    }

    let raf = 0;

    const updateHeaderMode = () => {
      const aboutSection = document.getElementById("about");
      const heroSection = document.getElementById("hero");

      const next =
        (aboutSection
          ? aboutSection.getBoundingClientRect().top <= window.innerHeight - 16
          : heroSection
            ? heroSection.getBoundingClientRect().bottom <= window.innerHeight
            : window.scrollY > 6) || menuOpen;

      setScrolledIntoContent((prev) => (prev === next ? prev : next));
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(updateHeaderMode);
    };

    updateHeaderMode();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isHome, menuOpen]);

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

  const onSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    router.push("/");
    router.refresh();
  }, [router, supabase]);

  const menuItems = useMemo<StaggeredMenuItem[]>(() => {
    const items: StaggeredMenuItem[] = [
      ...navLinks.map((link) => ({
        label: link.label,
        ariaLabel: `Go to ${link.label.toLowerCase()} page`,
        link: link.href,
      })),
      {
        label: "Contact",
        ariaLabel: "Open contact form",
        link: "#contact",
        onClick: () => setContactOpen(true),
      },
    ];

    if (headerUser) {
      items.push({
        label: "Dashboard",
        ariaLabel: "Open your dashboard",
        link: "/dashboard",
      });

      if (headerUser.role === "admin") {
        items.push({
          label: "Admin",
          ariaLabel: "Open admin panel",
          link: "/admin",
        });
      }

      items.push({
        label: "Logout",
        ariaLabel: "Sign out from your account",
        link: "#logout",
        onClick: () => {
          void onSignOut();
        },
      });
    }

    return items;
  }, [headerUser, onSignOut]);

  const headerToneClass = isHome && scrolledIntoContent ? "header-solid" : "header-gradient";

  return (
    <>
      <header
        data-site-header
        className={`inset-x-0 top-0 border-none bg-transparent ${
          isHome ? "fixed z-50" : "sticky z-40"
        }`}
      >
        <div
          className={`header-shell ${headerToneClass} flex w-full items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5`}
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src={getLogoImageUrl()}
              alt="Miss Ginko logo"
              width={72}
              height={72}
              priority
              className="h-11 w-11 rounded-full object-cover sm:h-14 sm:w-14 md:h-16 md:w-16"
            />
          </Link>
          <StaggeredMenu
            embedded
            showLogo={false}
            isFixed={false}
            className="site-header-staggered"
            items={menuItems}
            colors={["var(--surface-alt)", "var(--surface)"]}
            displaySocials={false}
            displayItemNumbering
            position="right"
            accentColor="var(--accent)"
            menuButtonColor="var(--header-nav-solid-text-active)"
            openMenuButtonColor="var(--header-nav-solid-text-active)"
            onMenuOpen={() => setMenuOpen(true)}
            onMenuClose={() => setMenuOpen(false)}
            headerActions={
              <>
                <ThemeToggle compact />
                <Link href="/reserve" className="ui-btn-primary px-4 py-2 text-[11px] sm:px-6 sm:py-2.5 sm:text-[12px]">
                  Book Table
                </Link>
                {headerUser ? (
                  <div ref={profileMenuRef} className="relative hidden md:block">
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
              </>
            }
          />
        </div>
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
