"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getReservationDateBounds, reservationRules, validateReservationPayload } from "@/lib/reservation-rules";
import { restaurantTables as fallbackTables } from "@/lib/restaurant-tables";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReservationFormProps = {
  userEmail: string;
};

type AvailabilitySlot = {
  slotTime: string;
  availableSeats: number;
  isAvailable: boolean;
};

type TableShape = "rect-wide" | "rect-mid" | "rect-tall" | "round";

type TableAvailability = {
  id: string;
  label: string;
  capacity: number;
  zone: string;
  shape: TableShape;
  x: string;
  y: string;
  width: string;
  height: string;
  isAvailable: boolean;
};

type TableVisualState = "available" | "booked" | "selected";

const normalizeDateInput = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }
  return value;
};

const formatTime = (value: unknown) => {
  if (typeof value === "string") return value.slice(0, 5);
  if (value instanceof Date) return value.toISOString().slice(11, 16);
  return "";
};

const normalizeTableShape = (shape: string): TableShape =>
  shape === "rect-wide" || shape === "rect-mid" || shape === "rect-tall" || shape === "round"
    ? shape
    : "rect-mid";

const isFunctionMissingError = (message: string, functionName: string) =>
  message.includes(functionName) && (message.includes("does not exist") || message.includes("Could not find"));

const mapReservationError = (message: string) => {
  if (message.includes("No seats available")) return "Selected slot is full. Please choose another time.";
  if (message.includes("already booked") || message.includes("duplicate key value")) {
    return "Selected table is already booked for this slot.";
  }
  if (message.includes("Authentication required")) return "Please sign in to continue.";
  if (message.includes("capacity")) return "Selected table cannot fit this party size.";
  if (message.includes("invalid")) return "Please check date, time, and party size.";
  return message;
};

const formatShortDate = (date: Date) => {
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = date.getDate();
  return { day, dayNum };
};

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const stateStyles: Record<TableVisualState, string> = {
  available: "border-[#4f4f4f] bg-[#f3f3f3] text-[#2d2d2d] hover:bg-[#ececec]",
  booked: "border-[#d2d2d2] bg-[#dddddd] text-[#9b9b9b] opacity-70",
  selected: "border-[#f1c40f] bg-[#f1d86b] text-[#1e1a02]",
};

function SeatRow({ count, state }: { count: number; state: TableVisualState }) {
  const chairClass =
    state === "selected"
      ? "border-[#e6bc0f] bg-[#f1c40f]"
      : state === "booked"
        ? "border-[#d3d3d3] bg-[#cbcbcb]"
        : "border-[#c8c8c8] bg-[#d8d8d8]";

  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: count }).map((_, idx) => (
        <span key={idx} className={`h-2.5 w-2.5 rounded-[3px] border ${chairClass} sm:h-3 sm:w-3`} />
      ))}
    </div>
  );
}

