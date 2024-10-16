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
const Reservation_1 = __importDefault(require("../models/Reservation"));
const Event_1 = __importDefault(require("../models/Event"));
const Hall_1 = __importDefault(require("../models/Hall"));
const User_1 = __importDefault(require("../models/User"));
const jestMocks_1 = require("../utils/jestMocks");
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
describe("Reservation Routes", () => {
    let user, hall, event;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield Reservation_1.default.deleteMany({});
        yield Event_1.default.deleteMany({});
        yield Hall_1.default.deleteMany({});
        yield User_1.default.deleteMany({});
        user = new User_1.default({
            username: "testUser",
            email: "test@example.com",
            password: "password123"
        });
        yield user.save();
        hall = new Hall_1.default({
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
        event = new Event_1.default({
            name: "Music Concert",
            description: "A great concert",
            date: new Date(new Date().setDate(new Date().getDate() + 1)),
            hall: hall._id,
            tichetPrice: 50,
            seats: []
        });
        yield event.save();
    }));
    describe("POST /api/reservations/create", () => {
        it("should create a reservation successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie, user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/reservations/create")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ eventId: event._id, seats: [{ row: "A", number: 1 }] })
                .expect(201);
            expect(response.body.message).toBe("Draft of reservation created successfully");
            expect(response.body.reservation).toHaveProperty("user", user._id.toString());
        }));
        it("should return 400 for unavailable seats", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie, user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            event.seats = [
                {
                    row: "A",
                    number: 1,
                    reservationOps: { isReserved: true, reservation: null }
                }
            ];
            yield event.save();
            const reservation = new Reservation_1.default({
                user: user._id,
                event: event._id,
                hall: hall._id,
                seats: [{ row: "A", number: 1 }],
                date: new Date(),
                price: 50,
                eventDate: new Date(),
                isPaid: true
            });
            yield reservation.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/reservations/create")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ eventId: event._id, seats: [{ row: "A", number: 1 }] })
                .expect(400);
            expect(response.body.message).toBe("Some seats are already reserved");
        }));
    });
    describe("GET /api/reservations", () => {
        it("should return a list of reservations", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie, user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "admin",
                app: index_1.app
            });
            const reservation = new Reservation_1.default({
                user: user._id,
                event: event._id,
                hall: hall._id,
                seats: [{ row: "A", number: 1 }],
                date: new Date(),
                price: 50,
                eventDate: new Date(),
                isPaid: true
            });
            yield reservation.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/reservations")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.reservations).toHaveLength(1);
        }));
    });
    describe("GET /api/reservations/:id", () => {
        it("should return a reservation by ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const reservation = new Reservation_1.default({
                user: user._id,
                event: event._id,
                hall: hall._id,
                seats: [{ row: "A", number: 1 }],
                date: new Date(),
                price: 50,
                eventDate: new Date(),
                isPaid: true
            });
            yield reservation.save();
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/reservations/${reservation._id}`)
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body._id).toBe(reservation._id.toString());
        }));
    });
    describe("DELETE /api/reservations/:id", () => {
        it("should delete a reservation successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie, user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const reservation = new Reservation_1.default({
                user: user._id,
                event: event._id,
                hall: hall._id,
                seats: [{ row: "A", number: 1 }],
                date: new Date(),
                price: 50,
                eventDate: new Date(),
                isPaid: true
            });
            yield reservation.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete(`/api/reservations/${reservation._id}`)
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.message).toBe("Reservation deleted successfully");
        }));
    });
    describe("PUT /api/reservations/cancel/:id", () => {
        it("should cancel a pending reservation", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie, user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "testUser",
                email: "test@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const reservation = new Reservation_1.default({
                user: user._id,
                event: event._id,
                hall: hall._id,
                seats: [{ row: "A", number: 1 }],
                date: new Date(),
                price: 50,
                eventDate: new Date(),
                isPaid: false
            });
            yield reservation.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .put(`/api/reservations/cancel/${reservation._id}`)
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.message).toBe("Reservations canceled");
        }));
    });
});
//# sourceMappingURL=reservationRoutes.test.js.map