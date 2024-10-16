"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const csurf_1 = __importDefault(require("csurf"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const response_time_1 = __importDefault(require("response-time"));
const Sentry = __importStar(require("@sentry/node"));
const swagger_1 = require("../../src/config/swagger");
const sentry_1 = require("../../src/config/sentry");
const Hall_1 = __importDefault(require("../models/Hall"));
const RATE_LIMIT_TIME = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 100000;
const LIMITER_MESSAGE = "Too many requests from this IP, please try again later.";
const csrfProtection = (0, csurf_1.default)({ cookie: true });
const setupCSRF = ({ app }) => {
    app.use(csrfProtection);
    app.use((req, res, next) => {
        res.locals.csrfToken = req.csrfToken();
        next();
    });
    app.get("/api/csrf-token", (req, res) => {
        res.cookie("XSRF-TOKEN", req.csrfToken());
        res.json({ csrfToken: req.csrfToken() });
    });
};
const setupSecurity = ({ app }) => {
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: "http://localhost:3000",
        credentials: true
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "..", "uploads")));
    app.use((0, cookie_parser_1.default)());
    app.use((0, response_time_1.default)((req, res, time) => {
        console.log(`${req.method} ${req.url} took ${time}ms`);
    }));
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: RATE_LIMIT_TIME,
        max: MAX_REQUESTS_PER_IP,
        message: LIMITER_MESSAGE
    });
    app.use(limiter);
    Sentry.setupExpressErrorHandler(app);
    app.use((0, express_session_1.default)({
        secret: process.env.COOKIE_KEY,
        resave: false,
        saveUninitialized: false
    }));
    Hall_1.default.initializeHalls();
    (0, swagger_1.swagger)(app);
    (0, sentry_1.initSetry)();
    setupCSRF({ app });
};
exports.setupSecurity = setupSecurity;
//# sourceMappingURL=setupSecurity.js.map