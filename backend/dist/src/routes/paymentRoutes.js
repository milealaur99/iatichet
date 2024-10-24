"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
exports.router = router;
router.post("/create-checkout-session", paymentController_1.createCheckoutSession);
router.get("/success", paymentController_1.success);
router.get("/cancel", paymentController_1.cancel);
router.get('/download-reservation', paymentController_1.downloadPDFReservation);
//# sourceMappingURL=paymentRoutes.js.map