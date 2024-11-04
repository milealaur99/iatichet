"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReservationPDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const User_1 = __importDefault(require("../models/User"));
const Event_1 = __importDefault(require("../models/Event"));
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const qr_image_1 = __importDefault(require("qr-image"));
const path_1 = __importDefault(require("path"));
const generateReservationPDF = (reservation, path) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = new pdfkit_1.default({
        size: "A4",
        layout: "portrait",
        margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
        }
    });
    doc.pipe(fs_1.default.createWriteStream(path));
    const user = yield User_1.default.findById(reservation.user);
    if (!user) {
        throw new errorMiddleware_1.AppError("User not found", 404);
    }
    const event = (yield Event_1.default.findById(reservation.event).populate("hall"));
    if (!event) {
        throw new errorMiddleware_1.AppError("Event not found", 404);
    }
    const seatsPerPage = 6;
    const logoImage = fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "..", "assets", "default_transparent_765x625.png"));
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
            align: "center"
        })
            .text(`Hall: ${event.hall.name}`, { align: "center" })
            .moveDown(1);
    };
    const addFooter = () => {
        doc
            .fontSize(10)
            .fillColor("#999999")
            .text("For any questions, please contact the event organizer.", 50, 750, {
            align: "center",
            width: 500
        })
            .moveDown(0.5)
            .fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#444444")
            .text("Thank you for your reservation!", { align: "center", width: 500 })
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#aaaaaa")
            .text(`Page ${doc.bufferedPageRange().count}`, 50, 780, {
            align: "center"
        });
    };
    const addSeats = (seats) => {
        seats.forEach((seat, index) => {
            const qrImage = qr_image_1.default.imageSync(`${reservation._id}-${seat.row}-${seat.number}`, { type: "png" });
            doc
                .moveDown(1)
                .image(qrImage, { width: 80, align: "center" })
                .moveDown(0.5)
                .fontSize(14)
                .font("Helvetica-Bold")
                .fillColor("#333333")
                .text(`Row: ${seat.row}, Seat: ${seat.number}`, {
                align: "center"
            })
                .moveDown(3);
        });
    };
    addHeader();
    addSeats(reservation.seats.slice(0, seatsPerPage));
    addFooter();
    for (let i = seatsPerPage; i < reservation.seats.length; i += seatsPerPage) {
        doc.addPage();
        addHeader();
        addSeats(reservation.seats.slice(i, i + seatsPerPage));
        addFooter();
    }
    doc.end();
});
exports.generateReservationPDF = generateReservationPDF;
//# sourceMappingURL=pdfGenerator.js.map