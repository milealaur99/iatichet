import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { setupSecurity } from "./src/config/setupSecurity";
import authRoutes from "./src/routes/authRoutes";
import { router as eventRoutes } from "./src/routes/eventRoutes";
import { router as reservationRoutes } from "./src/routes/reservationRoutes";
import adminRoutes from "./src/routes/adminActionsRoutes";
import { errorHandler } from "./src/middlewares/errorMiddleware";
import { authMiddleware } from "./src/middlewares/authMiddleware";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./src/graphql/schema";
import resolvers from "./src/graphql/resolver";
import pdfRoutes from "./src/routes/pdfRoutes";
import { router as paymentRoutes } from "./src/routes/paymentRoutes";
import { Server as SocketServer } from "socket.io";
import http from "http";
import { usersViewingEvent } from "./src/utils/redisUtils";
import { setup } from "swagger-ui-express";
import { setupIoSockets } from "./src/config/ioSocket";

dotenv.config();

const app: express.Express = express();
const PORT = process.env.PORT || 5000;

setupSecurity({ app });

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", pdfRoutes);

app.use(errorHandler);
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({
    req,
    res
  }: {
    req: Request & {
      user?: {
        username: string;
        id: string;
        password: string;
        role: string;
      };
    };
    res: Response;
  }) => {
    await authMiddleware(req, res, () => {});
    return { user: req?.user };
  }
});

const server = http.createServer(app);

setupIoSockets(server);

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(async () => {
    console.log("aici ajunge lejer");
    server.listen({ port: PORT, host: "0.0.0.0" }, async () => {
      console.log(`Server running on port ${PORT}`);
      await apolloServer.start();
      apolloServer.applyMiddleware({
        // @ts-ignore
        app,
        path: "/api/graphql"
      });
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

export { app, server, apolloServer };
