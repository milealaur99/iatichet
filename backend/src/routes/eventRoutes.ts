import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent
} from "../controllers/eventController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleWare";

const router = Router();
router.post("/create", authMiddleware, adminMiddleware, createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvent);

export { router };
