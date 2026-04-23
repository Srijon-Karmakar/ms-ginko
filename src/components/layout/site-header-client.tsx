"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ContactModal } from "@/components/layout/contact-modal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type HeaderUser = {
  email: string | null;
  fullName: string | null;
  role: "customer" | "admin";
};

type SiteHeaderClientProps = {
  user: HeaderUser | null;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Coffee", href: "/menu", meta: "12:00 - 15:00" },
  { label: "Brunch", href: "/menu", meta: "18:00 - 22:30" },
  { label: "Haven", href: "/about" },
];

const linkStyle =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:text-[var(--foreground)]";

export function SiteHeaderClient({ user }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [authUser, setAuthUser] = useState<HeaderUser | null>(user);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        if (isMounted) setAuthUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!isMounted) return;

      setAuthUser({
        email: currentUser.email ?? null,
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "customer",
      });
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[color-mix(in_srgb,var(--border)_40%,transparent)] bg-[var(--overlay)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div>
              <p className="brand-script text-[var(--foreground)]">ms ginko</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {navLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={`${linkStyle} ${pathname === link.href ? "text-[var(--foreground)]" : ""}`}
              >
                <span className="block">{link.label}</span>
                {"meta" in link && link.meta ? (
                  <span className="mt-1 block text-[10px] font-medium tracking-[0.02em] text-[var(--muted)] normal-case">
                    {link.meta}
                  </span>
                ) : null}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Gifting
            </button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {authUser ? (
              <>
                <Link
                  href={authUser.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                  className="ui-btn-secondary px-4 py-2 text-[11px]"
                >
                  Dashboard
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link href="/reserve" className="ui-btn-primary px-6 py-2 text-[11px]">
                Reserve
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[color-mix(in_srgb,var(--border)_40%,transparent)] bg-[var(--surface)] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${linkStyle} ${pathname === link.href ? "text-[var(--foreground)]" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className={`${linkStyle} text-left`}
                onClick={() => {
                  setContactOpen(true);
                  setMobileOpen(false);
                }}
              >
                Gifting
              </button>
              {authUser ? (
                <Link
                  href={authUser.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                  className="ui-btn-secondary justify-center px-4 py-2 text-center text-[11px]"
                >
                  Dashboard
                </Link>
              ) : (
                <Link href="/reserve" className="ui-btn-primary justify-center px-4 py-2 text-center text-[11px]">
                  Reserve
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
