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
const Hall_1 = __importDefault(require("../models/Hall"));
const jestMocks_1 = require("../utils/jestMocks");
const path_1 = __importDefault(require("path"));
jest.setTimeout(1000000000);
const filePath = path_1.default.join(__dirname, "..", "..", "assets", "default_transparent_765x625.png");
jest.mock("../config/redis", () => {
    const actualRedis = jest.requireActual("redis-mock");
    const client = actualRedis.createClient();
    client.connect = jest.fn();
    return {
        client
    };
});
jest.mock("../utils/redisUtils", () => {
    const timeoutStorage = new Map();
    const usersViewingEvent = new Map();
    return {
        timeoutStorage,
        usersViewingEvent,
        getAsync: jest.fn((key) => Promise.resolve(null)),
        setAsync: jest.fn((key, value) => Promise.resolve("OK"))
    };
});
let mongoData;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoData = yield (0, jestMocks_1.createMongoServer)();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    index_1.server.close();
    yield mongoData.disconnectServer();
    jest.clearAllMocks();
}));
describe("Event Routes", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield Event_1.default.deleteMany({});
        yield Hall_1.default.deleteMany({});
    }));
    const createSeats = (numSeats) => {
        return Array.from({ length: numSeats }, (_, i) => ({
            row: String.fromCharCode(65 + Math.floor(i / 10)),
            number: (i % 10) + 1,
            reservationOps: { isReserved: false, reservation: null }
        }));
    };
    describe("POST /api/events/create", () => {
        it("should create an event successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: createSeats(200)
            });
            yield hall.save();
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "adminUser",
                email: "admin@example.com",
                password: "password123",
                role: "admin",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/events/create")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .field("name", "Music Concert")
                .field("description", "A great concert")
                .field("date", new Date().toISOString())
                .field("hall", hall.name)
                .field("tichetPrice", "50")
                .attach("poster", filePath)
                .expect(201);
            expect(response.body.message).toBe("Event created successfully");
            expect(response.body.event).toHaveProperty("name", "Music Concert");
        }));
        it("should return 409 if event with the same name already exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: createSeats(200)
            });
            yield hall.save();
            const existingEvent = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50
            });
            yield existingEvent.save();
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "adminUser",
                email: "admin@example.com",
                password: "password123",
                role: "admin",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/events/create")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .field("name", "Music Concert")
                .field("description", "A different concert")
                .field("date", new Date().toISOString())
                .field("hall", hall.name)
                .field("tichetPrice", "50")
                .attach("poster", filePath)
                .expect(409);
            expect(response.body.message).toBe("The name of the event already exists");
        }));
    });
    describe("GET /api/events", () => {
        it("should return a list of events", () => __awaiter(void 0, void 0, void 0, function* () {
            const { csrfToken, cookie } = yield (0, jestMocks_1.getCsrfTokenAndCookie)(index_1.app);
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: createSeats(200)
            });
            yield hall.save();
            const event1 = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50
            });
            yield event1.save();
            const event2 = new Event_1.default({
                name: "Art Exhibition",
                description: "A fine art display",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 30
            });
            yield event2.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/events/")
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.events).toHaveLength(2);
            expect(response.body.events[0]).toHaveProperty("name", "Music Concert");
            expect(response.body.events[1]).toHaveProperty("name", "Art Exhibition");
        }));
    });
    describe("GET /api/events/:id", () => {
        it("should return event details by id", () => __awaiter(void 0, void 0, void 0, function* () {
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: createSeats(200)
            });
            yield hall.save();
            const event = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50
            });
            yield event.save();
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/events/${event._id}`)
                .expect(200);
            expect(response.body).toHaveProperty("name", "Music Concert");
            expect(response.body).toHaveProperty("description", "A great concert");
        }));
        it("should return 404 if event not found", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/events/424242424242424242424242")
                .expect(404);
            expect(response.body.message).toBe("Event not found");
        }));
    });
    describe("DELETE /api/events/:id", () => {
        it("should delete an event successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const hall = new Hall_1.default({
                name: "Main Hall",
                type: "large",
                seats: createSeats(200)
            });
            yield hall.save();
            const event = new Event_1.default({
                name: "Music Concert",
                description: "A great concert",
                date: new Date(),
                hall: hall._id,
                tichetPrice: 50
            });
            yield event.save();
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "adminUser",
                email: "admin@example.com",
                password: "password123",
                role: "admin",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete(`/api/events/${event._id}`)
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.message).toBe("Event deleted successfully");
            const deletedEvent = yield Event_1.default.findById(event._id);
            expect(deletedEvent).toBeNull();
        }));
        it("should return 404 if event not found", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "adminUser",
                email: "admin@example.com",
                password: "password123",
                role: "admin",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete("/api/events/424242424242424242424242")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(404);
            expect(response.body.message).toBe("Event not found");
        }));
    });
});
//# sourceMappingURL=eventRoutes.test.js.map