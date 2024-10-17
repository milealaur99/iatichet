"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.verify = exports.sign = exports.getTokenFromHeader = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getTokenFromHeader = (req) => {
    if ((req === null || req === void 0 ? void 0 : req.headers["authorization"]) &&
        (req === null || req === void 0 ? void 0 : req.headers["authorization"].startsWith("Bearer"))) {
        return req === null || req === void 0 ? void 0 : req.headers["authorization"].split(" ")[1];
    }
    return null;
};
exports.getTokenFromHeader = getTokenFromHeader;
const algorithm = "HS256";
const expiresIn = "2h";
const sign = (payload) => {
    const secret = process.env.JWT_SECRET;
    return jsonwebtoken_1.default.sign(payload, secret, { algorithm, expiresIn });
};
exports.sign = sign;
const verify = (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        return jsonwebtoken_1.default.verify(token, secret, { algorithms: [algorithm] });
    }
    catch (err) {
        throw new Error("Invalid token");
    }
};
exports.verify = verify;
const decode = (token) => {
    return jsonwebtoken_1.default.decode(token, { complete: true });
};
exports.decode = decode;
//# sourceMappingURL=jwt.js.map