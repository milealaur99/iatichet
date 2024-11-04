import { NextFunction, Request, Response } from "express";
import Event, { Event as EventType } from "../models/Event";
import Hall, { Seat } from "../models/Hall";
import { AppError } from "../middlewares/errorMiddleware";
import { upload } from "../middlewares/uploadImageMiddleware";
import { fork } from "child_process";
import path from "path";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file selected!" });
    }

    try {
      const { name, description, date, hall, tichetPrice } = req.body;
      const hallModel = await Hall.findOne({ name: hall });

      if (!hallModel) {
        return res.status(404).json({ message: "Hall not found" });
      }

      const eventAlreadyExists = await Event.findOne({ name });

      if (eventAlreadyExists) {
        return res
          .status(409)
          .json({ message: "The name of the event already exists" });
      }
      const child = fork(
        path.join(__dirname, "..", "..", "src", "utils", "imageProcessor.js")
      );

      child.send(req.file.path);

      child.on("message", async (message: { processedPath: string }) => {
        const { processedPath } = message;

        const event = new Event({
          name,
          description,
          date,
          tichetPrice,
          hall: hallModel._id,
          seats: [],
          poster: processedPath,
        });

        await event.save();

        res.status(201).json({
          message: "Event created successfully",
          event: { ...event.toObject(), hall: hallModel.name },
        });
      });

      child.on("error", (error) => {
        next(new AppError("Error processing image", 500));
      });
    } catch (error) {
      next(new AppError("Error creating event", 400));
    }
  });
};

export const getAllEvents = async (
  req: Request & {
    query?: {
      page?: number;
      price?: number;
      date?: string;
      hall?: string;
      seatsPercentage?: number;
    };
  },
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      price,
      date,
      hall,
      seatsPercentage,
      search,
    }: {
      price?: number;
      date?: string;
      hall?: string;
      seatsPercentage?: number;
      search?: string;
    } = req.query;

    const page: number = req.query.page ? +req.query.page : 1;
    const skip: number = (page - 1) * 10;
    const [startDate, endDate] = (date || "").split("|") as [string, string];
    const parsedStartDate = startDate
      ? new Date(+startDate)
      : new Date().setHours(0, 0, 0, 0);
    const parsedEndDate = endDate
      ? new Date(+endDate).setHours(23, 59, 59, 999)
      : undefined;

    const hallId = hall ? (await Hall.findOne({ name: hall }))?._id : null;

    const query: Object = {
      ...(price ? { tichetPrice: { $lte: Number(price) } } : {}),
      ...(search ? { name: { $regex: new RegExp(search, "i") } } : {}),
      ...(hall ? { hall: hallId } : {}),
      ...(startDate && endDate
        ? {
            date: {
              $gte: parsedStartDate,
              $lte: parsedEndDate,
            },
          }
        : { date: { $gte: new Date().setHours(0, 0, 0, 0) } }),
    };
    let currentEvents = await Event.find(query).populate("hall");

    if (seatsPercentage !== undefined) {
      currentEvents = currentEvents.filter(async (event: EventType) => {
        const totalSeats = event.seats.length;
        const eventHall = await Hall.find(event.hall);
        const hallSeats = eventHall[0].seats;

        const availableSeats = hallSeats.filter(
          (seat: Seat) => !seat.reservationOps.isReserved
        ).length;
        const calculatedSeatsPercentage = (availableSeats / totalSeats) * 100;

        return calculatedSeatsPercentage >= seatsPercentage;
      });
    }

    const totalEvents = currentEvents.length;
    currentEvents = currentEvents.slice(skip, skip + 10);

    const eventsWithHall = currentEvents.map((event: EventType) => ({
      ...event.toObject(),
      hall: (event.hall as unknown as EventType)?.name || "",
    }));

    if (eventsWithHall.length === 0) {
      return res.status(200).json({
        events: [],
        totalPages: 0,
        page: 1,
      });
    }

    const totalPages = Math.ceil(totalEvents / 10);

    return res.status(200).json({
      events: eventsWithHall,
      totalPages,
      page,
    });
  } catch (error) {
    next(new AppError("Error fetching events", 400));
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventModel = await Event.findById(req.params.id).populate("hall");
    if (!eventModel) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({
      ...eventModel.toObject(),
      hall: (eventModel.hall as any)?.name || "",
    });
  } catch (error) {
    next(new AppError("Error fetching event", 400));
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    next(new AppError("Error deleting event", 400));
  }
};
