"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const reservationControler_1 = require("../controllers/reservationControler");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const caheRedisMiddleware_1 = require("../middlewares/caheRedisMiddleware");
const router = (0, express_1.Router)();
exports.router = router;
router.post("/create", authMiddleware_1.authMiddleware, reservationControler_1.createReservation);
router.get("/", caheRedisMiddleware_1.cacheMiddleware, authMiddleware_1.authMiddleware, reservationControler_1.getAllReservations);
router.get("/user/:userId", authMiddleware_1.authMiddleware, reservationControler_1.getUserReservations);
router.get("/:id", authMiddleware_1.authMiddleware, reservationControler_1.getReservationById);
router.delete("/:id", authMiddleware_1.authMiddleware, reservationControler_1.deleteReservation);
router.put("/cancel/:id", authMiddleware_1.authMiddleware, reservationControler_1.cancelPendingReservations);
//# sourceMappingURL=reservationRoutes.js.map