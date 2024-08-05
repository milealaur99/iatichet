import { NextFunction, Request, Response } from "express";
import Event from "../models/Event";
import Hall from "../models/Hall";
import mongoose from "mongoose";
import { AppError } from "../middlewares/errorMiddleware";
import { filterEvents } from "../utils/eventHelpers";
import { upload } from "../middlewares/uploadImageMiddleware";
import { fork } from "child_process";
import path from "path";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, async (err) => {
    console.log(err, req);
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
        path.join(__dirname, "..", "..", "src", "utils", "imageProcessor.ts")
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

        await res
          .status(201)
          .json({ message: "Event created successfully", event });
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
      date?: Date;
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
    }: {
      price?: number;
      date?: Date | [Date, Date];
      hall?: string;
      seatsPercentage?: number;
    } = req.query;

    const page: number = req.query.page ? +req.query.page : 1;
    const skip: number = (page - 1) * 10;

    const currentEvents = await Event.find();

    const filteredEvents = filterEvents(
      currentEvents,
      price,
      date,
      hall,
      seatsPercentage
    );
    if (filteredEvents.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }
    const totalPages = Math.ceil(filteredEvents.length / 10);
    const firstTenEvents = filteredEvents.slice(skip, skip + 10);

    return res.status(200).json({
      events: firstTenEvents,
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
    console.log("intra aici fara sens");
    const eventModel = await Event.findById(req.params.id);
    if (!eventModel) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(eventModel);
  } catch (error) {
    next(new AppError("Error fetching event", 400));
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, date, location, seatsAvailable } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        _id: new mongoose.Types.ObjectId(),
        name,
        description,
        date,
        location,
        seatsAvailable,
      },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error) {
    next(new AppError("Error updating event", 400));
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
