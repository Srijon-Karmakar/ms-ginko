import type { Metadata } from "next";

import { MenuBrowser } from "@/components/menu/menu-browser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse the Ms Ginko menu by category and search by item name.",
};

export default async function MenuPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, category, price, is_vegetarian, is_active")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="page-wrapper space-y-6">
      {error ? (
        <p className="ui-panel rounded-xl p-4 text-sm text-red-700">
          Unable to load menu right now. Please try again.
        </p>
      ) : null}
      <MenuBrowser initialItems={data ?? []} />
    </div>
  );
}
