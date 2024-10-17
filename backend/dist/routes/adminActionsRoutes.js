"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleWare_1 = require("../middlewares/adminMiddleWare");
const router = (0, express_1.Router)();
router.get("/users", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, adminController_1.getUsers);
router.put("/users/:id", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, adminController_1.changeRole);
router.get("/find-users/:username", adminController_1.findUser);
router.delete("/users/:id", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, adminController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=adminActionsRoutes.js.map