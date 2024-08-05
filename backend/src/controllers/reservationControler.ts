import { Request, Response, NextFunction } from "express";
import Reservation, {
  Reservation as ReservationType,
} from "../models/Reservation";
import { Hall as HallType, Seat } from "../models/Hall";
import EventModel, { Event } from "../models/Event";
import { getAsync, setAsync } from "../utils/redisUtils";
import { AppError } from "../middlewares/errorMiddleware";

export const createReservation = async (
  req: Request & {
    user?: { id: string; username: string; password: string };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, seats, date, price } = req.body;
    let eventModel: Event | undefined;

    const eventFromRedis = (await getAsync(`/api/events/${eventId}`)) as Event;

    if (eventFromRedis) {
      eventModel = eventFromRedis;
    } else {
      eventModel = (await EventModel.findById(eventId)) as Event;
    }

    if (!eventModel || !eventModel.seats) {
      return res.status(404).json({ message: "Event not found" });
    }

    const unavailableSeats = (seats as HallType["seats"]).filter((seat) => {
      const hallSeat = eventModel.seats.find(
        (hallSeat) =>
          hallSeat.row === seat.row && hallSeat.number === seat.number
      );
      return hallSeat?.reservationOps.isReserved;
    });

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        message: "Some seats are already reserved",
        unavailableSeats,
      });
    }

    const reservation: ReservationType = new Reservation({
      user: req?.user?.id,
      event: eventModel._id,
      hall: eventModel.hall,
      seats,
      date,
      price: seats.length * price,
    });

    await setAsync({
      key: `/api/events/${eventId}`,
      value: {
        ...eventModel,
        seats: eventModel.seats.map((seat) => {
          if (
            seats.find(
              (s: Seat) => s.row === seat.row && s.number === seat.number
            )
          ) {
            seat.reservationOps = {
              isReserved: true,
              reservation: reservation.id.toString(),
            };
          }
          return seat;
        }),
      },
    });

    res.status(201).json({
      message: "Draft of reservation created successfully",
      reservation,
    });
  } catch (error) {
    next(new AppError("Error creating reservation", 400));
  }
};

export const getAllReservations = async (
  req: Request & { query: { page?: number } },
  res: Response,
  next: NextFunction
) => {
  try {
    const page: number = req.query.page ? +req.query.page : 1;
    const skip: number = (page - 1) * 10;

    const currentReservations = (await getAsync(
      "/api/reservations"
    )) as ReservationType[];
    const reservations = currentReservations;
    const filteredReservations = reservations.slice(skip, skip + 10);

    const totalPages = Math.ceil(reservations.length / 10);

    return res.status(200).json({
      reservations: filteredReservations,
      totalPages,
      page,
    });
  } catch (error) {
    next(new AppError("Error fetching reservations", 400));
  }
};

export const getReservationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentReservations = (await getAsync(
      "/api/reservations"
    )) as ReservationType[];
    const reservationFromCache = currentReservations.find(
      (reservation: ReservationType) => reservation._id === req.params.id
    );

    if (reservationFromCache) {
      return res.status(200).json(reservationFromCache);
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json(reservation);
  } catch (error) {
    next(new AppError("Error fetching reservation", 400));
  }
};

export const deleteReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    const eventModel = await EventModel.findById(reservation.event);

    if (!eventModel) {
      return res.status(404).json({ message: "Event not found" });
    }

    for (const seat of reservation.seats) {
      const hallSeat = eventModel.seats.find(
        (s) => s.row === seat.row && s.number === seat.number
      );
      if (hallSeat) {
        hallSeat.reservationOps = {
          isReserved: false,
          reservation: null,
        };
      }
    }
    await eventModel.save();
    await Reservation.findByIdAndDelete(req.params.id);

    const currentReservations = (await getAsync(
      "/api/reservations"
    )) as ReservationType[];
    if (currentReservations) {
      await setAsync({
        key: "/api/reservations",
        value: currentReservations?.filter(
          (reservation: ReservationType) => reservation._id !== req.params.id
        ),
      });
    } else {
      await setAsync({
        key: "/api/reservations",
        value: await Reservation.find(),
      });
    }

    res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (error) {
    next(new AppError("Error deleting reservation", 400));
  }
};

export const getUserReservations = async (
  req: Request & {
    user?: {
      id: string;
      username: string;
      password: string;
    };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const currentReservations = (await getAsync(
      `/api/reservations/${req.user?.id}`
    )) as ReservationType[];

    if (currentReservations) {
      return res.status(200).json(currentReservations);
    }

    const reservations = await Reservation.find({ user: req.user?.id });
    res.status(200).json(reservations);
  } catch (error) {
    next(new AppError("Error fetching reservations", 400));
  }
};
