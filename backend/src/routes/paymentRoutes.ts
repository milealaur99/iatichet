import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

import {
  createCheckoutSession,
  success,
  cancel,
  downloadPDFReservation,
} from "../controllers/paymentController";

const router = Router();

router.post("/create-checkout-session", createCheckoutSession);

router.get("/success", success);

router.get("/cancel", cancel);

router.get('/download-reservation',downloadPDFReservation );

export  {router};
