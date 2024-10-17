import { Server as SocketServer } from "socket.io";
import { usersViewingEvent } from "../../src/utils/redisUtils";
import http from "http";

export const setupIoSockets = (server: http.Server) => {
  const io = new SocketServer(server, {
    transports: ["websocket"],
    cors: {
      origin: process.env.REACT_APP_BACKEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinEvent", (eventId) => {
      if (!usersViewingEvent.has(eventId)) {
        usersViewingEvent.set(eventId, 0);
      }

      usersViewingEvent.set(eventId, usersViewingEvent.get(eventId) + 1);

      socket.join(eventId);

      io.to(eventId).emit("viewersUpdate", usersViewingEvent.get(eventId));

      socket.on("disconnect", () => {
        usersViewingEvent.set(eventId, usersViewingEvent.get(eventId) - 1);

        io.to(eventId).emit("viewersUpdate", usersViewingEvent.get(eventId));
      });
    });
  });
};
