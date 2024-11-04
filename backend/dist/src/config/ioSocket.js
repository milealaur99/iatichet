"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIoSockets = void 0;
const socket_io_1 = require("socket.io");
const redisUtils_1 = require("../../src/utils/redisUtils");
const setupIoSockets = (server) => {
    const io = new socket_io_1.Server(server, {
        transports: ["websocket"],
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        socket.on("joinEvent", (eventId) => {
            if (!redisUtils_1.usersViewingEvent.has(eventId)) {
                redisUtils_1.usersViewingEvent.set(eventId, 0);
            }
            redisUtils_1.usersViewingEvent.set(eventId, redisUtils_1.usersViewingEvent.get(eventId) + 1);
            socket.join(eventId);
            io.to(eventId).emit("viewersUpdate", redisUtils_1.usersViewingEvent.get(eventId));
            socket.on("disconnect", () => {
                redisUtils_1.usersViewingEvent.set(eventId, redisUtils_1.usersViewingEvent.get(eventId) - 1);
                io.to(eventId).emit("viewersUpdate", redisUtils_1.usersViewingEvent.get(eventId));
            });
        });
    });
};
exports.setupIoSockets = setupIoSockets;
//# sourceMappingURL=ioSocket.js.map