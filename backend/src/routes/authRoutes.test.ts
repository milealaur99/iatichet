import request from "supertest";
import { app, server } from "../../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserModel from "../models/User";
import {
  createMongoServer,
  createUserAndLogin,
  getCsrfTokenAndCookie
} from "../utils/jestMocks";
import bcrypt from "bcryptjs";

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

describe("Auth Routes", () => {
  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const { user, token, csrfToken, cookie } = await createUserAndLogin({
        username: "userInfoUser",
        email: "userInfo@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .post("/api/auth/login")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ username: "userInfoUser", password: "password123" })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty(
        "userId",
        (user._id as unknown as string).toString()
      );
    });

    it("should return 401 with incorrect credentials", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "userInfoUser",
        email: "userInfo@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .post("/api/auth/login")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ username: "wronguser", password: "wrongpassword" })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/signup", () => {
    it("should signup successfully with valid data", async () => {
      const { cookie, csrfToken } = await getCsrfTokenAndCookie(app);
      const response = await request(app)
        .post("/api/auth/signup")
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({
          username: "newuser",
          email: "newuser@example.com",
          password: "password123",
          confirmPassword: "password123"
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      const user = await UserModel.findOne({ username: "newuser" });
      expect(user).not.toBeNull();
    });

    it("should return 409 if username or email already exists", async () => {
      const existingUser = new UserModel({
        username: "existinguser",
        email: "existing@example.com",
        password: await bcrypt.hash("password123", 12)
      });
      await existingUser.save();
      const { cookie, csrfToken } = await getCsrfTokenAndCookie(app);

      const response = await request(app)
        .post("/api/auth/signup")
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({
          username: "existinguser",
          email: "newemail@example.com",
          password: "password123",
          confirmPassword: "password123"
        })
        .expect(409);

      expect(response.body.message).toBe("Username already exists");

      const emailConflictResponse = await request(app)
        .post("/api/auth/signup")
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({
          username: "newuser",
          email: "existing@example.com",
          password: "password123",
          confirmPassword: "password123"
        })
        .expect(409);

      expect(emailConflictResponse.body.message).toBe("Email already exists");
    });
  });

  describe("GET /api/auth/user-info/:id?", () => {
    it("should return user info for authenticated user", async () => {
      const { user, token, csrfToken, cookie } = await createUserAndLogin({
        username: "userInfoUser",
        email: "userInfo@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .get(`/api/auth/user-info/${user._id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.username).toBe("userInfoUser");
      expect(response.body.email).toBe("userInfo@example.com");
    });

    it("should return 404 if user not found", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "dummyUser",
        email: "dummy@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .get("/api/auth/user-info/424242424242424242424242")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should reset password successfully", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "resetUser",
        email: "reset@example.com",
        password: "oldpassword",
        role: "user",
        app
      });

      const response = await request(app)
        .post("/api/auth/reset-password")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ password: "newpassword", confirmPassword: "newpassword" })
        .expect(200);

      expect(response.body.message).toBe("Password changed successfully");
    });

    it("should return 401 if passwords do not match", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "resetUser",
        email: "reset@example.com",
        password: "oldpassword",
        role: "user",
        app
      });

      const response = await request(app)
        .post("/api/auth/reset-password")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ password: "newpassword", confirmPassword: "wrongpassword" })
        .expect(401);

      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const { token, csrfToken, cookie } = await createUserAndLogin({
        username: "logoutUser",
        email: "logout@example.com",
        password: "password123",
        role: "user",
        app
      });

      const response = await request(app)
        .get("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .expect(200);

      expect(response.body.message).toBe("Logged out successfully");
    });
  });
});
