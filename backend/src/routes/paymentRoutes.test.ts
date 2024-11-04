import request from "supertest";
import { app, server } from "../../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import EventModel from "../models/Event";
import ReservationModel from "../models/Reservation";
import HallModel from "../models/Hall";
import UserModel from "../models/User";
import { createMongoServer, getCsrfTokenAndCookie } from "../utils/jestMocks";
import fs from "fs";

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

describe("Payment Routes", () => {
  beforeEach(async () => {
    await EventModel.deleteMany({});
    await ReservationModel.deleteMany({});
    await HallModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  describe("GET /api/payment/success", () => {
    it("should handle payment success and update reservation as paid", async () => {
      const user = new UserModel({
        username: "testUser",
        email: "test@example.com",
        password: "password123"
      });
      await user.save();

      const hall = new HallModel({
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

      const event = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50,
        seats: []
      });
      await event.save();

      const reservation = new ReservationModel({
        event: event._id,
        user: user._id,
        hall: hall._id,
        date: new Date(),
        price: 50,
        seats: [{ row: "A", number: 1 }],
        eventDate: new Date(),
        isPaid: false
      });
      await reservation.save();

      await request(app)
        .get(`/api/payment/success?reservationId=${reservation._id}`)
        .expect(302);

      const updatedReservation = await ReservationModel.findById(
        reservation._id
      );
      expect(updatedReservation?.isPaid).toBe(true);
    });
  });

  describe("GET /api/payment/cancel", () => {
    it("should handle payment cancellation", async () => {
      const user = new UserModel({
        username: "testUser",
        email: "test@example.com",
        password: "password123"
      });
      await user.save();

      const hall = new HallModel({
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

      const event = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50,
        seats: []
      });
      await event.save();

      const reservation = new ReservationModel({
        event: event._id,
        user: user._id,
        hall: hall._id,
        date: new Date(),
        price: 50,
        seats: [{ row: "A", number: 1 }],
        eventDate: new Date(),
        isPaid: false
      });
      await reservation.save();

      const response = await request(app)
        .get(`/api/payment/cancel?reservationId=${reservation._id}`)
        .expect(302);

      const deletedReservation = await ReservationModel.findById(
        reservation._id
      );
      expect(deletedReservation).toBeNull();
    });
  });

  describe("GET /api/payment/download-reservation", () => {
    it("should download the reservation PDF", async () => {
      const user = new UserModel({
        username: "testUser",
        email: "test@example.com",
        password: "password123"
      });
      await user.save();

      const hall = new HallModel({
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

      const event = new EventModel({
        name: "Music Concert",
        description: "A great concert",
        date: new Date(),
        hall: hall._id,
        tichetPrice: 50,
        seats: []
      });
      await event.save();

      const reservation = new ReservationModel({
        event: event._id,
        user: user._id,
        hall: hall._id,
        date: new Date(),
        price: 50,
        seats: [{ row: "A", number: 1 }],
        eventDate: new Date(),
        isPaid: true
      });
      await reservation.save();

      fs.writeFileSync(
        `pdfs/${reservation._id}.pdf`,
        "This is a test PDF",
        "utf-8"
      );

      const { csrfToken, cookie } = await getCsrfTokenAndCookie(app);

      const response = await request(app)
        .get(
          `/api/payment/download-reservation?reservationId=${reservation._id}`
        )
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.headers["content-disposition"]).toContain(
        "attachment; filename="
      );

      fs.unlinkSync(`pdfs/${reservation._id}.pdf`);
    });
  });
});
