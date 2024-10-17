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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBinaryToObject = exports.convertObjectToBinary = void 0;
const util_1 = require("util");
const zlib_1 = __importDefault(require("zlib"));
const gzip = (0, util_1.promisify)(zlib_1.default.gzip);
const gunzip = (0, util_1.promisify)(zlib_1.default.gunzip);
const convertObjectToBinary = (obj) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const json = typeof obj === 'object' ? JSON.stringify(obj) : obj;
        const compressed = yield gzip(json);
        const base64 = compressed.toString('base64');
        return base64;
    }
    catch (error) {
        throw error;
    }
});
exports.convertObjectToBinary = convertObjectToBinary;
const convertBinaryToObject = (binary) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buffer = Buffer.from(binary, 'base64');
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Decoded data is not a valid buffer');
        }
        const decompressed = yield gunzip(buffer);
        const json = decompressed.toString();
        return JSON.parse(json);
    }
    catch (error) {
        throw error;
    }
});
exports.convertBinaryToObject = convertBinaryToObject;
//# sourceMappingURL=binaryTransformer.js.map