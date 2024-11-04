"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({
    legacyMode: true,
    socket: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST
    }
});
exports.client = client;
client.on("error", (err, info, extra) => {
    console.log("Redis Client Error", err, info, extra);
});
client.connect().then(() => {
    console.log("Redis connected");
});
//# sourceMappingURL=redis.js.map