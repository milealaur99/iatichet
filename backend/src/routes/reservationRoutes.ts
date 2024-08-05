import { Router } from "express";
import {
  createReservation,
  getAllReservations,
  getReservationById,
  deleteReservation,
  getUserReservations,
} from "../controllers/reservationControler";
import { authMiddleware } from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/caheRedisMiddleware";

const router = Router();

router.post("/create", authMiddleware, createReservation);
router.get("/", cacheMiddleware, getAllReservations);
router.get(
  "/user/:userId",
  authMiddleware,
  cacheMiddleware,
  getUserReservations
);
router.get("/:id", getReservationById);
router.delete("/:id", authMiddleware, deleteReservation);

export default router;
