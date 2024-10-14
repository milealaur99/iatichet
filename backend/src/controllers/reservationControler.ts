import { Request, Response, NextFunction } from "express";
import Reservation, {
  Reservation as ReservationType
} from "../models/Reservation";
import Hall, { Hall as HallType, Seat } from "../models/Hall";
import EventModel, { Event } from "../models/Event";
import { getAsync, setAsync, timeoutStorage } from "../utils/redisUtils";
import { AppError } from "../middlewares/errorMiddleware";
import { omit } from "lodash";

export const createReservation = async (
  req: Request & {
    user?: { id: string; username: string; password: string };
    body: { eventId: string; seats: Seat[] };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      timeoutStorage.get(`restoreSeatsForUnpaidReservations-${req.user?.id}`)
    ) {
      return res.status(400).json({
        message: "You have an unpaid reservation in progress"
      });
    }
    if (!req.body.seats || req.body.seats.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }

    if (req.body.seats.length > 5) {
      return res.status(400).json({ message: "Max 5 seats per reservation" });
    }

    const { eventId, seats } = req.body;

    let eventModel: Event = (await EventModel.findById(eventId)) as Event;
    const currentDate = new Date();

    if (!eventModel) {
      return res.status(400).json({ message: "Invalid event" });
    }

    if (currentDate > new Date(eventModel?.date)) {
      return res.status(400).json({ message: "Event has already passed" });
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
        unavailableSeats
      });
    }

    const hall = await Hall.findById(eventModel.hall);
    if (!hall) {
      return next(new AppError("Hall not found", 404));
    }

    const reservation: ReservationType = new Reservation({
      user: req?.user?.id,
      event: eventModel._id,
      hall: hall._id,
      seats,
      date: new Date(),
      price: seats.length * eventModel.tichetPrice * 100,
      eventDate: eventModel.date
    });

    eventModel.seats = [
      ...eventModel.seats,
      ...seats.map((seat: Seat) => ({
        ...seat,
        reservationOps: {
          ...seat.reservationOps,
          isReserved: true,
          reservation: reservation._id
        }
      }))
    ];

    await eventModel.save();
    await reservation.save();

    const restoreSeatsForUnpaidReservations = setTimeout(async () => {
      const eventModel: Event = (await EventModel.findById(eventId)) as Event;
      const reservationModel: ReservationType | null =
        await Reservation.findById(reservation._id);

      if (!eventModel || !reservationModel) {
        return;
      }

      const reservationWasPaid =
        reservationModel.isPaid &&
        seats.every(
          (seat: Seat) =>
            eventModel.seats.find(
              (hallSeat) =>
                hallSeat.row === seat.row &&
                hallSeat.number === seat.number &&
                hallSeat.reservationOps.isReserved &&
                hallSeat.reservationOps.reservation ===
                  reservationModel.id.toString()
            ) !== undefined
        );

      if (!reservationWasPaid) {
        eventModel.seats = eventModel.seats.filter((hallSeat) => {
          return !seats.some((seat: Seat) => {
            return hallSeat.row === seat.row && hallSeat.number === seat.number;
          });
        });
        await eventModel.save();
        await Reservation.findByIdAndDelete(reservation._id);
      }
      timeoutStorage.delete(
        `restoreSeatsForUnpaidReservations-${reservation.user}`
      );
    }, 30000);

    timeoutStorage.set(
      `restoreSeatsForUnpaidReservations-${reservation.user}`,
      restoreSeatsForUnpaidReservations
    );

    res.status(201).json({
      message: "Draft of reservation created successfully",
      reservation
    });
  } catch (error) {
    next(new AppError("Error creating reservation", 400));
  }
};

export const getAllReservations = async (
  req: Request & { query: { page?: number }; user?: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const page: number = req.query.page ? +req.query.page : 1;
    const skip: number = (page - 1) * 10;

    let currentReservations = (await getAsync(
      "/api/reservations"
    )) as ReservationType[];

    if (!currentReservations) {
      currentReservations = await Reservation.find({ user: req.user?.id }).sort(
        {
          date: 1
        }
      );
      await setAsync({
        key: "/api/reservations",
        value: currentReservations
      });
    }

    const reservations = currentReservations;
    const filteredReservations = reservations.slice(skip, skip + 10);

    const totalPages = Math.ceil(reservations.length / 10);

    return res.status(200).json({
      reservations: filteredReservations,
      totalPages,
      page
    });
  } catch (error) {
    next(new AppError("Error fetching reservations", 400));
  }
};

