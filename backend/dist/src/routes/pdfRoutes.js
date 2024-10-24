"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.get("/pdfs/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path_1.default.join(__dirname, "..", "..", "public", "pdfs", filename);
    res.download(filePath);
});
exports.default = router;
//# sourceMappingURL=pdfRoutes.js.map