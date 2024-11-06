import path from "path";
import ReservationModel, { Reservation } from "../models/Reservation";
import Event, { Event as EventType } from "../models/Event";
import { generateReservationPDF } from "../utils/pdfGenerator";
import { timeoutStorage, getAsync, setAsync } from "../utils/redisUtils";
import { Request, Response } from "express";
import Stripe from "stripe";
import fs from "fs";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { reservation } = req.body as { reservation: Reservation };
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    if (!stripe) {
      return res.status(500).json({ message: "Stripe not initialized" });
    }
    const successUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/payment/success?reservationId=${reservation._id}`;
    const cancelUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/payment/cancel?reservationId=${reservation._id}`;
    const event = await Event.findById(reservation.event);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "RON",
            product_data: {
              name: event.name,
            },
            unit_amount: event.tichetPrice * 100,
          },
          quantity: reservation.seats.length,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    const reservationModel: Reservation | null =
      await ReservationModel.findById(reservation._id);
    if (!reservationModel || !session.url) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    reservationModel.paymentLink = session.url;

    await reservationModel.save();

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
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
  try {
    const { reservationId } = req.query;

    const reservation: Reservation | null = await ReservationModel.findById(
      reservationId
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const pdfPath = path.join(
      __dirname,
      "..",
      "..",
      "pdfs",
      `${(reservation._id as string).toString()}.pdf`
    );
    const eventModel: EventType | null = await Event.findById(
      reservation.event
    );
    const seats = reservation.seats;

    if (!eventModel || !seats) {
      return res.status(404).json({ message: "Event not found" });
    }

    for (const seat of seats) {
      const hallSeat = {
        reservationOps: {
          isReserved: true,
          reservation: (reservation._id as string).toString(),
        },
        row: seat.row,
        number: seat.number,
        reservation: (reservation._id as string).toString(),
      };

      eventModel.seats.push(hallSeat);
    }

    reservation.isPaid = true;

    await eventModel.save();
    await reservation.save();

    const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user.toString()}`;

    clearTimeout(timeoutStorage.get(restoreSeatsForUnpaidReservations));
    timeoutStorage.delete(restoreSeatsForUnpaidReservations);
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
      `/api/reservations/${reservation.user.toString()}`
    )) as Reservation[];

    if (userReservations) {
      await setAsync({
        key: `/api/reservations/${reservation.user.toString()}`,
        value: [...userReservations, reservation],
      });
    } else {
      await setAsync({
        key: `/api/reservations/${reservation.user.toString()}`,
        value: await ReservationModel.find({
          user: reservation.user.toString(),
        }),
      });
    }

    const currentEvent = (await getAsync(
      `/api/events/${reservation.event.toString()}`
    )) as EventType;

    await setAsync({
      key: `/api/events/${reservation.event.toString()}`,
      value: { ...currentEvent, seats: eventModel.seats },
    });

    await generateReservationPDF(reservation, pdfPath);

    res.redirect(
      `${process.env.REACT_APP_FRONTEND_URL}/success/${reservation._id}?eventId=${reservation.event}`
    );
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
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
  const { reservationId } = req.query;

  const reservation: Reservation | null = await ReservationModel.findById(
    reservationId
  );

  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  const currentReservations = (await getAsync(
    "/api/reservations"
  )) as Reservation[];

  if (currentReservations) {
    const updatedReservations = currentReservations.filter(
      (r) => r.id !== reservationId
    );
    await setAsync({ key: "/api/reservations", value: updatedReservations });
  }

  const userReservations = (await getAsync(
    `/api/reservations/${reservation.user.toString()}`
  )) as Reservation[];

  if (userReservations) {
    const updatedUserReservations = userReservations.filter(
      (r) => r.id !== reservationId
    );
    await setAsync({
      key: `/api/reservations/${reservation.user.toString()}`,
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
  await ReservationModel.findByIdAndDelete(reservationId);

  const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user.toString()}`;

  clearTimeout(timeoutStorage.get(restoreSeatsForUnpaidReservations));
  timeoutStorage.delete(restoreSeatsForUnpaidReservations);

  await setAsync({
    key: `/api/events/${reservation.event}`,
    value: event,
  });

  res.redirect(
    `${process.env.REACT_APP_FRONTEND_URL}/cancel/${reservation._id}?eventId=${reservation.event}`
  );
};

export const downloadPDFReservation = async (
  req: Request & {
    user?: { id: string; username: string; password: string };
    body: {
      reservation: Reservation;
    };
  },
  res: Response
) => {
  try {
    const { reservationId } = req.query;

    const reservation: Reservation | null = await ReservationModel.findById(
      reservationId
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const pdfsFolder = path.join(__dirname, "..", "..", "pdfs");

    fs.readdir(pdfsFolder, (err, files) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Fișierele din folderul "pdfs":`);
        files.forEach((file) => {
          console.log(file);
        });
      }
    });
    const pdfPath = path.join(
      __dirname,
      "..",
      "..",
      "pdfs",
      `${reservation._id}.pdf`
    );
    console.log(pdfPath);
    res.download(pdfPath, `${reservation._id}.pdf`);
  } catch (error) {
    res.status(500).json({ message: "File not found" });
  }
};
