import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Express } from "express";
import User, { User as UserType } from "../models/User";
import bcrypt from "bcryptjs";

let mongoServer: MongoMemoryServer;

export const createMongoServer = async () => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }

  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, {});

  mongoose.connection.on("connected", () => {
    console.log("Database connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("Connection error:", err);
  });

  const disconnectServer = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  };

  return { mongoServer, disconnectServer };
};

export const getCsrfTokenAndCookie = async (app: Express) => {
  const csrfResponse = await request(app).get("/api/csrf-token");
  const csrfToken = csrfResponse.body.csrfToken;
  const cookie = csrfResponse.headers["set-cookie"];
  return { csrfToken, cookie };
};

export const createUserAndLogin = async ({
  username,
  email,
  password,
  role,
  app
}: {
  username: string;
  email: string;
  password: string;
  role: string;
  app: Express;
}): Promise<{
  user: UserType;
  token: string;
  csrfToken: string;
  cookie: string;
}> => {
  await User.deleteMany({ email });

  const user = new User({
    username,
    email,
    password: await bcrypt.hash(password, 12),
    role
  });
  await user.save();

  const { csrfToken, cookie } = await getCsrfTokenAndCookie(app);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .set("XSRF-TOKEN", csrfToken)
    .set("Cookie", cookie)
    .send({ username, password });

  const token = loginResponse.body.token;
  return { token, csrfToken, cookie, user };
};
