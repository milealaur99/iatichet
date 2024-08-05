import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { setupSecurity } from "./src/config/setupSecurity";
import authRoutes from "./src/routes/authRoutes";
import eventRoutes from "./src/routes/eventRoutes";
import reservationRoutes from "./src/routes/reservationRoutes";
import adminRoutes from "./src/routes/adminActionsRoutes";
import { errorHandler } from "./src/middlewares/errorMiddleware";
import Hall from "./src/models/Hall";
import { authMiddleware } from "./src/middlewares/authMiddleware";
import { ApolloServer } from "apollo-server-express";
import typeDefs from "./src/graphql/schema";
import resolvers from "./src/graphql/resolver";
import pdfRoutes from "./src/routes/pdfRoutes";

dotenv.config();

const app: express.Express = express();
const PORT = process.env.PORT || 5000;

setupSecurity({ app });

app.use("/api/auth", authRoutes);
app.use("/api/reservations", authMiddleware, reservationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", pdfRoutes);

app.use(errorHandler);
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({
    req,
    res,
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
  },
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    app.listen(PORT, async () => {
      await apolloServer.start();
      apolloServer.applyMiddleware({
        // @ts-ignore
        app,
        path: "/api/graphql",
      });
      await Hall.initializeHalls();
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
