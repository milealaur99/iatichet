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
describe("Admin Routes", () => {
    let adminToken;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const admin = yield (0, jestMocks_1.createUserAndLogin)({
            username: "adminUser",
            email: "admin@example.com",
            password: "password123",
            role: "admin",
            app: index_1.app
        });
        adminToken = admin.token;
        csrfToken = admin.csrfToken;
        cookie = admin.cookie;
    }));
    describe("GET /api/admin/users", () => {
        it("should return a list of users if admin", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body).toBeInstanceOf(Array);
        }));
        it("should return 403 if not an admin", () => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield (0, jestMocks_1.createUserAndLogin)({
                username: "normalUser",
                email: "user@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${user.token}`)
                .set("XSRF-TOKEN", user.csrfToken)
                .set("Cookie", user.cookie)
                .expect(403);
            expect(response.body.message).toBe("Unauthorized");
        }));
    });
    describe("PUT /api/admin/users/:id", () => {
        it("should change the role of a user", () => __awaiter(void 0, void 0, void 0, function* () {
            const { user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "userToChange",
                email: "userchange@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${user._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .send({ role: "admin" })
                .expect(200);
            expect(response.body.message).toBe("Role changed successfully");
            const updatedUser = yield User_1.default.findById(user._id);
            expect(updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.role).toBe("admin");
        }));
    });
    describe("DELETE /api/admin/users/:id", () => {
        it("should delete a user", () => __awaiter(void 0, void 0, void 0, function* () {
            const { user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "userToDelete",
                email: "delete@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete(`/api/admin/users/${user._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body.message).toBe("User deleted successfully");
            const deletedUser = yield User_1.default.findById(user._id);
            expect(deletedUser).toBeNull();
        }));
    });
    describe("GET /api/admin/find-users/:username", () => {
        it("should find users by username", () => __awaiter(void 0, void 0, void 0, function* () {
            const { user } = yield (0, jestMocks_1.createUserAndLogin)({
                username: "searchedUser",
                email: "search@example.com",
                password: "password123",
                role: "user",
                app: index_1.app
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/admin/find-users/${user.username}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body[0].username).toBe("searchedUser");
        }));
        it("should return 404 if no users found", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .get("/api/admin/find-users/nonexistent")
                .set("Authorization", `Bearer ${adminToken}`)
                .set("XSRF-TOKEN", csrfToken)
                .set("Cookie", cookie)
                .expect(404);
            expect(response.body.message).toBe("Users not found");
        }));
    });
});
//# sourceMappingURL=adminActionsRoutes.test.js.map