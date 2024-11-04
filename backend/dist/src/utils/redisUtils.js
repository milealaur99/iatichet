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
exports.usersViewingEvent = exports.timeoutStorage = exports.setAsync = exports.getAsync = void 0;
const util_1 = require("util");
const redis_1 = require("../config/redis");
const binaryTransformer_1 = require("../utils/binaryTransformer");
redis_1.client.on("error", (err) => console.log("Redis Client Error", err));
redis_1.client
    .connect()
    .then(() => {
    console.log("Connected to Redis");
})
    .catch((err) => {
    console.error("Error connecting to Redis:", err);
});
const getAsync = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, util_1.promisify)(redis_1.client.get).bind(redis_1.client)(key);
        if (!data) {
            return null;
        }
        return (0, binaryTransformer_1.convertBinaryToObject)(data);
    }
    catch (error) {
        return null;
    }
});
exports.getAsync = getAsync;
const setAsync = (_a) => __awaiter(void 0, [_a], void 0, function* ({ key, value }) {
    try {
        const binaryValue = yield (0, binaryTransformer_1.convertObjectToBinary)(value);
        yield redis_1.client.setEx(key, 3600, binaryValue);
    }
    catch (error) {
        console.error("Error setting data in Redis:", error);
    }
});
exports.setAsync = setAsync;
const timeoutStorage = new Map();
exports.timeoutStorage = timeoutStorage;
const usersViewingEvent = new Map();
exports.usersViewingEvent = usersViewingEvent;
//# sourceMappingURL=redisUtils.js.map