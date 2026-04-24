import { NextRequest, NextResponse } from "next/server";

import { parseReservationTableMeta } from "@/lib/reservation-table-meta";
import { restaurantTables as fallbackTables } from "@/lib/restaurant-tables";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const normalizeDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }
  return value;
};

const normalizeTableShape = (shape: string) => {
  if (shape === "rect-wide" || shape === "rect-mid" || shape === "rect-tall" || shape === "round") {
    return shape;
  }
  return "rect-mid";
};

type TableRow = {
  id: string;
  label: string;
  capacity: number;
  zone: string;
  shape: string;
  layout_x: number;
  layout_y: number;
  layout_width: number;
  layout_height: number;
  active: boolean;
};

type LegacyReservation = {
  id: string;
  table_id?: string | null;
  special_request?: string | null;
};

const buildFallbackBaseTables = (): TableRow[] =>
  fallbackTables.map((table) => ({
    id: table.id,
    label: table.label,
    capacity: table.capacity,
    zone: table.zone,
    shape: table.shape,
    layout_x: Number.parseFloat(table.x),
    layout_y: Number.parseFloat(table.y),
    layout_width: Number.parseFloat(table.width),
    layout_height: Number.parseFloat(table.height),
    active: true,
  }));

const toApiTables = (rows: TableRow[], occupied: Set<string>, partySize: number) =>
  rows.map((table) => {
    const hasCapacity = table.capacity >= partySize;
    const available = hasCapacity && !occupied.has(table.id);
    return {
      id: table.id,
      label: table.label,
      capacity: table.capacity,
      zone: table.zone,
      shape: normalizeTableShape(table.shape),
      x: `${table.layout_x}%`,
      y: `${table.layout_y}%`,
      width: `${table.layout_width}%`,
      height: `${table.layout_height}%`,
      isAvailable: available,
    };
  });

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const dateParam = request.nextUrl.searchParams.get("date");
    const timeParam = request.nextUrl.searchParams.get("time");
    const ignoreReservationId = request.nextUrl.searchParams.get("ignoreReservationId");
    const partySizeParam = Number(request.nextUrl.searchParams.get("partySize") ?? "2");
    const partySize = Number.isFinite(partySizeParam) ? Math.max(1, partySizeParam) : 2;
    const hasSlotFilter = Boolean(dateParam && timeParam);

    let baseTables = buildFallbackBaseTables();

    const { data: dbTables, error: dbTablesError } = await supabase
      .from("restaurant_tables")
      .select("id, label, capacity, zone, shape, layout_x, layout_y, layout_width, layout_height, active")
      .eq("active", true)
      .order("id", { ascending: true });

    if (!dbTablesError && dbTables && dbTables.length > 0) {
      baseTables = dbTables;
    } else if (dbTablesError) {
      console.warn("tables route: falling back to static layout because restaurant_tables query failed:", dbTablesError.message);
    }

    if (!hasSlotFilter) {
      return NextResponse.json({ tables: toApiTables(baseTables, new Set<string>(), partySize) });
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({
        tables: toApiTables(baseTables, new Set<string>(), partySize),
        warning: "SUPABASE_SERVICE_ROLE_KEY missing. Showing generic table map.",
      });
    }

    const date = normalizeDate(dateParam ?? "");
    const time = (timeParam ?? "").slice(0, 5);
    const occupied = new Set<string>();

    const modernReservationsResult = await admin
      .from("reservations")
      .select("id, table_id")
      .eq("reservation_date", date)
      .eq("reservation_time", `${time}:00`)
      .in("status", ["pending", "confirmed"]);

    if (!modernReservationsResult.error) {
      for (const reservation of (modernReservationsResult.data ?? []) as LegacyReservation[]) {
        if (ignoreReservationId && reservation.id === ignoreReservationId) continue;
        if (reservation.table_id) {
          occupied.add(reservation.table_id);
        }
      }
    } else {
      console.warn("tables route: modern table_id query failed, attempting legacy special_request parse:", modernReservationsResult.error.message);

      const legacyReservationsResult = await admin
        .from("reservations")
        .select("id, special_request")
        .eq("reservation_date", date)
        .eq("reservation_time", `${time}:00`)
        .eq("status", "confirmed");

      if (!legacyReservationsResult.error) {
        for (const reservation of (legacyReservationsResult.data ?? []) as LegacyReservation[]) {
          if (ignoreReservationId && reservation.id === ignoreReservationId) continue;
          const parsed = parseReservationTableMeta(reservation.special_request ?? null);
          if (parsed.tableId) occupied.add(parsed.tableId);
        }
      } else {
        console.warn("tables route: legacy query also failed, returning capacity-only availability:", legacyReservationsResult.error.message);
      }
    }

    return NextResponse.json({ tables: toApiTables(baseTables, occupied, partySize) });
  } catch (error) {
    console.error("tables route failed:", error);
    const partySizeParam = Number(request.nextUrl.searchParams.get("partySize") ?? "2");
    const partySize = Number.isFinite(partySizeParam) ? Math.max(1, partySizeParam) : 2;
    return NextResponse.json(
      {
        tables: toApiTables(buildFallbackBaseTables(), new Set<string>(), partySize),
        warning: "Using fallback table map.",
      },
      { status: 200 },
    );
  }
}
