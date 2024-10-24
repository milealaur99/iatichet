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
exports.deleteEvent = exports.getEventById = exports.getAllEvents = exports.createEvent = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const Hall_1 = __importDefault(require("../models/Hall"));
const errorMiddleware_1 = require("../middlewares/errorMiddleware");
const uploadImageMiddleware_1 = require("../middlewares/uploadImageMiddleware");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    (0, uploadImageMiddleware_1.upload)(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return next(new errorMiddleware_1.AppError(err.message, 400));
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file selected!" });
        }
        try {
            const { name, description, date, hall, tichetPrice } = req.body;
            const hallModel = yield Hall_1.default.findOne({ name: hall });
            if (!hallModel) {
                return res.status(404).json({ message: "Hall not found" });
            }
            const eventAlreadyExists = yield Event_1.default.findOne({ name });
            if (eventAlreadyExists) {
                return res
                    .status(409)
                    .json({ message: "The name of the event already exists" });
            }
            const child = (0, child_process_1.fork)(path_1.default.join(__dirname, "..", "..", "src", "utils", "imageProcessor.js"));
            child.send(req.file.path);
            child.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
                const { processedPath } = message;
                const event = new Event_1.default({
                    name,
                    description,
                    date,
                    tichetPrice,
                    hall: hallModel._id,
                    seats: [],
                    poster: processedPath
                });
                yield event.save();
                res.status(201).json({
                    message: "Event created successfully",
                    event: Object.assign(Object.assign({}, event.toObject()), { hall: hallModel.name })
                });
            }));
            child.on("error", (error) => {
                next(new errorMiddleware_1.AppError("Error processing image", 500));
            });
        }
        catch (error) {
            next(new errorMiddleware_1.AppError("Error creating event", 400));
        }
    }));
});
exports.createEvent = createEvent;
const getAllEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { price, date, hall, seatsPercentage, search } = req.query;
        const page = req.query.page ? +req.query.page : 1;
        const skip = (page - 1) * 10;
        const [startDate, endDate] = (date || "").split("|");
        const parsedStartDate = startDate
            ? new Date(+startDate).getTime()
            : new Date().setHours(0, 0, 0, 0);
        const parsedEndDate = endDate ? new Date(+endDate).getTime() : undefined;
        const hallId = hall ? (_a = (yield Hall_1.default.findOne({ name: hall }))) === null || _a === void 0 ? void 0 : _a._id : null;
        const query = Object.assign(Object.assign(Object.assign(Object.assign({}, (startDate && endDate
            ? {
                date: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            }
            : { date: { $gte: new Date().setHours(0, 0, 0, 0) } })), (price ? { tichetPrice: { $lte: Number(price) } } : {})), (search ? { name: { $regex: new RegExp(search, "i") } } : {})), (hall ? { hall: hallId } : {}));
        let currentEvents = yield Event_1.default.find(query).populate("hall").exec();
        if (seatsPercentage !== undefined) {
            currentEvents = currentEvents.filter((event) => __awaiter(void 0, void 0, void 0, function* () {
                const totalSeats = event.seats.length;
                const eventHall = yield Hall_1.default.find(event.hall);
                const hallSeats = eventHall[0].seats;
                const availableSeats = hallSeats.filter((seat) => !seat.reservationOps.isReserved).length;
                const calculatedSeatsPercentage = (availableSeats / totalSeats) * 100;
                return calculatedSeatsPercentage >= seatsPercentage;
            }));
        }
        const totalEvents = currentEvents.length;
        currentEvents = currentEvents.slice(skip, skip + 10);
        const eventsWithHall = currentEvents.map((event) => {
            var _a;
            return (Object.assign(Object.assign({}, event.toObject()), { hall: ((_a = event.hall) === null || _a === void 0 ? void 0 : _a.name) || "" }));
        });
        if (eventsWithHall.length === 0) {
            return res.status(200).json({
                events: [],
                totalPages: 0,
                page: 1
            });
        }
        const totalPages = Math.ceil(totalEvents / 10);
        return res.status(200).json({
            events: eventsWithHall,
            totalPages,
            page
        });
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error fetching events", 400));
    }
});
exports.getAllEvents = getAllEvents;
const getEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const eventModel = yield Event_1.default.findById(req.params.id).populate("hall");
        if (!eventModel) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json(Object.assign(Object.assign({}, eventModel.toObject()), { hall: ((_b = eventModel.hall) === null || _b === void 0 ? void 0 : _b.name) || "" }));
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error fetching event", 400));
    }
});
exports.getEventById = getEventById;
const deleteEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield Event_1.default.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json({ message: "Event deleted successfully" });
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error deleting event", 400));
    }
});
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventController.js.map