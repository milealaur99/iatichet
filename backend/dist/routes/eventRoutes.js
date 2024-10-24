"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminMiddleWare_1 = require("../middlewares/adminMiddleWare");
const router = (0, express_1.Router)();
exports.router = router;
router.post("/create", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, eventController_1.createEvent);
router.get("/", eventController_1.getAllEvents);
router.get("/:id", eventController_1.getEventById);
router.put("/:id", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, eventController_1.updateEvent);
router.delete("/:id", authMiddleware_1.authMiddleware, adminMiddleWare_1.adminMiddleware, eventController_1.deleteEvent);
//# sourceMappingURL=eventRoutes.js.map