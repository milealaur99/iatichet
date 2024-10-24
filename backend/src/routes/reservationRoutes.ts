import { Router } from "express";
import {
  createReservation,
  getAllReservations,
  getReservationById,
  deleteReservation,
  getUserReservations,
  cancelPendingReservations
} from "../controllers/reservationControler";
import { authMiddleware } from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/caheRedisMiddleware";

const router = Router();

router.post("/create", authMiddleware, createReservation);
router.get("/", cacheMiddleware, authMiddleware, getAllReservations);
router.get("/user/:userId", authMiddleware, getUserReservations);
router.get("/:id", authMiddleware, getReservationById);
router.delete("/:id", authMiddleware, deleteReservation);
router.put("/cancel/:id", authMiddleware, cancelPendingReservations);

export { router };
