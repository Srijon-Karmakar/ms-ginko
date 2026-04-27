"use client";

import { useMemo, useState } from "react";

import type { Database } from "@/lib/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuBrowserProps = {
  initialItems: MenuItem[];
};

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
      <circle cx="11" cy="11" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16.2 16.2 4.1 4.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true" fill="none">
      <path d="M6 4.8v14.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.2 4.8v7.3c0 1.1-.9 2-2 2H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 4.8c2 2 2 5.2 0 7.2l-1.3 1.3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CategoryGlyph({ category }: { category: string }) {
  const c = category.toLowerCase();

  if (c.includes("beverage") || c.includes("drink") || c.includes("coffee")) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <path d="M4.7 9.2h10.6v5.6a3.2 3.2 0 0 1-3.2 3.2H8a3.2 3.2 0 0 1-3.2-3.2V9.2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15.3 10.3h1.6a2.2 2.2 0 1 1 0 4.3h-1.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5.4v2.1M11 5v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (c.includes("dessert") || c.includes("sweet")) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <path d="M5.4 10.2h13.2l-1.1 7a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7l-1.1-7Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.2 10.2V8.7a3.8 3.8 0 0 1 7.6 0v1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (c.includes("special")) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <path d="m12 4.3 2 4.1 4.5.6-3.2 3.1.8 4.6L12 14.5l-4.1 2.2.8-4.6L5.5 9l4.5-.6 2-4.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  if (c.includes("main")) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <ellipse cx="12" cy="13.4" rx="7.2" ry="4.6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 9.2h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (c.includes("small") || c.includes("starter")) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
        <path d="M4.6 12h14.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7.2" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.8" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="4.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 5.2v1.8M12 17v1.8M5.2 12H7M17 12h1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PriceGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none">
      <path d="M7 6.2h8.4M7 12h7M7 17.8h8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 4.6h14v14.8H5z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const getCategoryColor = (category: string) => {
  const c = category.toLowerCase();

  if (c.includes("beverage") || c.includes("drink") || c.includes("coffee")) return "#58d1d8";
  if (c.includes("dessert") || c.includes("sweet")) return "#f4b6d9";
  if (c.includes("special")) return "#f7cd7b";
  if (c.includes("main")) return "#8fd58f";
  if (c.includes("small") || c.includes("starter")) return "#a8b0ff";
  return "var(--accent)";
};

const getCategoryBackground = (category: string) => {
  const color = getCategoryColor(category);
  return `color-mix(in srgb, ${color} 22%, transparent)`;
};

const formatCategoryLabel = (value: string) => {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function MenuBrowser({ initialItems }: MenuBrowserProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    for (const item of initialItems) {
      const key = item.category?.trim() || "other";
      categorySet.add(key);
    }

    return ["all", ...Array.from(categorySet).filter((value) => value !== "all")];
  }, [initialItems]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialItems.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query);
    });
  }, [category, initialItems, search]);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h2 className="inline-flex items-center gap-2 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]">
            <MenuGlyph />
          </span>
          <span>Menu</span>
        </h2>

        <label className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <SearchGlyph />
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-[color-mix(in_srgb,var(--border)_45%,transparent)] bg-transparent py-3 pl-12 pr-4 text-lg font-medium tracking-tight text-[var(--foreground)] outline-none placeholder:text-[color-mix(in_srgb,var(--muted)_76%,transparent)] focus:border-[color-mix(in_srgb,var(--accent)_52%,transparent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {categories.map((option) => {
            const isActive = option === category;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`text-sm font-semibold tracking-wide transition ${
                  isActive
                    ? "text-[var(--foreground)]"
                    : "text-[color-mix(in_srgb,var(--muted)_88%,transparent)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      color: getCategoryColor(option),
                      backgroundColor: getCategoryBackground(option),
                    }}
                  >
                    <CategoryGlyph category={option} />
                  </span>
                  <span>{option === "all" ? "All" : formatCategoryLabel(option)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {initialItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-y-9 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12">
          {filtered.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-[1.08rem] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[1.18rem]">
                  {item.name}
                </h3>
                <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  <span className="text-[var(--accent)]/85">
                    <PriceGlyph />
                  </span>
                  <span>${item.price.toFixed(2)}</span>
                </p>
              </div>
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full pt-0.5"
                style={{
                  color: getCategoryColor(item.category),
                  backgroundColor: getCategoryBackground(item.category),
                }}
              >
                <CategoryGlyph category={item.category} />
              </span>
            </article>
          ))}
        </div>
      ) : null}

      {initialItems.length > 0 && filtered.length === 0 ? (
        <p className="ui-copy text-sm">No menu items matched your filter. Try another search term.</p>
      ) : null}

      {initialItems.length === 0 ? (
        <p className="ui-copy text-sm">No menu items available right now.</p>
      ) : null}
    </div>
  );
}
