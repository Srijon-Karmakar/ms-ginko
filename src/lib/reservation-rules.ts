export const reservationRules = {
  minLeadDays: 0,
  maxAdvanceDays: 30,
  slotIntervalMinutes: 30,
  minPartySize: 1,
  maxPartySize: 6,
  openingTime: "10:00",
  closingTime: "22:00",
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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildSlots = () => {
  const [openingHour, openingMinute] = reservationRules.openingTime.split(":").map(Number);
  const [closingHour, closingMinute] = reservationRules.closingTime.split(":").map(Number);

  const start = openingHour * 60 + openingMinute;
  const end = closingHour * 60 + closingMinute;
  const values: string[] = [];

  for (let minute = start; minute <= end; minute += reservationRules.slotIntervalMinutes) {
    const hours = Math.floor(minute / 60)
      .toString()
      .padStart(2, "0");
    const mins = (minute % 60).toString().padStart(2, "0");
    values.push(`${hours}:${mins}`);
  }

  return values;
};

const slots = buildSlots();

export const getReservationTimeSlots = () => slots;

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

  return true;
};

export const isValidReservationTime = (timeValue: string) => {
  if (!timeValue) return false;

  const totalMinutes = minutesFromTime(timeValue);
  const intervalOk = totalMinutes % reservationRules.slotIntervalMinutes === 0;
  if (!intervalOk) {
    return false;
  }

  const start = minutesFromTime(reservationRules.openingTime);
  const end = minutesFromTime(reservationRules.closingTime);
  return totalMinutes >= start && totalMinutes <= end;
};

export const validateReservationPayload = (input: {
  guestName: string;
  guestEmail?: string;
  phone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
}) => {
  const errors: string[] = [];

  if (input.guestName.trim().length < 2) {
    errors.push("Guest name is too short.");
  }

  if (input.guestEmail && !emailPattern.test(input.guestEmail.trim())) {
    errors.push("Email is invalid.");
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
