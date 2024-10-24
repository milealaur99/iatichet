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
const User_1 = __importDefault(require("../models/User"));
const jestMocks_1 = require("../utils/jestMocks");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
let mongoData;
let csrfToken;
let cookie;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoData = yield (0, jestMocks_1.createMongoServer)();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    index_1.server.close();
    yield mongoData.disconnectServer();
    jest.clearAllMocks();
}));
describe("Auth Routes", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield User_1.default.deleteMany({});
    }));
    describe("POST /api/auth/login", () => {
        it("should login successfully with correct credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            const { user, token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "userInfoUser",
                email: "userInfo@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/auth/login")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ username: "userInfoUser", password: "password123" })
                .expect(200);
            expect(response.body).toHaveProperty("token");
            expect(response.body).toHaveProperty("userId", user._id.toString());
        }));
        it("should return 401 with incorrect credentials", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "userInfoUser",
                email: "userInfo@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/auth/login")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ username: "wronguser", password: "wrongpassword" })
                .expect(401);
            expect(response.body.message).toBe("Invalid credentials");
        }));
    });
    describe("POST /api/auth/signup", () => {
        it("should signup successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
            const { cookie, csrfToken } = yield (0, jestMocks_1.getCsrfTokenAndCookie)(index_1.app);
            const response = yield (0, supertest_1.default)(index_1.app)
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
            const user = yield User_1.default.findOne({ username: "newuser" });
            expect(user).not.toBeNull();
        }));
        it("should return 409 if username or email already exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const existingUser = new User_1.default({
                username: "existinguser",
                email: "existing@example.com",
                password: yield bcryptjs_1.default.hash("password123", 12)
            });
            yield existingUser.save();
            const { cookie, csrfToken } = yield (0, jestMocks_1.getCsrfTokenAndCookie)(index_1.app);
            const response = yield (0, supertest_1.default)(index_1.app)
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
            const emailConflictResponse = yield (0, supertest_1.default)(index_1.app)
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
        }));
    });
    describe("GET /api/auth/user-info/:id?", () => {
        it("should return user info for authenticated user", () => __awaiter(void 0, void 0, void 0, function* () {
            const { user, token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "userInfoUser",
                email: "userInfo@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/auth/user-info/${user._id}`)
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.username).toBe("userInfoUser");
            expect(response.body.email).toBe("userInfo@example.com");
        }));
        it("should return 404 if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "dummyUser",
                email: "dummy@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/auth/user-info/424242424242424242424242")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(404);
            expect(response.body.message).toBe("User not found");
        }));
    });
    describe("POST /api/auth/reset-password", () => {
        it("should reset password successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "resetUser",
                email: "reset@example.com",
                password: "oldpassword",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/auth/reset-password")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ password: "newpassword", confirmPassword: "newpassword" })
                .expect(200);
            expect(response.body.message).toBe("Password changed successfully");
        }));
        it("should return 401 if passwords do not match", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "resetUser",
                email: "reset@example.com",
                password: "oldpassword",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/auth/reset-password")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ password: "newpassword", confirmPassword: "wrongpassword" })
                .expect(401);
            expect(response.body.message).toBe("Invalid credentials");
        }));
    });
    describe("GET /api/auth/logout", () => {
        it("should logout successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const { token, csrfToken, cookie } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "logoutUser",
                email: "logout@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/auth/logout")
                .set("Authorization", `Bearer ${token}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.message).toBe("Logged out successfully");
        }));
    });
});
//# sourceMappingURL=authRoutes.test.js.map