import PDFDocument from "pdfkit";
import fs from "fs";
import { Reservation } from "../models/Reservation";
import User from "../models/User";
import EventModel from "../models/Event";
import { AppError } from "../middlewares/errorMiddleware";
import qr from "qr-image";
import { buffer } from "node:stream/consumers";

export const generateReservationPDF = async (
  reservation: Reservation,
  path: string
) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
  });

  doc.pipe(fs.createWriteStream(path));

  const user = await User.findById(reservation.user);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const event = await EventModel.findById(reservation.event);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const seatsPerPage = 4;
  let pageIndex = 1;

  for (let i = 0; i < reservation.seats.length; i += seatsPerPage) {
    const seats = reservation.seats.slice(i, i + seatsPerPage);

    doc.addPage();

    doc
      .fontSize(20)
      .fillColor("#0077cc")
      .text(`Seat(s) - Page ${pageIndex}`, { align: "center" });

    doc.moveDown(2);

    for (const seat of seats) {
      const qrImage = await buffer(
        qr.image(`${reservation.id}-${seat.row}-${seat.number}`, {
          type: "png",
        })
      );
      doc.addPage().image(qrImage, { width: 100, align: "center" });

      doc.fontSize(16).text(`Row: ${seat.row}, Seat: ${seat.number}`, {
        align: "center",
      });

      doc.moveDown(1.5);
    }

    pageIndex++;
  }

  doc
    .fontSize(10)
    .text("For any questions, please contact the event organizer.", {
      align: "center",
    });

  doc.end();
};
