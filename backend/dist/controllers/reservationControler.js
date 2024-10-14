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
exports.cancelPendingReservations = exports.getUserReservations = exports.deleteReservation = exports.getReservationById = exports.getAllReservations = exports.createReservation = void 0;
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Hall_1 = __importDefault(require("../models/Hall"));
const Event_1 = __importDefault(require("../models/Event"));
const redisUtils_1 = require("../utils/redisUtils");
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const lodash_1 = require("lodash");
const createReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (redisUtils_1.timeoutStorage.get(`restoreSeatsForUnpaidReservations-${(_a = req.user) === null || _a === void 0 ? void 0 : _a.id}`)) {
            return res.status(400).json({
                message: "You have an unpaid reservation in progress"
            });
        }
        if (!req.body.seats || req.body.seats.length === 0) {
            return res.status(400).json({ message: "No seats selected" });
        }
        if (req.body.seats.length > 5) {
            return res.status(400).json({ message: "Max 5 seats per reservation" });
        }
        const { eventId, seats } = req.body;
        let eventModel = (yield Event_1.default.findById(eventId));
        const currentDate = new Date();
        console.log(eventModel);
        if (!eventModel) {
            return res.status(400).json({ message: "Invalid event" });
        }
        if (currentDate > new Date(eventModel === null || eventModel === void 0 ? void 0 : eventModel.date)) {
            return res.status(400).json({ message: "Event has already passed" });
        }
        if (!eventModel || !eventModel.seats) {
            return res.status(404).json({ message: "Event not found" });
        }
        const unavailableSeats = seats.filter((seat) => {
            const hallSeat = eventModel.seats.find((hallSeat) => hallSeat.row === seat.row && hallSeat.number === seat.number);
            return hallSeat === null || hallSeat === void 0 ? void 0 : hallSeat.reservationOps.isReserved;
        });
        if (unavailableSeats.length > 0) {
            return res.status(400).json({
                message: "Some seats are already reserved",
                unavailableSeats
            });
        }
        console.log(eventModel.seats, "eventModel.seats", seats, "seats");
        const hall = yield Hall_1.default.findById(eventModel.hall);
        if (!hall) {
            return next(new errorMiddleware_1.AppError("Hall not found", 404));
        }
        const reservation = new Reservation_1.default({
            user: (_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.id,
            event: eventModel._id,
            hall: hall._id,
            seats,
            date: new Date(),
            price: seats.length * eventModel.tichetPrice * 100,
            eventDate: eventModel.date
        });
        eventModel.seats = [
            ...eventModel.seats,
            ...seats.map((seat) => (Object.assign(Object.assign({}, seat), { reservationOps: Object.assign(Object.assign({}, seat.reservationOps), { isReserved: true, reservation: reservation._id }) })))
        ];
        yield eventModel.save();
        yield reservation.save();
        const restoreSeatsForUnpaidReservations = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            const eventModel = (yield Event_1.default.findById(eventId));
            const reservationModel = yield Reservation_1.default.findById(reservation._id);
            if (!eventModel || !reservationModel) {
                return;
            }
            console.log("a ajuns in timeout");
            const reservationWasPaid = reservationModel.isPaid &&
                seats.every((seat) => eventModel.seats.find((hallSeat) => hallSeat.row === seat.row &&
                    hallSeat.number === seat.number &&
                    hallSeat.reservationOps.isReserved &&
                    hallSeat.reservationOps.reservation ===
                        reservationModel.id.toString()) !== undefined);
            console.log(reservationWasPaid, "reservationWasPaid");
            if (!reservationWasPaid) {
                eventModel.seats = eventModel.seats.filter((hallSeat) => {
                    return !seats.some((seat) => {
                        return hallSeat.row === seat.row && hallSeat.number === seat.number;
                    });
                });
                yield eventModel.save();
                yield Reservation_1.default.findByIdAndDelete(reservation._id);
            }
            redisUtils_1.timeoutStorage.delete(`restoreSeatsForUnpaidReservations-${reservation.user}`);
        }), 30000);
        redisUtils_1.timeoutStorage.set(`restoreSeatsForUnpaidReservations-${reservation.user}`, restoreSeatsForUnpaidReservations);
        res.status(201).json({
            message: "Draft of reservation created successfully",
            reservation
        });
    }
    catch (error) {
        console.log(error);
        next(new errorMiddleware_1.AppError("Error creating reservation", 400));
    }
});
exports.createReservation = createReservation;
const getAllReservations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const page = req.query.page ? +req.query.page : 1;
        const skip = (page - 1) * 10;
        let currentReservations = (yield (0, redisUtils_1.getAsync)("/api/reservations"));
        if (!currentReservations) {
            currentReservations = yield Reservation_1.default.find({ user: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id }).sort({
                date: 1
            });
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: currentReservations
            });
        }
        const reservations = currentReservations;
        const filteredReservations = reservations.slice(skip, skip + 10);
        const totalPages = Math.ceil(reservations.length / 10);
        return res.status(200).json({
            reservations: filteredReservations,
            totalPages,
            page
        });
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error fetching reservations", 400));
    }
});
exports.getAllReservations = getAllReservations;
const getReservationById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reservation = yield Reservation_1.default.findById(req.params.id)
            .populate("user")
            .populate("hall", "name");
        console.log(reservation, "reservation");
        // if (reservation?.user !== req.user?.id || req.user?.role !== "admin") {
        //   return res.status(403).json({ message: "Forbidden access" });
        // }
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.status(200).json(reservation);
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error fetching reservation", 400));
    }
});
exports.getReservationById = getReservationById;
const deleteReservation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const reservation = yield Reservation_1.default.findById(req.params.id);
        const isAdmin = ((_d = req.user) === null || _d === void 0 ? void 0 : _d.role) === "admin";
        if (!isAdmin && (reservation === null || reservation === void 0 ? void 0 : reservation.user) !== ((_e = req.user) === null || _e === void 0 ? void 0 : _e.id)) {
            return res.status(403).json({ message: "Forbidden access" });
        }
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        const eventModel = yield Event_1.default.findById(reservation.event);
        if (!eventModel) {
            return res.status(404).json({ message: "Event not found" });
        }
        for (const seat of reservation.seats) {
            const hallSeat = eventModel.seats.find((s) => s.row === seat.row && s.number === seat.number);
            if (hallSeat) {
                hallSeat.reservationOps = {
                    isReserved: false,
                    reservation: null
                };
            }
        }
        yield eventModel.save();
        yield Reservation_1.default.findByIdAndDelete(req.params.id);
        const currentReservations = (yield (0, redisUtils_1.getAsync)("/api/reservations"));
        if (currentReservations) {
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: currentReservations === null || currentReservations === void 0 ? void 0 : currentReservations.filter((reservation) => reservation._id !== req.params.id)
            });
        }
        else {
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: yield Reservation_1.default.find()
            });
        }
        const userReservations = (yield (0, redisUtils_1.getAsync)(`/api/reservations/user/${reservation.user}`));
        if (userReservations) {
            yield (0, redisUtils_1.setAsync)({
                key: `/api/reservations/user/${reservation.user}`,
                value: userReservations === null || userReservations === void 0 ? void 0 : userReservations.filter((reservation) => reservation._id !== req.params.id)
            });
        }
        else {
            yield (0, redisUtils_1.setAsync)({
                key: `/api/reservations/user/${reservation.user}`,
                value: yield Reservation_1.default.find({ user: reservation.user })
            });
        }
        res.status(200).json({ message: "Reservation deleted successfully" });
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error deleting reservation", 400));
    }
});
exports.deleteReservation = deleteReservation;
const getUserReservations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    try {
        const isCurrentUser = ((_f = req.user) === null || _f === void 0 ? void 0 : _f.id) === req.params.userId;
        const isAdmin = ((_g = req.user) === null || _g === void 0 ? void 0 : _g.role) === "admin";
        if (!isCurrentUser && !isAdmin) {
            return res.status(403).json({ message: "Forbidden access" });
        }
        const page = req.query.page ? +req.query.page : 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const reservations = (yield Reservation_1.default.find({
            user: req.params.userId || ((_h = req.user) === null || _h === void 0 ? void 0 : _h.id)
        })
            .populate("event")
            .populate("hall")
            .sort({
            date: -1
        }));
        if (!reservations) {
            return res.status(404).json({ message: "Reservations not found" });
        }
        const totalPages = Math.ceil(reservations.length / limit);
        const filteredReservations = reservations
            .slice(skip, skip + limit)
            .map((reservation) => (0, lodash_1.omit)(Object.assign({ eventName: reservation.event.name, eventId: reservation.event._id, hall: reservation.hall }, reservation.toObject()), ["event", "hall"]));
        res.status(200).json({
            reservations: filteredReservations,
            totalPages,
            page
        });
    }
    catch (error) {
        console.log(error);
        next(new errorMiddleware_1.AppError("Error fetching reservations", 400));
    }
});
exports.getUserReservations = getUserReservations;
const cancelPendingReservations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l;
    try {
        const reservation = (yield Reservation_1.default.findById(req.params.id));
        if (!reservation) {
            return res.status(404).json({ message: "Reservations not found" });
        }
        if (reservation.user.toString() !== ((_j = req.user) === null || _j === void 0 ? void 0 : _j.id) ||
            ((_k = req.user) === null || _k === void 0 ? void 0 : _k.role) !== "admin") {
            return res.status(403).json({ message: "Forbidden access" });
        }
        const restoreSeatsForUnpaidReservations = `restoreSeatsForUnpaidReservations-${reservation.user}`;
        clearTimeout(redisUtils_1.timeoutStorage.get(restoreSeatsForUnpaidReservations));
        redisUtils_1.timeoutStorage.delete(restoreSeatsForUnpaidReservations);
        const eventModel = yield Event_1.default.findById(reservation.event);
        if (!eventModel) {
            return res.status(404).json({ message: "Event not found" });
        }
        eventModel.seats = eventModel.seats.filter((hallSeat) => {
            return !reservation.seats.some((seat) => {
                return hallSeat.row === seat.row && hallSeat.number === seat.number;
            });
        });
        yield Reservation_1.default.findByIdAndDelete(req.params.id);
        yield eventModel.save();
        let currentReservations = (yield (0, redisUtils_1.getAsync)("/api/reservations"));
        if (!currentReservations) {
            currentReservations = yield Reservation_1.default.find({ user: (_l = req.user) === null || _l === void 0 ? void 0 : _l.id }).sort({ date: -1 });
            yield (0, redisUtils_1.setAsync)({
                key: "/api/reservations",
                value: currentReservations.filter((reservation) => reservation._id !== req.params.id)
            });
        }
        return res.status(200).json({ message: "Reservations canceled" });
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error canceling reservations", 400));
    }
});
exports.cancelPendingReservations = cancelPendingReservations;
//# sourceMappingURL=reservationControler.js.map