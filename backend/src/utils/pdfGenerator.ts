import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Reservation } from "../models/Reservation";
import { Seat } from "../models/Hall";
import qr from "qr-image";

export const generateReservationPDF = async (
  reservation: Reservation,
  finalPath: string
): Promise<void> => {
  try {
    // Directorul temporar în Docker
    const tempPath = path.join("/tmp", `${reservation._id}.pdf`);

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

    // Creăm stream-ul de fișier pentru directorul temporar
    const tempFileStream = fs.createWriteStream(tempPath);
    tempFileStream.on("open", () => {
      doc
        .pipe(tempFileStream)
        .on("finish", async () => {
          console.log("PDF generated successfully in temp:", tempPath);

          // Copiem fișierul PDF în directorul final din Docker
          fs.copyFile(tempPath, finalPath, (err) => {
            if (err) {
              console.error("Error copying PDF to final path:", err);
            } else {
              console.log("PDF successfully copied to final path:", finalPath);
            }
          });
        })
        .on("error", (err) => {
          console.error("Error generating PDF:", err);
        });

      // Generăm conținutul PDF-ului
      const addHeader = () => {
        doc
          .fillColor("#333333")
          .fontSize(26)
          .font("Helvetica-Bold")
          .text("Event Reservation", { align: "center" })
          .moveDown();
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

      // Adăugăm conținut în PDF
      addHeader();
      addSeats(reservation.seats);

      doc.end(); // Finalizăm PDF-ul
    });

    tempFileStream.on("error", (err) => {
      console.error("Error opening file stream:", err);
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};
