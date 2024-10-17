import { Router } from "express";
import {
  login,
  signup,
  resetPassword,
  getUserInfo,
  logout
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { cacheMiddleware } from "../middlewares/caheRedisMiddleware";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/reset-password", resetPassword);
router.get("/user-info/:id?", authMiddleware, getUserInfo);
router.get("/logout", logout);

export default router;
