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
exports.createUserAndLogin = exports.getCsrfTokenAndCookie = exports.createMongoServer = void 0;
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
let mongoServer;
const createMongoServer = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoServer) {
        mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
    }
    const uri = mongoServer.getUri();
    if (mongoose_1.default.connection.readyState !== 0) {
        yield mongoose_1.default.disconnect();
    }
    yield mongoose_1.default.connect(uri, {});
    mongoose_1.default.connection.on("connected", () => {
        console.log("Database connected");
    });
    mongoose_1.default.connection.on("error", (err) => {
        console.error("Connection error:", err);
    });
    const disconnectServer = () => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.dropDatabase();
        yield mongoose_1.default.connection.close();
        yield mongoServer.stop();
    });
    return { mongoServer, disconnectServer };
});
exports.createMongoServer = createMongoServer;
const getCsrfTokenAndCookie = (app) => __awaiter(void 0, void 0, void 0, function* () {
    const csrfResponse = yield (0, supertest_1.default)(app).get("/api/csrf-token");
    const csrfToken = csrfResponse.body.csrfToken;
    const cookie = csrfResponse.headers["set-cookie"];
    return { csrfToken, cookie };
});
exports.getCsrfTokenAndCookie = getCsrfTokenAndCookie;
const createUserAndLogin = (_a) => __awaiter(void 0, [_a], void 0, function* ({ username, email, password, role, app }) {
    yield User_1.default.deleteMany({ email });
    const user = new User_1.default({
        username,
        email,
        password: yield bcryptjs_1.default.hash(password, 12),
        role
    });
    yield user.save();
    const { csrfToken, cookie } = yield (0, exports.getCsrfTokenAndCookie)(app);
    const loginResponse = yield (0, supertest_1.default)(app)
        .post("/api/auth/login")
        .set("XSRF-TOKEN", csrfToken)
        .set("Cookie", cookie)
        .send({ username, password });
    const token = loginResponse.body.token;
    return { token, csrfToken, cookie, user };
});
exports.createUserAndLogin = createUserAndLogin;
//# sourceMappingURL=jestMocks.js.map