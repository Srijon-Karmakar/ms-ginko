"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { parseReservationTableMeta } from "@/lib/reservation-table-meta";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"] & {
  table_label?: string | null;
};
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuItemDraft = {
  name: string;
  price: string;
};

const sortMenuItemsByName = (items: MenuItem[]) => {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
};

const getTableMeta = (booking: Reservation) => {
  const legacy = parseReservationTableMeta(booking.special_request);
  return {
    tableId: booking.table_id ?? legacy.tableId ?? "-",
    tableLabel: booking.table_label ?? (booking.table_id ? booking.table_id.toUpperCase() : legacy.tableId?.toUpperCase() ?? "-"),
  };
};

export function AdminDashboardClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [menuDrafts, setMenuDrafts] = useState<Record<string, MenuItemDraft>>({});
  const [creatingItem, setCreatingItem] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/reserve");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      await supabase.rpc("mark_past_reservations_completed");

      const reservationsResult = await supabase
        .from("reservations")
        .select(
          "id, user_id, table_id, guest_name, guest_email, phone, party_size, reservation_date, reservation_time, special_request, status, created_at, updated_at, cancelled_at, completed_at",
        )
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (reservationsResult.error) {
        setError(reservationsResult.error.message);
        setLoading(false);
        return;
      }

      const tablesResult = await supabase.from("restaurant_tables").select("id, label");
      const tableLabelById = new Map<string, string>();
      if (!tablesResult.error) {
        for (const table of tablesResult.data ?? []) {
          tableLabelById.set(table.id, table.label);
        }
      }

      const nextReservations = (reservationsResult.data ?? []).map((reservation) => ({
        ...reservation,
        table_label: reservation.table_id ? tableLabelById.get(reservation.table_id) ?? null : null,
      }));

      setReservations(nextReservations);
      const menuItemsResult = await supabase
        .from("menu_items")
        .select("id, name, description, category, price, is_vegetarian, is_active")
        .order("name", { ascending: true });

      if (menuItemsResult.error) {
        setMenuError(menuItemsResult.error.message);
      } else {
        const nextMenuItems = sortMenuItemsByName(menuItemsResult.data ?? []);
        setMenuItems(nextMenuItems);
        setMenuDrafts(
          nextMenuItems.reduce<Record<string, MenuItemDraft>>((acc, item) => {
            acc[item.id] = { name: item.name, price: item.price.toFixed(2) };
            return acc;
          }, {}),
        );
        setMenuError(null);
      }
      setLoading(false);
    };

    void loadData();
  }, [router, supabase]);

  const totals = useMemo(
    () => ({
      pending: reservations.filter((booking) => booking.status === "pending").length,
      confirmed: reservations.filter((booking) => booking.status === "confirmed").length,
      cancelled: reservations.filter((booking) => booking.status === "cancelled").length,
      completed: reservations.filter((booking) => booking.status === "completed").length,
    }),
    [reservations],
  );

  const updateMenuDraft = (id: string, key: keyof MenuItemDraft, value: string) => {
    setMenuDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const onCreateMenuItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = createName.trim();
    const parsedPrice = Number(createPrice);

    if (!normalizedName) {
      setMenuError("Item name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMenuError("Enter a valid price greater than 0.");
      return;
    }

    setCreatingItem(true);
    setMenuError(null);

    const { data, error: insertError } = await supabase
      .from("menu_items")
      .insert({
        name: normalizedName,
        price: parsedPrice,
        description: "",
        category: "menu",
        is_active: true,
        is_vegetarian: false,
      })
      .select("id, name, description, category, price, is_vegetarian, is_active")
      .single();

    setCreatingItem(false);

    if (insertError || !data) {
      setMenuError(insertError?.message ?? "Failed to create menu item.");
      return;
    }

    setCreateName("");
    setCreatePrice("");
    setMenuItems((prev) => sortMenuItemsByName([data, ...prev]));
    setMenuDrafts((prev) => ({
      ...prev,
      [data.id]: { name: data.name, price: data.price.toFixed(2) },
    }));
  };

  const onSaveMenuItem = async (id: string) => {
    const draft = menuDrafts[id];
    if (!draft) return;

    const normalizedName = draft.name.trim();
    const parsedPrice = Number(draft.price);

    if (!normalizedName) {
      setMenuError("Item name is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMenuError("Enter a valid price greater than 0.");
      return;
    }

    setSavingItemId(id);
    setMenuError(null);

    const { data, error: updateError } = await supabase
      .from("menu_items")
      .update({
        name: normalizedName,
        price: parsedPrice,
      })
      .eq("id", id)
      .select("id, name, description, category, price, is_vegetarian, is_active")
      .single();

    setSavingItemId(null);

    if (updateError || !data) {
      setMenuError(updateError?.message ?? "Failed to update menu item.");
      return;
    }

    setMenuItems((prev) => sortMenuItemsByName(prev.map((item) => (item.id === id ? data : item))));
    setMenuDrafts((prev) => ({
      ...prev,
      [id]: { name: data.name, price: data.price.toFixed(2) },
    }));
  };

  if (loading) {
    return <div className="ui-panel p-6 text-sm text-[var(--muted)]">Loading admin dashboard...</div>;
  }

  return (
    <div className="page-wrapper space-y-6 sm:space-y-8">
      <section className="ui-panel p-6 sm:p-8">
        <p className="ui-eyebrow">Admin Dashboard</p>
        <h1 className="mt-3 text-4xl text-[var(--foreground)] sm:text-5xl">Reservation Operations</h1>
        <p className="ui-copy mt-3 text-sm">Live pipeline with explicit table assignment and status audit.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Pending", totals.pending],
          ["Confirmed", totals.confirmed],
          ["Cancelled", totals.cancelled],
          ["Completed", totals.completed],
        ].map(([label, value]) => (
          <article key={String(label)} className="ui-card p-5">
            <p className="ui-eyebrow">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
          </article>
        ))}
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {menuError ? <p className="text-sm text-red-700">{menuError}</p> : null}

      <section className="ui-panel space-y-4 p-5 sm:p-6">
        <div>
          <p className="ui-eyebrow">Menu Manager</p>
          <h2 className="mt-2 text-2xl text-[var(--foreground)] sm:text-3xl">Add And Edit Menu Items</h2>
          <p className="ui-copy mt-2 text-sm">Only item name and price are editable from admin.</p>
        </div>

        <form onSubmit={(event) => void onCreateMenuItem(event)} className="grid gap-3 sm:grid-cols-[1fr_170px_auto]">
          <input
            className="ui-field"
            placeholder="Item name"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
          />
          <input
            className="ui-field"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price"
            value={createPrice}
            onChange={(event) => setCreatePrice(event.target.value)}
          />
          <button type="submit" className="ui-btn-primary justify-center px-5 py-3 text-xs" disabled={creatingItem}>
            {creatingItem ? "Adding..." : "Add Item"}
          </button>
        </form>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const draft = menuDrafts[item.id] ?? { name: item.name, price: item.price.toFixed(2) };
            const isSaving = savingItemId === item.id;
            return (
              <article key={item.id} className="ui-card grid gap-3 p-3 sm:grid-cols-[1fr_140px_auto] sm:items-center">
                <input
                  className="ui-field"
                  value={draft.name}
                  onChange={(event) => updateMenuDraft(item.id, "name", event.target.value)}
                />
                <input
                  className="ui-field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => updateMenuDraft(item.id, "price", event.target.value)}
                />
                <button
                  type="button"
                  className="ui-btn-secondary justify-center px-5 py-3 text-xs"
                  onClick={() => void onSaveMenuItem(item.id)}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </article>
            );
          })}

          {menuItems.length === 0 ? (
            <p className="ui-card p-4 text-sm text-[var(--muted)]">No menu items yet. Add your first item above.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 sm:hidden">
        {reservations.map((booking) => {
          const tableMeta = getTableMeta(booking);
          return (
            <article key={booking.id} className="ui-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg text-[var(--foreground)]">{booking.guest_name}</h3>
                <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {booking.status}
                </span>
              </div>
              <p className="ui-copy mt-2 text-xs">{booking.guest_email ?? "-"}</p>
              <p className="ui-copy text-xs">{booking.phone}</p>
              <p className="ui-copy mt-2 text-sm">
                {booking.reservation_date} at {booking.reservation_time.slice(0, 5)}
              </p>
              <p className="ui-copy text-sm">Party: {booking.party_size}</p>
              <p className="ui-copy text-sm">
                Table: {tableMeta.tableLabel} (ID: {tableMeta.tableId})
              </p>
            </article>
          );
        })}
        {reservations.length === 0 ? <p className="ui-card p-4 text-sm text-[var(--muted)]">No reservations found.</p> : null}
      </section>

      <section className="ui-card hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--surface-alt)] text-xs uppercase tracking-[0.14em] text-[var(--label)]">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Table Label</th>
                <th className="px-4 py-3">Table ID</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((booking) => {
                const tableMeta = getTableMeta(booking);
                return (
                  <tr key={booking.id} className="border-t border-[var(--border)] text-[var(--foreground)]">
                    <td className="px-4 py-3">{booking.guest_name}</td>
                    <td className="px-4 py-3">{booking.guest_email ?? "-"}</td>
                    <td className="px-4 py-3">{booking.phone}</td>
                    <td className="px-4 py-3">{booking.reservation_date}</td>
                    <td className="px-4 py-3">{booking.reservation_time.slice(0, 5)}</td>
                    <td className="px-4 py-3">{booking.party_size}</td>
                    <td className="px-4 py-3">{tableMeta.tableLabel}</td>
                    <td className="px-4 py-3">{tableMeta.tableId}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                  </tr>
                );
              })}
              {reservations.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[var(--muted)]" colSpan={9}>
                    No reservations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
