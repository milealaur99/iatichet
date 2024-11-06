import PDFDocument from "pdfkit";
import fs from "fs";
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
) => {
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
    console.log(path);
    doc.pipe(
      fs
        .createWriteStream(path)
        .on("finish", () => {
          console.log("PDF generated successfully:", path);
        })
        .on("error", (err) => {
          console.error("Error generating PDF:", err);
        })
    );
    const user = await User.findById(reservation.user);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    console.log(user);
    const event = (await EventModel.findById(reservation.event).populate(
      "hall"
    )) as EventType & { hall: { name: string } };
    console.log(event);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    const seatsPerPage = 6;
    const logoImage = fs.readFileSync(
      pathFunction.join(
        __dirname,
        "..",
        "..",
        "assets",
        "default_transparent_765x625.png"
      )
    );
    const addHeader = () => {
      doc
        .fillColor("#333333")
        .fontSize(26)
        .font("Helvetica-Bold")
        .image(logoImage, { align: "center", width: 150 })
        .moveDown(0.5)
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#555555")
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" })
        .moveDown(1.5)
        .fontSize(20)
        .fillColor("#0077cc")
        .text(event.name, { align: "center" })
        .moveDown(0.5)
        .fontSize(14)
        .fillColor("#666666")
        .text(`Date: ${new Date(event.date).toLocaleDateString()}`, {
          align: "center",
        })
        .text(`Hall: ${event.hall.name}`, { align: "center" })
        .moveDown(1);
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
      seats.forEach((seat, index) => {
        const qrImage = qr.imageSync(
          `${reservation._id}-${seat.row}-${seat.number}`,
          { type: "png" }
        );

        doc
          .moveDown(1)
          .image(qrImage, { width: 80, align: "center" })
          .moveDown(0.5)
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#333333")
          .text(`Row: ${seat.row}, Seat: ${seat.number}`, {
            align: "center",
          })
          .moveDown(3);
      });
    };

    addHeader();
    addSeats(reservation.seats.slice(0, seatsPerPage));
    addFooter();

    for (
      let i = seatsPerPage;
      i < reservation.seats.length;
      i += seatsPerPage
    ) {
      doc.addPage();
      addHeader();
      addSeats(reservation.seats.slice(i, i + seatsPerPage));
      addFooter();
    }

    doc.end();
    console.log("PDF generation completed:", path);
  } catch (error) {
    console.error(error);
  }
};
