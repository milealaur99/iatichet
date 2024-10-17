import { Router } from "express";
import {
  getUsers,
  changeRole,
  deleteUser,
  findUser
} from "../controllers/adminController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleWare";

const router = Router();

router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.put("/users/:id", authMiddleware, adminMiddleware, changeRole);
router.get("/find-users/:username", findUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUser);

export default router;
