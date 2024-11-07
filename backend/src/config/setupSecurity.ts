import express, { NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import session from "express-session";
import path from "path";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import responseTime from "response-time";
import * as Sentry from "@sentry/node";
import { swagger } from "../../src/config/swagger";
import { initSetry } from "../../src/config/sentry";
import Hall from "../models/Hall";

const csrfProtection = csrf({
  cookie: true,
});

const setupCSRF = (
  { app }: { app: express.Express },
  isNgrokRequest: boolean
) => {
  if (!isNgrokRequest) {
    app.use(csrfProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.csrfToken = req.csrfToken();
      next();
    });

    app.get("/api/csrf-token", (req: Request, res: Response) => {
      res.cookie("XSRF-TOKEN", req.csrfToken(), {
        httpOnly: false,
        secure: true,
        sameSite: "none",
      });
      res.json({ csrfToken: req.csrfToken() });
    });
  }
};

export const setupSecurity = ({ app }: { app: express.Express }) => {
  app.use(helmet());
  app.use(
    cors({
      origin: [
        "https://iatichet-frontend.onrender.com",
        "http://localhost:3000",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "ngrok-skip-browser-warning",
        "*",
      ],
    })
  );

  app.options("*", cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "..", "uploads"))
  );
  app.use(cookieParser());

  app.use(
    responseTime((req: Request, res: Response, time: number) => {
      console.log(`${req.method} ${req.url} took ${time}ms`);
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100000,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use(limiter);

  Sentry.setupExpressErrorHandler(app);

  app.use(
    session({
      secret: process.env.COOKIE_KEY as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: "none",
      },
    })
  );

  Hall.initializeHalls();
  swagger(app);
  initSetry();

  //
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isNgrokRequest = Boolean(
      req.get("origin")?.includes("ngrok.io") ||
        req.get("referer")?.includes("ngrok.io")
    );

    setupCSRF({ app }, isNgrokRequest);
    next();
  });
};