function RoundSeats({ count, state }: { count: number; state: TableVisualState }) {
  const chairClass =
    state === "selected"
      ? "border-[#e6bc0f] bg-[#f1c40f]"
      : state === "booked"
        ? "border-[#d3d3d3] bg-[#cbcbcb]"
        : "border-[#c8c8c8] bg-[#d8d8d8]";

  const points =
    count <= 4
      ? ["50% 0%", "100% 50%", "50% 100%", "0% 50%"]
      : ["50% 0%", "86% 14%", "100% 50%", "86% 86%", "50% 100%", "14% 86%", "0% 50%", "14% 14%"].slice(
          0,
          count,
        );

  return (
    <div className="pointer-events-none absolute inset-0">
      {points.map((point, idx) => {
        const [left, top] = point.split(" ");
        return (
          <span
            key={idx}
            className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border sm:h-3 sm:w-3 ${chairClass}`}
            style={{ left, top }}
          />
        );
      })}
    </div>
  );
}

function TableCard({
  table,
  state,
  onSelect,
}: {
  table: TableAvailability;
  state: TableVisualState;
  onSelect: () => void;
}) {
  const disabled = state === "booked";
  const topSeats = Math.max(2, Math.ceil(table.capacity / 2));
  const bottomSeats = Math.max(2, Math.floor(table.capacity / 2));
  const sideSeats = Math.max(2, Math.ceil(table.capacity / 2));

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: table.x, top: table.y, width: table.width, height: table.height }}
    >
      {table.shape === "rect-tall" ? (
        <div className="flex h-full items-center justify-between px-1">
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <SeatRow count={sideSeats} state={state} />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={`h-full w-[72%] rounded-3xl border-[3px] text-[11px] font-semibold transition sm:text-sm ${stateStyles[state]}`}
          >
            {table.label}
          </button>
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <SeatRow count={sideSeats} state={state} />
          </div>
        </div>
      ) : table.shape === "round" ? (
        <div className="relative mx-auto h-full w-full max-w-[120px]">
          <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={`h-full w-full rounded-full border-[3px] text-[11px] font-semibold transition sm:text-sm ${stateStyles[state]}`}
          >
            {table.label}
          </button>
          <RoundSeats count={table.capacity <= 4 ? 4 : 6} state={state} />
        </div>
      ) : (
        <>
          <SeatRow count={topSeats} state={state} />
          <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={`mt-1 h-[calc(100%-1.7rem)] w-full rounded-2xl border-[3px] text-[11px] font-semibold transition sm:h-[calc(100%-1.9rem)] sm:text-sm ${stateStyles[state]}`}
          >
            {table.label}
          </button>
          <div className="mt-1">
            <SeatRow count={bottomSeats} state={state} />
          </div>
        </>
      )}
    </div>
  );
}

export function ReservationForm({ userEmail }: ReservationFormProps) {
  const { min, max } = getReservationDateBounds();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isPending, setIsPending] = useState(false);

  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [loadingTables, setLoadingTables] = useState(false);
  const [tableError, setTableError] = useState("");
  const [tables, setTables] = useState<TableAvailability[]>([]);

  const [partySize, setPartySize] = useState(2);
  const [reservationDate, setReservationDate] = useState(min);
  const [reservationTime, setReservationTime] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");

  const [state, setState] = useState<{ ok: boolean; message: string }>({
    ok: false,
    message: "",
  });

  const quickDates = useMemo(() => {
    const maxDate = parseDate(max);
    const today = parseDate(min);
    const values: { value: string; day: string; dayNum: number }[] = [];

    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + offset);
      if (candidate > maxDate) break;
      const { day, dayNum } = formatShortDate(candidate);
      values.push({ value: toDateValue(candidate), day, dayNum });
    }

    return values;
  }, [max, min]);

  useEffect(() => {
    if (!reservationDate) return;

    const controller = new AbortController();

    const loadAvailability = async () => {
      setLoadingAvailability(true);
      setAvailabilityError("");
      try {
        const { data, error } = await supabase.rpc("get_slot_availability", {
          p_reservation_date: normalizeDateInput(reservationDate),
          p_party_size: partySize,
        });

        if (controller.signal.aborted) return;
        if (error) {
          setSlots([]);
          setAvailabilityError(mapReservationError(error.message) || "Could not load availability.");
          return;
        }

        const nextSlots = (data ?? []).map((item) => ({
          slotTime: formatTime(item.slot_time),
          availableSeats: Number(item.available_seats ?? 0),
          isAvailable: Boolean(item.is_available),
        }));
        setSlots(nextSlots);
        setReservationTime((current) =>
          nextSlots.some((slot) => slot.slotTime === current && slot.isAvailable) ? current : "",
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSlots([]);
          setAvailabilityError("Could not load availability.");
        }
      } finally {
        setLoadingAvailability(false);
      }
    };

    void loadAvailability();

    return () => {
      controller.abort();
    };
  }, [partySize, reservationDate, supabase]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTables = async () => {
      setLoadingTables(true);
      setTableError("");
      try {
        const { data: rawTables, error: tablesError } = await supabase
          .from("restaurant_tables")
          .select("id, label, capacity, zone, shape, layout_x, layout_y, layout_width, layout_height")
          .eq("active", true)
          .order("id", { ascending: true });

        if (controller.signal.aborted) return;
        if (tablesError) {
          setTables([]);
          setTableError(tablesError.message || "Could not load table layout.");
          return;
        }

        let nextTables: TableAvailability[] = (rawTables ?? []).map((table) => ({
          id: table.id,
          label: table.label,
          capacity: Number(table.capacity),
          zone: table.zone,
          shape: normalizeTableShape(table.shape),
          x: `${Number(table.layout_x)}%`,
          y: `${Number(table.layout_y)}%`,
          width: `${Number(table.layout_width)}%`,
          height: `${Number(table.layout_height)}%`,
          isAvailable: Number(table.capacity) >= partySize,
        }));

        if (reservationDate && reservationTime) {
          const { data: availabilityRows, error: availabilityError } = await supabase.rpc(
            "get_table_availability",
            {
              p_reservation_date: normalizeDateInput(reservationDate),
              p_reservation_time: reservationTime,
              p_party_size: partySize,
            },
          );

          if (controller.signal.aborted) return;
          if (availabilityError) {
            if (isFunctionMissingError(availabilityError.message, "get_table_availability")) {
              setTableError("Table availability is not configured yet. Please run latest schema.sql.");
            } else {
              setTableError(availabilityError.message || "Could not load table layout.");
            }
          } else {
            nextTables = (availabilityRows ?? []).map((table) => ({
              id: table.id,
              label: table.label,
              capacity: Number(table.capacity),
              zone: table.zone,
              shape: normalizeTableShape(table.shape),
              x: `${Number(table.layout_x)}%`,
              y: `${Number(table.layout_y)}%`,
              width: `${Number(table.layout_width)}%`,
              height: `${Number(table.layout_height)}%`,
              isAvailable: Boolean(table.is_available),
            }));
          }
        }

        setTables(nextTables);
        setSelectedTableId((current) =>
          nextTables.some((table) => table.id === current && table.isAvailable) ? current : "",
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setTables([]);
          setTableError("Could not load table layout.");
        }
      } finally {
        setLoadingTables(false);
      }
    };

    void loadTables();

    return () => {
      controller.abort();
    };
  }, [partySize, reservationDate, reservationTime, supabase]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.slotTime === reservationTime) ?? null,
    [reservationTime, slots],
  );
  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  const visualTables = useMemo(() => {
    const liveMap = new Map(tables.map((table) => [table.id, table]));
    return fallbackTables.map((base) => {
      const live = liveMap.get(base.id);
      const merged: TableAvailability = {
        id: base.id,
        label: live?.label ?? base.label,
        capacity: live?.capacity ?? base.capacity,
        zone: live?.zone ?? base.zone,
        shape: live?.shape ?? base.shape,
        x: live?.x ?? base.x,
        y: live?.y ?? base.y,
        width: live?.width ?? base.width,
        height: live?.height ?? base.height,
        isAvailable: live?.isAvailable ?? true,
      };
      const visualState: TableVisualState =
        selectedTableId === merged.id ? "selected" : merged.isAvailable ? "available" : "booked";

      return {
        ...merged,
        visualState,
      };
    });
  }, [selectedTableId, tables]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      guestName: String(formData.get("guestName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      guestEmail: String(formData.get("guestEmail") ?? userEmail),
      partySize,
      reservationDate: normalizeDateInput(reservationDate),
      reservationTime,
      selectedTableId,
      specialRequest: String(formData.get("specialRequest") ?? "").trim(),
    };

    const errors = validateReservationPayload(payload);
    if (errors.length > 0) {
      setState({ ok: false, message: errors[0] });
      return;
    }
    if (!payload.selectedTableId) {
      setState({ ok: false, message: "Please select a table." });
      return;
    }

    setIsPending(true);
    setState({ ok: false, message: "" });

    const { error } = await supabase.rpc("create_reservation", {
      p_guest_name: payload.guestName,
      p_guest_email: payload.guestEmail || null,
      p_phone: payload.phone,
      p_party_size: payload.partySize,
      p_reservation_date: payload.reservationDate,
      p_reservation_time: payload.reservationTime,
      p_table_id: payload.selectedTableId,
      p_special_request: payload.specialRequest || null,
    });

    setIsPending(false);
    if (error) {
      setState({ ok: false, message: mapReservationError(error.message) || "Could not create reservation." });
      return;
    }

    form.reset();
    setPartySize(2);
    setReservationDate(min);
    setReservationTime("");
    setSelectedTableId("");
    setSlots([]);
    setTables([]);
    setAvailabilityError("");
    setTableError("");
    setState({ ok: true, message: "Reservation confirmed successfully." });
  };

  return (
    <form onSubmit={onSubmit} className="overflow-hidden rounded-xl border border-[#e6d275] bg-[#f1f1f1]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="p-3 sm:p-4">
          <p className="text-sm font-semibold text-[#3f3f3f]">Select your Table</p>

          <div className="mt-2 rounded-md border-2 border-[#edc91f] bg-[#f5f5f5] p-2 sm:p-3">
            <div className="relative aspect-[4/3] w-full rounded-md bg-[#efefef]">
              {visualTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  state={table.visualState}
                  onSelect={() => {
                    if (table.visualState === "booked") return;
                    setSelectedTableId(table.id);
                    setState({ ok: false, message: "" });
                  }}
                />
              ))}

              <div className="absolute inset-x-0 bottom-2 flex justify-center">
                <div className="text-center">
                  <div className="mx-auto h-5 w-12 rounded-t-[999px] border-2 border-b-0 border-[#e2bf15] sm:h-6 sm:w-16" />
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7e7e7e]">Entry</p>
                </div>
              </div>

              {loadingTables ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-[#f3f3f3cc]">
                  <p className="text-sm font-semibold text-[#636363]">Loading table layout...</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#616161]">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] border border-[#c8c8c8] bg-[#d8d8d8]" />
              Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] border border-[#d3d3d3] bg-[#cbcbcb]" />
              Booked
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] border border-[#e6bc0f] bg-[#f1c40f]" />
              Selected
            </span>
          </div>

          {tableError ? <p className="mt-3 text-sm text-red-700">{tableError}</p> : null}
        </section>

        <aside className="border-l border-[#e6d275] bg-[#f7f7f7] p-4 sm:p-5">
          <h3 className="text-3xl leading-[1.02] text-[#2d2d2d] sm:text-4xl">Book your table</h3>

          <div className="mt-4 space-y-5">
            <div>
              <p className="text-lg font-semibold text-[#343434]">Date</p>
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {quickDates.map((quickDate) => {
                  const selected = reservationDate === quickDate.value;
                  return (
                    <button
                      key={quickDate.value}
                      type="button"
                      onClick={() => {
                        setReservationDate(quickDate.value);
                        setReservationTime("");
                      }}
                      className={`rounded-md border px-1 py-2 text-center ${
                        selected
                          ? "border-[#f1c40f] bg-[#f1c40f] text-[#1f1a03]"
                          : "border-[#dbdbdb] bg-white text-[#4d4d4d]"
                      }`}
                    >
                      <span className="block text-[14px] font-bold leading-none">{quickDate.dayNum}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold uppercase">{quickDate.day}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                min={min}
                max={max}
                value={reservationDate}
                onChange={(event) => {
                  setReservationDate(normalizeDateInput(event.currentTarget.value));
                  setReservationTime("");
                }}
                className="ui-field mt-2 text-sm !border-[#d9d9d9] !bg-white"
              />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#343434]">Time</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {loadingAvailability ? (
                  <p className="col-span-2 text-sm text-[#757575]">Loading time slots...</p>
                ) : slots.length ? (
                  slots.map((slot) => {
                    const selected = reservationTime === slot.slotTime;
                    return (
                      <button
                        key={slot.slotTime}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => {
                          setReservationTime(slot.slotTime);
                        }}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                          selected
                            ? "border-[#f1c40f] bg-[#f1c40f] text-[#1f1a03]"
                            : slot.isAvailable
                              ? "border-[#d9d9d9] bg-white text-[#3f3f3f]"
                              : "cursor-not-allowed border-[#e0e0e0] bg-[#efefef] text-[#979797]"
                        }`}
                      >
                        {slot.slotTime}
                      </button>
                    );
                  })
                ) : (
                  <p className="col-span-2 text-sm text-[#7d7d7d]">No seats available for this date and party size.</p>
                )}
              </div>
              {availabilityError ? <p className="mt-2 text-sm text-red-700">{availabilityError}</p> : null}
            </div>

            <div>
              <p className="text-lg font-semibold text-[#343434]">Guests</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Array.from({ length: reservationRules.maxPartySize }).map((_, index) => {
                  const seats = index + 1;
                  const selected = partySize === seats;
                  return (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => {
                        setPartySize(seats);
                      }}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                        selected
                          ? "border-[#f1c40f] bg-[#f1c40f] text-[#1f1a03]"
                          : "border-[#d9d9d9] bg-white text-[#3f3f3f]"
                      }`}
                    >
                      {seats}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#dfdfdf] bg-white p-3">
              <p className="text-base font-semibold text-[#363636]">
                Table: <span className="font-bold">{selectedTable?.label ?? "Not selected"}</span>
              </p>
              <p className="mt-1 text-sm text-[#6f6f6f]">
                {selectedTable ? `ID: ${selectedTable.id.toUpperCase()}, seats up to ${selectedTable.capacity}` : "Select a table from the map."}
              </p>
              <p className="mt-1 text-sm text-[#6f6f6f]">
                {selectedSlot ? `${selectedSlot.availableSeats} seats left for ${reservationTime}` : "Pick date and time to validate availability."}
              </p>
            </div>

            <button
              type="submit"
              disabled={
                isPending ||
                loadingAvailability ||
                loadingTables ||
                !reservationDate ||
                !reservationTime ||
                !selectedTableId
              }
              className="w-full rounded-xl bg-[#f1c40f] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#1e1a02] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isPending ? "Booking..." : "Book Now"}
            </button>
          </div>
        </aside>
      </div>

      <section className="border-t border-[#e6d275] bg-[#f7f7f7] p-4 sm:p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#7a7a7a]">Guest Details</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-[#4d4d4d]">Name</span>
            <input required minLength={2} name="guestName" className="ui-field !border-[#d9d9d9] !bg-white" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[#4d4d4d]">Phone</span>
            <input required name="phone" minLength={8} className="ui-field !border-[#d9d9d9] !bg-white" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-[#4d4d4d]">Email</span>
            <input
              required
              type="email"
              name="guestEmail"
              defaultValue={userEmail}
              className="ui-field !border-[#d9d9d9] !bg-white"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-[#4d4d4d]">Special request</span>
            <textarea name="specialRequest" rows={3} className="ui-field !border-[#d9d9d9] !bg-white" />
          </label>
        </div>
      </section>

      {state.message ? (
        <p className={`px-4 py-3 text-sm sm:px-5 ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
