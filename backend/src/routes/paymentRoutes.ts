import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

import {
  createCheckoutSession,
  success,
  cancel,
} from "../controllers/paymentController";

const router = Router();

router.post("/create-checkout-session", authMiddleware, createCheckoutSession);

router.get("/success", authMiddleware, success);

router.get("/cancel", authMiddleware, cancel);

export default router;
