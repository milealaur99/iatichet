import fs from "fs";
import PDFDocument from "pdfkit";
import { Reservation } from "../models/Reservation";
import User from "../models/User";
import EventModel, { Event as EventType } from "../models/Event";
import { AppError } from "../middlewares/errorMiddleware";
import qr from "qr-image";
import { Seat } from "../models/Hall";
import pathFunction from "path";

export const generateReservationPDF = async (
  reservation: Reservation,
  path: string
): Promise<void> => {
  try {
    const doc = new PDFDocument({
      size: "A4",
      layout: "portrait",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Ensure file creation
    const fileStream = fs.createWriteStream(path);
    fileStream.on("open", () => {
      doc
        .pipe(fileStream)
        .on("finish", () => {
          console.log("PDF generated successfully:", path);
        })
        .on("error", (err: Error) => {
          console.error("Error generating PDF:", err);
        });

      const addHeader = () => {
        doc
          .fillColor("#333333")
          .fontSize(26)
          .font("Helvetica-Bold")
          .text("Event Reservation", { align: "center" })
          .moveDown();
      };

      const addFooter = () => {
        doc
          .fontSize(10)
          .fillColor("#999999")
          .text(
            "For any questions, please contact the event organizer.",
            50,
            750,
            {
              align: "center",
              width: 500,
            }
          )
          .moveDown(0.5)
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor("#444444")
          .text("Thank you for your reservation!", {
            align: "center",
            width: 500,
          })
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#aaaaaa")
          .text(`Page ${doc.bufferedPageRange().count}`, 50, 780, {
            align: "center",
          });
      };

      const addSeats = (seats: Seat[]) => {
        seats.forEach((seat) => {
          const qrImage = qr.imageSync(
            `${reservation._id}-${seat.row}-${seat.number}`,
            { type: "png" }
          );
          doc
            .image(qrImage, { width: 80, align: "center" })
            .moveDown(0.5)
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#333333")
            .text(`Row: ${seat.row}, Seat: ${seat.number}`, { align: "center" })
            .moveDown(3);
        });
      };

      addHeader();
      addSeats(reservation.seats.slice(0, 6));
      addFooter();

      for (let i = 6; i < reservation.seats.length; i += 6) {
        doc.addPage();
        addHeader();
        addSeats(reservation.seats.slice(i, i + 6));
        addFooter();
      }

      doc.end();
      console.log("PDF generation completed:", path);
    });

    fileStream.on("error", (err: Error) => {
      console.error("Error opening file stream:", err);
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
