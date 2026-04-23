"use client";

import { useMemo, useState } from "react";

import { menuCategoryLabels, menuItems, type MenuCategory } from "@/lib/site-data";

const categories: Array<"all" | MenuCategory> = [
  "all",
  "small-plates",
  "mains",
  "chef-specials",
  "desserts",
  "beverages",
];

export function MenuBrowser() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | MenuCategory>("all");
  const [vegetarianOnly, setVegetarianOnly] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (vegetarianOnly && !item.isVegetarian) return false;

      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        menuCategoryLabels[item.category].toLowerCase().includes(query)
      );
    });
  }, [category, search, vegetarianOnly]);

  return (
    <div className="space-y-6">
      <div className="ui-panel grid gap-4 p-4 sm:grid-cols-[1fr_auto_auto] sm:p-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dishes..."
          className="ui-field"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | MenuCategory)}
          className="ui-field"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Categories" : menuCategoryLabels[option]}
            </option>
          ))}
        </select>
        <label className="ui-field inline-flex items-center gap-2 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={vegetarianOnly}
            onChange={(event) => setVegetarianOnly(event.target.checked)}
          />
          Veg only
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="ui-card relative p-5 shadow-sm">
            {item.isPopular ? (
              <span className="absolute right-4 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-contrast)]">
                Popular
              </span>
            ) : null}

            <p className="ui-eyebrow">
              {menuCategoryLabels[item.category]}
            </p>
            <h3 className="mt-2 font-serif text-2xl text-[var(--foreground)]">{item.name}</h3>
            <p className="ui-copy mt-2 text-sm">{item.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-[var(--foreground)]">${item.price.toFixed(2)}</p>
              <p className="ui-eyebrow">
                {item.isVegetarian ? "Vegetarian" : "Non-Veg"}
              </p>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="ui-panel ui-copy rounded-xl p-4 text-sm">
          No menu items matched your filter. Try another search term.
        </p>
      ) : null}
    </div>
  );
}
