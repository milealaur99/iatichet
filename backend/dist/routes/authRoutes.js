"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post("/login", authController_1.login);
router.post("/signup", authController_1.signup);
router.post("/reset-password", authController_1.resetPassword);
router.get("/user-info/:id?", authMiddleware_1.authMiddleware, authController_1.getUserInfo);
router.get("/logout", authController_1.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map