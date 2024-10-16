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
exports.apolloServer = exports.server = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const setupSecurity_1 = require("./src/config/setupSecurity");
const authRoutes_1 = __importDefault(require("./src/routes/authRoutes"));
const eventRoutes_1 = require("./src/routes/eventRoutes");
const reservationRoutes_1 = require("./src/routes/reservationRoutes");
const adminActionsRoutes_1 = __importDefault(require("./src/routes/adminActionsRoutes"));
const errorMiddleware_1 = require("./src/middlewares/errorMiddleware");
const authMiddleware_1 = require("./src/middlewares/authMiddleware");
const apollo_server_express_1 = require("apollo-server-express");
const schema_1 = __importDefault(require("./src/graphql/schema"));
const resolver_1 = __importDefault(require("./src/graphql/resolver"));
const pdfRoutes_1 = __importDefault(require("./src/routes/pdfRoutes"));
const paymentRoutes_1 = require("./src/routes/paymentRoutes");
const http_1 = __importDefault(require("http"));
const ioSocket_1 = require("./src/config/ioSocket");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 5000;
(0, setupSecurity_1.setupSecurity)({ app });
app.use("/api/auth", authRoutes_1.default);
app.use("/api/reservations", reservationRoutes_1.router);
app.use("/api/admin", adminActionsRoutes_1.default);
app.use("/api/events", eventRoutes_1.router);
app.use("/api/payment", paymentRoutes_1.router);
app.use("/api", pdfRoutes_1.default);
app.use(errorMiddleware_1.errorHandler);
const apolloServer = new apollo_server_express_1.ApolloServer({
    typeDefs: schema_1.default,
    resolvers: resolver_1.default,
    context: (_a) => __awaiter(void 0, [_a], void 0, function* ({ req, res }) {
        yield (0, authMiddleware_1.authMiddleware)(req, res, () => { });
        return { user: req === null || req === void 0 ? void 0 : req.user };
    })
});
exports.apolloServer = apolloServer;
const server = http_1.default.createServer(app);
exports.server = server;
(0, ioSocket_1.setupIoSockets)(server);
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Server running on port ${PORT}`);
        yield apolloServer.start();
        apolloServer.applyMiddleware({
            // @ts-ignore
            app,
            path: "/api/graphql"
        });
    }));
}))
    .catch((err) => {
    console.error("Database connection error:", err);
});
//# sourceMappingURL=index.js.map