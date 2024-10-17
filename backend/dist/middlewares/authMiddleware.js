"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const errorMiddleware_1 = require("./errorMiddleware");
const jwt_2 = require("../utils/jwt");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt) || (0, jwt_2.getTokenFromHeader)(req);
    console.log(token, "token", "req.cookies", req.cookies);
    if (!token && res) {
        return res
            .status(401)
            .json({ message: "Access denied. No token provided." });
    }
    try {
        if ((0, jwt_1.verify)(token)) {
            const decoded = (0, jwt_1.decode)(token);
            req.user = decoded.payload;
            next();
        }
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Invalid token", 400));
    }
});
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map