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
exports.downloadPDFReservation = exports.cancel = exports.success = exports.createCheckoutSession = void 0;
const path_1 = __importDefault(require("path"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Event_1 = __importDefault(require("../models/Event"));
const pdfGenerator_1 = require("../utils/pdfGenerator");
const redisUtils_1 = require("../utils/redisUtils");
const stripe_1 = __importDefault(require("stripe"));
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reservation } = req.body;
        const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        if (!stripe) {
            return res.status(500).json({ message: "Stripe not initialized" });
        }
        const successUrl = `${req.protocol}://${req.get("host")}/api/payment/success?reservationId=${reservation._id}`;
        const cancelUrl = `${req.protocol}://${req.get("host")}/api/payment/cancel?reservationId=${reservation._id}`;
        const event = yield Event_1.default.findById(reservation.event);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        const session = yield stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "RON",
                        product_data: {
                            name: event.name
                        },
                        unit_amount: event.tichetPrice * 100
                    },
                    quantity: reservation.seats.length
                }
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            expires_at: Math.floor(Date.now() / 1000) + 1800
        });
        const reservationModel = yield Reservation_1.default.findById(reservation._id);
        if (!reservationModel || !session.url) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        reservationModel.paymentLink = session.url;
        yield reservationModel.save();
        res.json({ id: session.id, url: session.url });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createCheckoutSession = createCheckoutSession;
const success = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reservationId } = req.query;
        const reservation = yield Reservation_1.default.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        const pdfPath = path_1.default.join(__dirname, "..", "..", "pdfs", `${reservation._id.toString()}.pdf`);
        const eventModel = yield Event_1.default.findById(reservation.event);
        const seats = reservation.seats;
        if (!eventModel || !seats) {
            return res.status(404).json({ message: "Event not found" });
        }
        for (const seat of seats) {
            const hallSeat = {
                reservationOps: {
                    isReserved: true,
                    reservation: reservation._id.toString()
                },
                row: seat.row,
                number: seat.number,
                reservation: reservation._id.toString()
            };
            eventModel.seats.push(hallSeat);
        }
        reservation.isPaid = true;
        yield eventModel.save();
        yield reservation.save();
        const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user.toString()}`;
        clearTimeout(redisUtils_1.timeoutStorage.get(restoreSeatsForUnpaidReservations));
        redisUtils_1.timeoutStorage.delete(restoreSeatsForUnpaidReservations);
        const currentReservations = (yield (0, redisUtils_1.getAsync)("/api/reservations"));
        if (currentReservations) {
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: [...currentReservations, reservation]
            });
        }
        else {
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: yield Reservation_1.default.find()
            });
        }
        const userReservations = (yield (0, redisUtils_1.getAsync)(`/api/reservations/${reservation.user.toString()}`));
        if (userReservations) {
            yield (0, redisUtils_1.setAsync)({
                key: `/api/reservations/${reservation.user.toString()}`,
                value: [...userReservations, reservation]
            });
        }
        else {
            yield (0, redisUtils_1.setAsync)({
                key: `/api/reservations/${reservation.user.toString()}`,
                value: yield Reservation_1.default.find({
                    user: reservation.user.toString()
                })
            });
        }
        const currentEvent = (yield (0, redisUtils_1.getAsync)(`/api/events/${reservation.event.toString()}`));
        yield (0, redisUtils_1.setAsync)({
            key: `/api/events/${reservation.event.toString()}`,
            value: Object.assign(Object.assign({}, currentEvent), { seats: eventModel.seats })
        });
        yield (0, pdfGenerator_1.generateReservationPDF)(reservation, pdfPath);
        res.redirect(`http://localhost:3000/success/${reservation._id}?eventId=${reservation.event}`);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.success = success;
const cancel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reservationId } = req.query;
    const reservation = yield Reservation_1.default.findById(reservationId);
    if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
    }
    const currentReservations = (yield (0, redisUtils_1.getAsync)("/api/reservations"));
    if (currentReservations) {
        const updatedReservations = currentReservations.filter((r) => r.id !== reservationId);
        yield (0, redisUtils_1.setAsync)({ key: "/api/reservations", value: updatedReservations });
    }
    const userReservations = (yield (0, redisUtils_1.getAsync)(`/api/reservations/${reservation.user.toString()}`));
    if (userReservations) {
        const updatedUserReservations = userReservations.filter((r) => r.id !== reservationId);
        yield (0, redisUtils_1.setAsync)({
            key: `/api/reservations/${reservation.user.toString()}`,
            value: updatedUserReservations
        });
    }
    const event = yield Event_1.default.findById(reservation.event);
    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }
    for (const seat of reservation.seats) {
        const hallSeat = event.seats.find((s) => s.row === seat.row && s.number === seat.number);
        if (hallSeat) {
            hallSeat.reservationOps = {
                isReserved: false,
                reservation: ""
            };
        }
    }
    yield event.save();
    yield Reservation_1.default.findByIdAndDelete(reservationId);
    const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user.toString()}`;
    clearTimeout(redisUtils_1.timeoutStorage.get(restoreSeatsForUnpaidReservations));
    redisUtils_1.timeoutStorage.delete(restoreSeatsForUnpaidReservations);
    yield (0, redisUtils_1.setAsync)({
        key: `/api/events/${reservation.event}`,
        value: event
    });
    res.redirect(`http://localhost:3000/cancel/${reservation._id}?eventId=${reservation.event}`);
});
exports.cancel = cancel;
const downloadPDFReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reservationId } = req.query;
        const reservation = yield Reservation_1.default.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        const pdfPath = path_1.default.join(__dirname, "..", "..", "pdfs", `${reservation._id}.pdf`);
        res.download(pdfPath, `${reservation._id}.pdf`);
    }
    catch (error) {
        res.status(500).json({ message: "File not found" });
    }
});
exports.downloadPDFReservation = downloadPDFReservation;
//# sourceMappingURL=paymentController.js.map