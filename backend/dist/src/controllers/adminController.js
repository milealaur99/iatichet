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
exports.findUser = exports.getUsers = exports.changeRole = exports.deleteUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const lodash_1 = require("lodash");
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.find({ _id: req.params.id });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    else {
        yield User_1.default.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "User deleted successfully" });
    }
});
exports.deleteUser = deleteUser;
const changeRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    else {
        user.role = req.body.role;
        yield user.save();
        return res.status(200).json({ message: "Role changed successfully" });
    }
});
exports.changeRole = changeRole;
const getUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield User_1.default.find();
    if (!users) {
        return res.status(404).json({ message: "Users not found" });
    }
    return res.status(200).json(users);
});
exports.getUsers = getUsers;
const findUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield User_1.default.find({
        username: { $regex: req.params.username, $options: "i" }
    });
    if (!users || users.length === 0) {
        return res.status(404).json({ message: "Users not found" });
    }
    return res.status(200).json(users.map((user) => (0, lodash_1.omit)(user, "password")));
});
exports.findUser = findUser;
//# sourceMappingURL=adminController.js.map