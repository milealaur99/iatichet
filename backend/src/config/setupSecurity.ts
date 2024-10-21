import express from "express";
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

const RATE_LIMIT_TIME = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 100000;
const LIMITER_MESSAGE =
  "Too many requests from this IP, please try again later.";
const csrfProtection = csrf({
  cookie: true,
});

const setupCSRF = ({ app }: { app: express.Express }) => {
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

export const setupSecurity = ({ app }: { app: express.Express }) => {
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.REACT_APP_BACKEND_URL,
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      optionsSuccessStatus: 200,
    })
  );
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
    windowMs: RATE_LIMIT_TIME,
    max: MAX_REQUESTS_PER_IP,
    message: LIMITER_MESSAGE,
  });
  app.use(limiter);

  Sentry.setupExpressErrorHandler(app);

  app.use(
    session({
      secret: process.env.COOKIE_KEY as string,
      resave: false,
      saveUninitialized: false,
    })
  );

  Hall.initializeHalls();
  swagger(app);
  initSetry();

  setupCSRF({ app });
};
