const LUNCH_WINDOW = { start: "12:00", end: "15:00" };
const DINNER_WINDOW = { start: "18:00", end: "22:30" };

export const reservationRules = {
  minLeadDays: 0,
  maxAdvanceDays: 30,
  slotIntervalMinutes: 30,
  minPartySize: 1,
  maxPartySize: 12,
  closedWeekday: 1,
  windows: [LUNCH_WINDOW, DINNER_WINDOW],
};

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const dateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

export const getReservationDateBounds = () => {
  const today = dateOnly(new Date());
  const min = new Date(today);
  min.setDate(min.getDate() + reservationRules.minLeadDays);

  const max = new Date(today);
  max.setDate(max.getDate() + reservationRules.maxAdvanceDays);

  return {
    min: min.toISOString().slice(0, 10),
    max: max.toISOString().slice(0, 10),
  };
};

export const isValidReservationDate = (dateValue: string) => {
  if (!dateValue) return false;

  const { min, max } = getReservationDateBounds();
  const date = parseLocalDate(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  if (date < parseLocalDate(min) || date > parseLocalDate(max)) {
    return false;
  }

  return date.getDay() !== reservationRules.closedWeekday;
};

export const isValidReservationTime = (timeValue: string) => {
  if (!timeValue) return false;

  const totalMinutes = minutesFromTime(timeValue);
  const intervalOk = totalMinutes % reservationRules.slotIntervalMinutes === 0;
  if (!intervalOk) {
    return false;
  }

  return reservationRules.windows.some((window) => {
    const start = minutesFromTime(window.start);
    const end = minutesFromTime(window.end);
    return totalMinutes >= start && totalMinutes <= end;
  });
};

export const validateReservationPayload = (input: {
  guestName: string;
  phone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
}) => {
  const errors: string[] = [];

  if (input.guestName.trim().length < 2) {
    errors.push("Guest name is too short.");
  }

  if (input.phone.trim().length < 8) {
    errors.push("Phone number is invalid.");
  }

  if (
    Number.isNaN(input.partySize) ||
    input.partySize < reservationRules.minPartySize ||
    input.partySize > reservationRules.maxPartySize
  ) {
    errors.push(
      `Party size must be between ${reservationRules.minPartySize} and ${reservationRules.maxPartySize}.`,
    );
  }

  if (!isValidReservationDate(input.reservationDate)) {
    errors.push("Selected date is unavailable.");
  }

  if (!isValidReservationTime(input.reservationTime)) {
    errors.push("Selected time is outside reservation slots.");
  }

  return errors;
};
