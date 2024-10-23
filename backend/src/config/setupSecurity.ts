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

// CSRF middleware
const csrfProtection = csrf({
  cookie: true,
});

// Function to decide if CSRF setup should be called
const setupCSRF = (
  { app }: { app: express.Express },
  isNgrokRequest: boolean
) => {
  // Don't apply CSRF if it's an Ngrok request
  if (!isNgrokRequest) {
    app.use(csrfProtection);

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.csrfToken = req.csrfToken();
      next();
    });

    app.get("/api/csrf-token", (req: Request, res: Response) => {
      res.cookie("XSRF-TOKEN", req.csrfToken(), {
        httpOnly: false, // Allow client-side JS to read the cookie
        secure: true, // HTTPS
        sameSite: "none", // Cross-site cookies allowed
      });
      res.json({ csrfToken: req.csrfToken() });
    });
  }
};

export const setupSecurity = ({ app }: { app: express.Express }) => {
  app.use(helmet());
  app.use(
    cors({
      origin: "https://iatichet-frontend.onrender.com",
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
        secure: true, // HTTPS only
        httpOnly: true, // JS can't access the cookie
        sameSite: "none", // Cross-site cookies allowed
      },
    })
  );

  Hall.initializeHalls();
  swagger(app);
  initSetry();

  // Detect if the request comes from Ngrok
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isNgrokRequest = Boolean(
      req.get("origin")?.includes("ngrok.io") ||
        req.get("referer")?.includes("ngrok.io")
    );

    // Conditionally call setupCSRF
    setupCSRF({ app }, isNgrokRequest);
    next();
  });
};
