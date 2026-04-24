type ReservationNotificationInput = {
  guestName: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

export const buildReservationEmailTemplate = (input: ReservationNotificationInput) => {
  const subject = `Reservation ${input.status} - Ms Ginko`;
  const body = [
    `Hi ${input.guestName},`,
    "",
    `Your reservation is currently ${input.status}.`,
    `Date: ${input.reservationDate}`,
    `Time: ${input.reservationTime}`,
    `Party size: ${input.partySize}`,
    "",
    "If you need to make changes, visit your dashboard.",
    "",
    "Ms Ginko Team",
  ].join("\n");

  return { subject, body };
};

export const buildReservationSmsTemplate = (input: ReservationNotificationInput) => {
  return `Ms Ginko: ${input.status.toUpperCase()} booking for ${input.guestName} on ${input.reservationDate} ${input.reservationTime}, party ${input.partySize}.`;
};
