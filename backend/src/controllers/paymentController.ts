import path from "path";
import stripe from "../services/stripe";
import ReservationModel, { Reservation } from "../models/Reservation";
import Event, { Event as EventType } from "../models/Event";
import { generateReservationPDF } from "../utils/pdfGenerator";
import { getAsync, setAsync } from "../utils/redisUtils";
import { Request, Response } from "express";
import { set } from "lodash";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { reservation } = req.body as { reservation: Reservation };
  if (!stripe) {
    return res.status(500).json({ message: "Stripe not initialized" });
  }
  const successUrl = `${req.protocol}://${req.get("host")}/success`;
  const cancelUrl = `${req.protocol}://${req.get("host")}/cancel`;

  const event = await Event.findById(reservation.event);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: event.name,
          },
          unit_amount: reservation.price * 100,
        },
        quantity: reservation.seats.length,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  res.json({ id: session.id });
};

export const success = async (
  req: Request & {
    user?: { id: string; username: string; password: string };
    body: {
      reservation: Reservation;
    };
  },
  res: Response
) => {
  const { reservation } = req.body as { reservation: Reservation };

  const pdfPath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    "pdfs",
    `${reservation.id}.pdf`
  );

  const eventModel: EventType | null = await Event.findById(reservation.event);
  const seats = reservation.seats;

  if (!eventModel || !seats) {
    return res.status(404).json({ message: "Event not found" });
  }

  for (const seat of seats) {
    const hallSeat = eventModel.seats.find(
      (s) => s.row === seat.row && s.number === seat.number
    );
    if (hallSeat && reservation.id) {
      hallSeat.reservationOps = {
        isReserved: true,
        reservation: reservation.id.toString(),
      };
    }
  }

  await eventModel.save();
  await reservation.save();

  const currentReservations = (await getAsync(
    "/api/reservations"
  )) as Reservation[];

  if (currentReservations) {
    await setAsync({
      key: "/api/reservations",
      value: [...currentReservations, reservation],
    });
  } else {
    await setAsync({
      key: "/api/reservations",
      value: await ReservationModel.find(),
    });
  }

  const userReservations = (await getAsync(
    `/api/reservations/${req?.user?.id}`
  )) as Reservation[];

  if (userReservations) {
    await setAsync({
      key: `/api/reservations/${req?.user?.id}`,
      value: [...userReservations, reservation],
    });
  } else {
    await setAsync({
      key: `/api/reservations/${req?.user?.id}`,
      value: await ReservationModel.find({ user: req?.user?.id }),
    });
  }

  await generateReservationPDF(reservation, pdfPath);

  res.download(pdfPath);

  res.status(201).json({
    message: "Reservation created successfully",
    reservation,
  });
};

export const cancel = async (
  req: Request & {
    user?: { id: string; username: string; password: string };
    body: {
      reservation: Reservation;
    };
  },
  res: Response
) => {
  const { reservation } = req.body as { reservation: Reservation };
  const reservationModel = await ReservationModel.findById(reservation.id);
  if (!reservationModel) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  const currentReservations = (await getAsync(
    "/api/reservations"
  )) as Reservation[];

  if (currentReservations) {
    const updatedReservations = currentReservations.filter(
      (r) => r.id !== reservation.id
    );
    await setAsync({ key: "/api/reservations", value: updatedReservations });
  }

  const userReservations = (await getAsync(
    `/api/reservations/${req?.user?.id}`
  )) as Reservation[];

  if (userReservations) {
    const updatedUserReservations = userReservations.filter(
      (r) => r.id !== reservation.id
    );
    await setAsync({
      key: `/api/reservations/${req?.user?.id}`,
      value: updatedUserReservations,
    });
  }

  const event = await Event.findById(reservation.event);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  for (const seat of reservation.seats) {
    const hallSeat = event.seats.find(
      (s) => s.row === seat.row && s.number === seat.number
    );
    if (hallSeat) {
      hallSeat.reservationOps = {
        isReserved: false,
        reservation: "",
      };
    }
  }
  await event.save();
  await ReservationModel.findByIdAndDelete(reservation.id);

  await setAsync({
    key: `/api/events/${reservation.event}`,
    value: event,
  });

  res.status(200).json({ message: "Reservation canceled" });
};
