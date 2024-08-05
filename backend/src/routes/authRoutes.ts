import { Router } from "express";
import { login, signup, resetPassword } from "../controllers/authController";

const router = Router();
router.post("/login", login);
router.post("/signup", signup);
router.post("/reset-password", resetPassword);

export default router;
