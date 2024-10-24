import request from "supertest";
import { app, server } from "../../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import ReservationModel from "../models/Reservation";
import EventModel from "../models/Event";
import HallModel from "../models/Hall";
import UserModel from "../models/User";
import { createMongoServer, createUserAndLogin } from "../utils/jestMocks";

jest.setTimeout(100000);

jest.mock("../utils/redisUtils", () => ({
  getAsync: jest.fn(),
  setAsync: jest.fn(),
  timeoutStorage: new Map()
}));

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

describe("Reservation Routes", () => {
  let user: any, hall: any, event: any;

  beforeEach(async () => {
    await ReservationModel.deleteMany({});
    await EventModel.deleteMany({});
    await HallModel.deleteMany({});
    await UserModel.deleteMany({});

    user = new UserModel({
      username: "testUser",
      email: "test@example.com",
      password: "password123"
    });
    await user.save();

    hall = new HallModel({
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
    await hall.save();

    event = new EventModel({
      name: "Music Concert",
      description: "A great concert",
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      hall: hall._id,
      tichetPrice: 50,
      seats: []
    });
    await event.save();
  });

  describe("POST /api/reservations/create", () => {
    it("should create a reservation successfully", async () => {
      const { token, csrfToken, cookie, user } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .post("/api/reservations/create")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ eventId: event._id, seats: [{ row: "A", number: 1 }] })
        .expect(201);

      expect(response.body.message).toBe(
        "Draft of reservation created successfully"
      );
      expect(response.body.reservation).toHaveProperty(
        "user",
        (user._id as any as string).toString()
      );
    });

    it("should return 400 for unavailable seats", async () => {
      const { token, csrfToken, cookie, user } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "user",
        app
      });

      event.seats = [
        {
          row: "A",
          number: 1,
          reservationOps: { isReserved: true, reservation: null }
        }
      ];
      await event.save();

      const reservation = new ReservationModel({
        user: user._id,
        event: event._id,
        hall: hall._id,
        seats: [{ row: "A", number: 1 }],
        date: new Date(),
        price: 50,
        eventDate: new Date(),
        isPaid: true
      });
      await reservation.save();

      const response = await request(app)
        .post("/api/reservations/create")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ eventId: event._id, seats: [{ row: "A", number: 1 }] })
        .expect(400);

      expect(response.body.message).toBe("Some seats are already reserved");
    });
  });

  describe("GET /api/reservations", () => {
    it("should return a list of reservations", async () => {
      const { token, csrfToken, cookie, user } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "admin",
        app
      });

      const reservation = new ReservationModel({
        user: user._id,
        event: event._id,
        hall: hall._id,
        seats: [{ row: "A", number: 1 }],
        date: new Date(),
        price: 50,
        eventDate: new Date(),
        isPaid: true
      });
      await reservation.save();

      const response = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.reservations).toHaveLength(1);
    });
  });

  describe("GET /api/reservations/:id", () => {
    it("should return a reservation by ID", async () => {
      const reservation = new ReservationModel({
        user: user._id,
        event: event._id,
        hall: hall._id,
        seats: [{ row: "A", number: 1 }],
        date: new Date(),
        price: 50,
        eventDate: new Date(),
        isPaid: true
      });
      await reservation.save();

      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .get(`/api/reservations/${reservation._id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body._id).toBe(
        (reservation._id as any as string).toString()
      );
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("should delete a reservation successfully", async () => {
      const { token, csrfToken, cookie, user } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "user",
        app
      });

      const reservation = new ReservationModel({
        user: user._id,
        event: event._id,
        hall: hall._id,
        seats: [{ row: "A", number: 1 }],
        date: new Date(),
        price: 50,
        eventDate: new Date(),
        isPaid: true
      });
      await reservation.save();
      const response = await request(app)
        .delete(`/api/reservations/${reservation._id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.message).toBe("Reservation deleted successfully");
    });
  });

  describe("PUT /api/reservations/cancel/:id", () => {
    it("should cancel a pending reservation", async () => {
      const { token, csrfToken, cookie, user } = await createUserAndLogin({
        username: "testUser",
        email: "test@example.com",
        password: "password123",
        role: "user",
        app
      });
      const reservation = new ReservationModel({
        user: user._id,
        event: event._id,
        hall: hall._id,
        seats: [{ row: "A", number: 1 }],
        date: new Date(),
        price: 50,
        eventDate: new Date(),
        isPaid: false
      });
      await reservation.save();

      const response = await request(app)
        .put(`/api/reservations/cancel/${reservation._id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.message).toBe("Reservations canceled");
    });
  });
});
