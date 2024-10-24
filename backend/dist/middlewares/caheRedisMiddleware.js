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
exports.cacheMiddleware = void 0;
const errorMiddleware_1 = require("./errorMiddleware");
const redisUtils_1 = require("../utils/redisUtils");
const cacheMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const key = req.originalUrl || req.url;
    try {
        const cachedData = yield (0, redisUtils_1.getAsync)(key);
        if (cachedData) {
            res.send(cachedData);
        }
        else {
            res.sendResponse = res.send;
            res.send = (body) => {
                (0, redisUtils_1.setAsync)({ key, value: body });
                const response = res.sendResponse && res.sendResponse(body);
                return response !== null && response !== void 0 ? response : res.send(body);
            };
            next();
        }
    }
    catch (error) {
        next(new errorMiddleware_1.AppError("Error caching data", 500));
    }
});
exports.cacheMiddleware = cacheMiddleware;
//# sourceMappingURL=caheRedisMiddleware.js.map