export const getReservationById = async (
  req: Request & { user?: { id: string; role: "user" | "admin" } },
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("user")
      .populate("hall", "name");

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json(reservation);
  } catch (error) {
    next(new AppError("Error fetching reservation", 400));
  }
};

export const deleteReservation = async (
  req: Request & {
    user?: {
      id: string;
      username: string;
      password: string;
      role: "user" | "admin";
    };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && reservation?.user.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden access" });
    }

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
          reservation: null
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
        )
      });
    } else {
      await setAsync({
        key: "/api/reservations",
        value: await Reservation.find()
      });
    }

    const userReservations = (await getAsync(
      `/api/reservations/user/${reservation.user}`
    )) as ReservationType[];

    if (userReservations) {
      await setAsync({
        key: `/api/reservations/user/${reservation.user}`,
        value: userReservations?.filter(
          (reservation: ReservationType) => reservation._id !== req.params.id
        )
      });
    } else {
      await setAsync({
        key: `/api/reservations/user/${reservation.user}`,
        value: await Reservation.find({ user: reservation.user })
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
      role: "user" | "admin";
    };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const isCurrentUser = req.user?.id === req.params.userId;
    const isAdmin = req.user?.role === "admin";

    if (!isCurrentUser && !isAdmin) {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const page: number = req.query.page ? +req.query.page : 1;
    const limit: number = 10;
    const skip: number = (page - 1) * limit;

    const reservations = (await Reservation.find({
      user: req.params.userId || req.user?.id
    })
      .populate("event")
      .populate("hall")
      .sort({
        date: -1
      })) as (ReservationType & {
      event: Event;
      hall: HallType;
    })[];

    if (!reservations) {
      return res.status(404).json({ message: "Reservations not found" });
    }

    const totalPages = Math.ceil(reservations.length / limit);
    const filteredReservations = reservations
      .slice(skip, skip + limit)
      .map((reservation) =>
        omit(
          {
            eventName: reservation.event.name,
            eventId: reservation.event._id,
            hall: reservation.hall,
            ...(reservation.toObject() as object)
          },
          ["event", "hall"]
        )
      );

    res.status(200).json({
      reservations: filteredReservations,
      totalPages,
      page
    });
  } catch (error) {
    next(new AppError("Error fetching reservations", 400));
  }
};

export const cancelPendingReservations = async (
  req: Request & {
    user?: {
      id: string;
      username: string;
      password: string;
      role: "user" | "admin";
    };
    body: {
      reservationId: string;
    };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const reservation = (await Reservation.findById(
      req.params.id
    )) as ReservationType;

    if (!reservation) {
      return res.status(404).json({ message: "Reservations not found" });
    }

    if (
      reservation.user.toString() !== req.user?.id &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden access" });
    }

    const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user}`;

    clearTimeout(timeoutStorage.get(restoreSeatsForUnpaidReservations));
    timeoutStorage.delete(restoreSeatsForUnpaidReservations);

    const eventModel = await EventModel.findById(reservation.event);
    if (!eventModel) {
      return res.status(404).json({ message: "Event not found" });
    }

    eventModel.seats = eventModel.seats.filter((hallSeat) => {
      return !reservation.seats.some((seat) => {
        return hallSeat.row === seat.row && hallSeat.number === seat.number;
      });
    });

    await Reservation.findByIdAndDelete(req.params.id);
    await eventModel.save();
    let currentReservations = (await getAsync(
      "/api/reservations"
    )) as ReservationType[];
    if (!currentReservations) {
      currentReservations = await Reservation.find({ user: req.user?.id }).sort(
        { date: -1 }
      );
      await setAsync({
        key: "/api/reservations",
        value: currentReservations.filter(
          (reservation: ReservationType) => reservation._id !== req.params.id
        )
      });
    }

    return res.status(200).json({ message: "Reservations canceled" });
  } catch (error) {
    next(new AppError("Error canceling reservations", 400));
  }
};
