"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SeatSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.SeatSchema = new mongoose_1.Schema({
    row: { type: String, required: true },
    number: { type: Number, required: true },
    reservationOps: {
        type: {
            isReserved: Boolean,
            reservation: { type: String, ref: "Reservation" }
        },
        default: {
            isReserved: false,
            reservation: null,
            required: false
        }
    }
}, { _id: false });
const HallSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    seats: { type: [exports.SeatSchema], required: true }
});
HallSchema.statics.initializeHalls = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const smallHall = yield this.findOne({ name: "Small Hall" });
        if (!smallHall) {
            const seats = Array.from({ length: 50 }, (_, i) => {
                const row = String.fromCharCode(65 + Math.floor(i / 10));
                const number = (i % 10) + 1;
                return {
                    row,
                    number,
                    reservationOps: { isReserved: false, reservation: null }
                };
            });
            yield this.create({ name: "Small Hall", type: "small", seats });
        }
        const largeHall = yield this.findOne({ name: "Large Hall" });
        if (!largeHall) {
            const seats = Array.from({ length: 200 }, (_, i) => {
                const row = String.fromCharCode(65 + Math.floor(i / 10));
                const number = (i % 10) + 1;
                return {
                    row,
                    number,
                    reservationOps: { isReserved: false, reservation: null }
                };
            });
            yield this.create({ name: "Large Hall", type: "large", seats });
        }
    });
};
exports.default = mongoose_1.default.model("Hall", HallSchema);
//# sourceMappingURL=Hall.js.map