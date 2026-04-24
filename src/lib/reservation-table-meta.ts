const TABLE_TOKEN = /\[table=([a-z0-9_-]+)\]/i;
const SEATS_TOKEN = /\[seats=(\d+)\]/i;

export const parseReservationTableMeta = (specialRequest: string | null) => {
  if (!specialRequest) {
    return { tableId: null as string | null, seats: null as number | null, note: "" };
  }

  const tableMatch = specialRequest.match(TABLE_TOKEN);
  const seatsMatch = specialRequest.match(SEATS_TOKEN);

  const note = specialRequest
    .replace(TABLE_TOKEN, "")
    .replace(SEATS_TOKEN, "")
    .trim();

  return {
    tableId: tableMatch?.[1] ?? null,
    seats: seatsMatch ? Number(seatsMatch[1]) : null,
    note,
  };
};

export const buildReservationSpecialRequest = (input: {
  tableId: string;
  seats: number;
  note: string;
}) => {
  const prefix = `[table=${input.tableId}][seats=${input.seats}]`;
  const cleanNote = input.note.trim();
  return cleanNote.length > 0 ? `${prefix} ${cleanNote}` : prefix;
};
