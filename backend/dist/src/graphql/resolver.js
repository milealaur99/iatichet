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
const Event_1 = __importDefault(require("../models/Event"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
const resolvers = {
    Query: {
        events: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield Event_1.default.find();
        }),
        event: (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
            return yield Event_1.default.findById(id);
        }),
        reservations: () => __awaiter(void 0, void 0, void 0, function* () {
            return yield Reservation_1.default.find();
        }),
        reservation: (_2, _b) => __awaiter(void 0, [_2, _b], void 0, function* (_, { id }) {
            return yield Reservation_1.default.findById(id);
        }),
    },
};
exports.default = resolvers;
//# sourceMappingURL=resolver.js.map