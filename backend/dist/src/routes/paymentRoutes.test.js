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
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../index");
const Event_1 = __importDefault(require("../models/Event"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Hall_1 = __importDefault(require("../models/Hall"));
const User_1 = __importDefault(require("../models/User"));
const jestMocks_1 = require("../utils/jestMocks");
const fs_1 = __importDefault(require("fs"));
jest.setTimeout(100000);
jest.mock("../utils/redisUtils", () => ({
    getAsync: jest.fn(),
    setAsync: jest.fn(),
    timeoutStorage: new Map()
}));
let mongoData;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoData = yield (0, jestMocks_1.createMongoServer)();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    index_1.server.close();
    yield mongoData.disconnectServer();
    jest.clearAllMocks();
}));
describe("Payment Routes", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield Event_1.default.deleteMany({});
        yield Reservation_1.default.deleteMany({});
        yield Hall_1.default.deleteMany({});
        yield User_1.default.deleteMany({});
    }));
    describe("GET /api/payment/success", () => {
        it("should handle payment success and update reservation as paid", () => __awaiter(void 0, void 0, void 0, function* () {
            const user = new User_1.default({
                username: "testUser",
                email: "test@example.com",
                password: "password123"
            });
            yield user.save();
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: [
                    {
                        row: "A",
                        number: 1,
                        reservationOps: { isReserved: false, reservation: null }
                    }
                ]
            });
            yield hall.save();
            const event = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50,
                seats: []
            });
            yield event.save();
            const reservation = new Reservation_1.default({
                event: event._id,
                user: user._id,
                hall: hall._id,
                date: new Date(),
                price: 50,
                seats: [{ row: "A", number: 1 }],
                eventDate: new Date(),
                isPaid: false
            });
            yield reservation.save();
            yield (0, supertest_1.default)(index_1.app)
                .get(`/api/payment/success?reservationId=${reservation._id}`)
                .expect(302);
            const updatedReservation = yield Reservation_1.default.findById(reservation._id);
            expect(updatedReservation === null || updatedReservation === void 0 ? void 0 : updatedReservation.isPaid).toBe(true);
        }));
    });
    describe("GET /api/payment/cancel", () => {
        it("should handle payment cancellation", () => __awaiter(void 0, void 0, void 0, function* () {
            const user = new User_1.default({
                username: "testUser",
                email: "test@example.com",
                password: "password123"
            });
            yield user.save();
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: [
                    {
                        row: "A",
                        number: 1,
                        reservationOps: { isReserved: false, reservation: null }
                    }
                ]
            });
            yield hall.save();
            const event = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50,
                seats: []
            });
            yield event.save();
            const reservation = new Reservation_1.default({
                event: event._id,
                user: user._id,
                hall: hall._id,
                date: new Date(),
                price: 50,
                seats: [{ row: "A", number: 1 }],
                eventDate: new Date(),
                isPaid: false
            });
            yield reservation.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/payment/cancel?reservationId=${reservation._id}`)
                .expect(302);
            const deletedReservation = yield Reservation_1.default.findById(reservation._id);
            expect(deletedReservation).toBeNull();
        }));
    });
    describe("GET /api/payment/download-reservation", () => {
        it("should download the reservation PDF", () => __awaiter(void 0, void 0, void 0, function* () {
            const user = new User_1.default({
                username: "testUser",
                email: "test@example.com",
                password: "password123"
            });
            yield user.save();
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: [
                    {
                        row: "A",
                        number: 1,
                        reservationOps: { isReserved: false, reservation: null }
                    }
                ]
            });
            yield hall.save();
            const event = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50,
                seats: []
            });
            yield event.save();
            const reservation = new Reservation_1.default({
                event: event._id,
                user: user._id,
                hall: hall._id,
                date: new Date(),
                price: 50,
                seats: [{ row: "A", number: 1 }],
                eventDate: new Date(),
                isPaid: true
            });
            yield reservation.save();
            fs_1.default.writeFileSync(`pdfs/${reservation._id}.pdf`, "This is a test PDF", "utf-8");
            const { csrfToken, cookie } = yield (0, jestMocks_1.getCsrfTokenAndCookie)(index_1.app);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/payment/download-reservation?reservationId=${reservation._id}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.headers["content-disposition"]).toContain("attachment; filename=");
            fs_1.default.unlinkSync(`pdfs/${reservation._id}.pdf`);
        }));
    });
});
//# sourceMappingURL=paymentRoutes.test.js.map