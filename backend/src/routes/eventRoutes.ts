import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/caheRedisMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleWare";
import { upload } from "../middlewares/uploadImageMiddleware";

const router = Router();
router.post("/create", authMiddleware, adminMiddleware, createEvent);
router.get("/", getAllEvents);
router.get("/:id", cacheMiddleware, getEventById);
router.put("/:id", authMiddleware, adminMiddleware, updateEvent);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvent);

export default router;
