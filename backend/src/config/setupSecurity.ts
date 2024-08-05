import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import session from "express-session";
import path from "path";
import { CANCELLED } from "dns";

const RATE_LIMIT_TIME = 15 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 100;
const LIMITER_MESSAGE =
  "Too many requests from this IP, please try again later.";

const setupCSRF = ({ app }: { app: express.Express }) => {
  app.use(csrf());
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });

  app.get("api/v1/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
};

export const setupSecurity = ({ app }: { app: express.Express }) => {
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "..", "uploads"))
  );
  console.log(
    path.join(__dirname, "..", "..", "uploads"),
    "aici e problema",
    __dirname,
    process.cwd()
  );

  const limiter = rateLimit({
    windowMs: RATE_LIMIT_TIME,
    max: MAX_REQUESTS_PER_IP,
    message: LIMITER_MESSAGE,
  });
  app.use(limiter);

  app.use(
    session({
      secret: process.env.COOKIE_KEY as string,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
    })
  );

  // setupCSRF({ app });
};
