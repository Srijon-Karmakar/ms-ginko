import { NextRequest, NextResponse } from "next/server";

import { reservationRules } from "@/lib/reservation-rules";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const formatTime = (value: unknown) => {
  if (typeof value === "string") {
    return value.slice(0, 5);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }

  return "";
};

const normalizeDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }
  return value;
};

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const buildSlots = (openingTime: string, closingTime: string, interval: number) => {
  const start = minutesFromTime(openingTime);
  const end = minutesFromTime(closingTime);
  const slots: string[] = [];

  for (let minute = start; minute <= end; minute += interval) {
    const hours = Math.floor(minute / 60)
      .toString()
      .padStart(2, "0");
    const mins = (minute % 60).toString().padStart(2, "0");
    slots.push(`${hours}:${mins}`);
  }

  return slots;
};

type Settings = {
  opening_time: string;
  closing_time: string;
  slot_interval_minutes: number;
  max_party_size: number;
  max_advance_days: number;
  total_capacity: number;
};

const fallbackSettings: Settings = {
  opening_time: reservationRules.openingTime,
  closing_time: reservationRules.closingTime,
  slot_interval_minutes: reservationRules.slotIntervalMinutes,
  max_party_size: reservationRules.maxPartySize,
  max_advance_days: reservationRules.maxAdvanceDays,
  total_capacity: 24,
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const date = request.nextUrl.searchParams.get("date");
    const partySize = Number(request.nextUrl.searchParams.get("partySize") ?? "2");

    if (!date) {
      return NextResponse.json({ error: "date is required." }, { status: 400 });
    }
    const normalizedDate = normalizeDate(date);

    let settings: Settings = fallbackSettings;
    const { data: dbSettings, error: settingsError } = await supabase
      .from("reservation_settings")
      .select("opening_time, closing_time, slot_interval_minutes, max_party_size, max_advance_days, total_capacity")
      .eq("id", 1)
      .maybeSingle();

    if (!settingsError && dbSettings) {
      settings = {
        opening_time: formatTime(dbSettings.opening_time) || fallbackSettings.opening_time,
        closing_time: formatTime(dbSettings.closing_time) || fallbackSettings.closing_time,
        slot_interval_minutes: dbSettings.slot_interval_minutes ?? fallbackSettings.slot_interval_minutes,
        max_party_size: dbSettings.max_party_size ?? fallbackSettings.max_party_size,
        max_advance_days: dbSettings.max_advance_days ?? fallbackSettings.max_advance_days,
        total_capacity: dbSettings.total_capacity ?? fallbackSettings.total_capacity,
      };
    } else if (settingsError) {
      console.warn("availability route: using fallback settings because DB settings query failed:", settingsError.message);
    }

    const { data, error } = await supabase.rpc("get_slot_availability", {
      p_reservation_date: normalizedDate,
      p_party_size: Number.isFinite(partySize) ? partySize : 2,
    });

    if (!error && Array.isArray(data)) {
      const slots = data.map((item) => ({
        slotTime: formatTime(item.slot_time),
        availableSeats: Number(item.available_seats ?? 0),
        isAvailable: Boolean(item.is_available),
      }));

      return NextResponse.json({
        rules: {
          openingTime: settings.opening_time,
          closingTime: settings.closing_time,
          slotIntervalMinutes: settings.slot_interval_minutes,
          maxPartySize: settings.max_party_size,
          maxAdvanceDays: settings.max_advance_days,
          totalCapacity: settings.total_capacity,
        },
        slots,
      });
    }

    if (error) {
      console.warn("availability route: RPC failed, falling back to manual slot computation:", error.message);
    }

    const admin = createSupabaseAdminClient();
    const openingTime = settings.opening_time;
    const closingTime = settings.closing_time;
    const interval = settings.slot_interval_minutes;
    const totalCapacity = settings.total_capacity;
    const effectivePartySize = Number.isFinite(partySize) ? partySize : 2;
    const slotList = buildSlots(openingTime, closingTime, interval);
    const bookedBySlot = new Map<string, number>();

    if (admin) {
      const modernReservations = await admin
        .from("reservations")
        .select("reservation_time, party_size")
        .eq("reservation_date", normalizedDate)
        .in("status", ["pending", "confirmed"]);

      if (!modernReservations.error) {
        for (const reservation of modernReservations.data ?? []) {
          const key = formatTime(reservation.reservation_time);
          bookedBySlot.set(key, (bookedBySlot.get(key) ?? 0) + Number(reservation.party_size ?? 0));
        }
      } else {
        const legacyReservations = await admin
          .from("reservations")
          .select("reservation_time, party_size")
          .eq("reservation_date", normalizedDate)
          .eq("status", "confirmed");

        if (!legacyReservations.error) {
          for (const reservation of legacyReservations.data ?? []) {
            const key = formatTime(reservation.reservation_time);
            bookedBySlot.set(key, (bookedBySlot.get(key) ?? 0) + Number(reservation.party_size ?? 0));
          }
        } else {
          console.warn("availability route: manual reservations query failed:", legacyReservations.error.message);
        }
      }
    } else {
      console.warn("availability route: missing service-role key, returning capacity-only availability.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    const slots = slotList.map((slot) => {
      const booked = bookedBySlot.get(slot) ?? 0;
      const remaining = Math.max(totalCapacity - booked, 0);
      const slotMinutes = minutesFromTime(slot);

      const inPastToday = normalizedDate === today && slotMinutes <= nowMinutes;
      return {
        slotTime: slot,
        availableSeats: remaining,
        isAvailable: !inPastToday && remaining >= effectivePartySize,
      };
    });

    return NextResponse.json({
      rules: {
        openingTime: openingTime,
        closingTime: closingTime,
        slotIntervalMinutes: interval,
        maxPartySize: settings.max_party_size,
        maxAdvanceDays: settings.max_advance_days,
        totalCapacity: totalCapacity,
      },
      slots,
    });
  } catch (error) {
    console.error("Availability API failed:", error);

    const date = request.nextUrl.searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "date is required." }, { status: 400 });
    }

    const openingTime = fallbackSettings.opening_time;
    const closingTime = fallbackSettings.closing_time;
    const interval = fallbackSettings.slot_interval_minutes;
    const slots = buildSlots(openingTime, closingTime, interval).map((slot) => ({
      slotTime: slot,
      availableSeats: fallbackSettings.total_capacity,
      isAvailable: true,
    }));

    return NextResponse.json({
      rules: {
        openingTime,
        closingTime,
        slotIntervalMinutes: interval,
        maxPartySize: fallbackSettings.max_party_size,
        maxAdvanceDays: fallbackSettings.max_advance_days,
        totalCapacity: fallbackSettings.total_capacity,
      },
      slots,
      warning: "Using fallback availability.",
    });
  }
}
