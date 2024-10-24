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
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
process.on("message", (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const outputFilePath = filePath.replace(/(\.[\w\d_-]+)$/i, "-processed$1");
    (0, sharp_1.default)(filePath)
        .resize(500, 500)
        .toFile(outputFilePath, (err, info) => {
        if (process === null || process === void 0 ? void 0 : process.send) {
            if (err) {
                process.send({ error: err });
            }
            else {
                fs_1.default.unlinkSync(filePath);
                process.send({ processedPath: outputFilePath.replace("backend/", ""), info });
            }
        }
    });
}));
//# sourceMappingURL=imageProcessor.js.map