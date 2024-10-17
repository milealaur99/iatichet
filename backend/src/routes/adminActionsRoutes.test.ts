import request from "supertest";
import { app, server } from "../../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User";
import { createMongoServer, createUserAndLogin } from "../utils/jestMocks";

jest.setTimeout(100000);
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
let csrfToken: string;
let cookie: string;

beforeAll(async () => {
  mongoData = await createMongoServer();
});

afterAll(async () => {
  server.close();
  await mongoData.disconnectServer();
  jest.clearAllMocks();
});

describe("Admin Routes", () => {
  let adminToken: string;

  beforeEach(async () => {
    const admin = await createUserAndLogin({
      username: "adminUser",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
      app
    });
    adminToken = admin.token;
    csrfToken = admin.csrfToken;
    cookie = admin.cookie;
  });

  describe("GET /api/admin/users", () => {
    it("should return a list of users if admin", async () => {
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it("should return 403 if not an admin", async () => {
      const user = await createUserAndLogin({
        username: "normalUser",
        email: "user@example.com",
        password: "password123",
        role: "user",
        app
      });
      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${user.token}`)
        .set("XSRF-TOKEN", user.csrfToken)
        .set("Cookie", user.cookie)
        .expect(403);

      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    it("should change the role of a user", async () => {
      const { user } = await createUserAndLogin({
        username: "userToChange",
        email: "userchange@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .put(`/api/admin/users/${user._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ role: "admin" })
        .expect(200);

      expect(response.body.message).toBe("Role changed successfully");
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.role).toBe("admin");
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("should delete a user", async () => {
      const { user } = await createUserAndLogin({
        username: "userToDelete",
        email: "delete@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .delete(`/api/admin/users/${user._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.message).toBe("User deleted successfully");
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe("GET /api/admin/find-users/:username", () => {
    it("should find users by username", async () => {
      const { user } = await createUserAndLogin({
        username: "searchedUser",
        email: "search@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .get(`/api/admin/find-users/${user.username}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0].username).toBe("searchedUser");
    });

    it("should return 404 if no users found", async () => {
      const response = await request(app)
        .get("/api/admin/find-users/nonexistent")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(404);

      expect(response.body.message).toBe("Users not found");
    });
  });
});
