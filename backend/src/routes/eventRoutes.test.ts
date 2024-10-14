import request from "supertest";
import { app, server } from "../../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import EventModel from "../models/Event";
import HallModel from "../models/Hall";
import {
  createMongoServer,
  createUserAndLogin,
  getCsrfTokenAndCookie
} from "../utils/jestMocks";
import path from "path";

jest.setTimeout(1000000000);

const filePath = path.join(
  __dirname,
  "..",
  "..",
  "assets",
  "default_transparent_765x625.png"
);

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

let mongoData: {
  mongoServer: MongoMemoryServer;
  disconnectServer: () => Promise<void>;
};

beforeAll(async () => {
  mongoData = await createMongoServer();
});

afterAll(async () => {
  server.close();
  await mongoData.disconnectServer();
  jest.clearAllMocks();
});

describe("Event Routes", () => {
  beforeEach(async () => {
    await EventModel.deleteMany({});
    await HallModel.deleteMany({});
  });

  const createSeats = (numSeats: number) => {
    return Array.from({ length: numSeats }, (_, i) => ({
      row: String.fromCharCode(65 + Math.floor(i / 10)),
      number: (i % 10) + 1,
      reservationOps: { isReserved: false, reservation: null }
    }));
  };

  describe("POST /api/events/create", () => {
    it("should create an event successfully with valid data", async () => {
      const hall = new HallModel({
        name: "Main Hall",
        type: "large",
        seats: createSeats(200)
      });
      await hall.save();

      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "adminUser",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        app
      });

      const response = await request(app)
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
    });

    it("should return 409 if event with the same name already exists", async () => {
      const hall = new HallModel({
        name: "Main Hall",
        type: "large",
        seats: createSeats(200)
      });
      await hall.save();

      const existingEvent = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50
      });
      await existingEvent.save();

      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "adminUser",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        app
      });

      const response = await request(app)
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

      expect(response.body.message).toBe(
        "The name of the event already exists"
      );
    });
  });

  describe("GET /api/events", () => {
    it("should return a list of events", async () => {
      const { csrfToken, cookie } = await getCsrfTokenAndCookie(app);

      const hall = new HallModel({
        name: "Main Hall",
        type: "large",
        seats: createSeats(200)
      });
      await hall.save();

      const event1 = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50
      });
      await event1.save();

      const event2 = new EventModel({
        name: "Art Exhibition",
        description: "A fine art display",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 30
      });
      await event2.save();

      const response = await request(app)
        .get("/api/events/")
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.events).toHaveLength(2);
      expect(response.body.events[0]).toHaveProperty("name", "Music Concert");
      expect(response.body.events[1]).toHaveProperty("name", "Art Exhibition");
    });
  });

  describe("GET /api/events/:id", () => {
    it("should return event details by id", async () => {
      const hall = new HallModel({
        name: "Main Hall",
        type: "large",
        seats: createSeats(200)
      });
      await hall.save();

      const event = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50
      });
      await event.save();

      const response = await request(app)
        .get(`/api/events/${event._id}`)
        .expect(200);

      expect(response.body).toHaveProperty("name", "Music Concert");
      expect(response.body).toHaveProperty("description", "A great concert");
    });

    it("should return 404 if event not found", async () => {
      const response = await request(app)
        .get("/api/events/424242424242424242424242")
        .expect(404);

      expect(response.body.message).toBe("Event not found");
    });
  });

  describe("DELETE /api/events/:id", () => {
    it("should delete an event successfully", async () => {
      const hall = new HallModel({
        name: "Main Hall",
        type: "large",
        seats: createSeats(200)
      });
      await hall.save();

      const event = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50
      });
      await event.save();

      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "adminUser",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        app
      });

      const response = await request(app)
        .delete(`/api/events/${event._id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.message).toBe("Event deleted successfully");

      const deletedEvent = await EventModel.findById(event._id);
      expect(deletedEvent).toBeNull();
    });

    it("should return 404 if event not found", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "adminUser",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        app
      });

      const response = await request(app)
        .delete("/api/events/424242424242424242424242")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(404);

      expect(response.body.message).toBe("Event not found");
    });
  });
});
