import { Event as EventType } from "../models/Event";

export const filterEvents = (
  events: EventType[],
  price: number | undefined,
  date: string | Date | [Date, Date] | undefined,
  hall: string | undefined,
  seatsPercentage: number | undefined
) => {
  let filteredEvents = [...events];

  if (price) {
    filteredEvents = filteredEvents.filter(
      (event) => event.tichetPrice <= price
    );
  }

  if (date) {
    if (typeof date === "string") {
      const dateFilter = new Date(date);
      filteredEvents = filteredEvents.filter(
        (event) => event.date.getTime() === dateFilter.getTime()
      );
    } else if (Array.isArray(date)) {
      const [startDate, endDate] = date;
      const startDateFilter = new Date(startDate);
      const endDateFilter = new Date(endDate);
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.date.getTime() >= startDateFilter.getTime() &&
          event.date.getTime() <= endDateFilter.getTime()
      );
    }
  }

  if (hall) {
    filteredEvents = filteredEvents.filter(
      (event) => event.hall.toString() === hall
    );
  }

  if (seatsPercentage) {
    filteredEvents = filteredEvents.filter((event) => {
      const occupiedSeatsCount = event.seats.filter(
        (seat) => seat.reservationOps.isReserved
      ).length;
      const totalSeatsCount = event.seats.length;
      const percentage = (occupiedSeatsCount / totalSeatsCount) * 100;
      return percentage >= seatsPercentage;
    });
  }

  return filteredEvents;
};
