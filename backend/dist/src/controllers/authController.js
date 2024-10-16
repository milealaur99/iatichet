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
exports.getUserInfo = exports.deleteAccount = exports.resetPassword = exports.logout = exports.signup = exports.login = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const lodash_1 = require("lodash");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
    }
    const userModel = yield User_1.default.findOne({ username });
    if (!userModel) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const passwordMatch = yield bcryptjs_1.default.compare(password, userModel.password);
    if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = (0, jwt_1.sign)({
        username,
        id: (_b = (_a = userModel._id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
        password: userModel.password,
        role: userModel.role
    });
    res.cookie("jwt", token);
    return res.json({
        message: "Logged in successfully",
        token,
        userId: userModel._id
    });
});
exports.login = login;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, confirmPassword, email } = req.body;
    let userModel = yield User_1.default.findOne({ username });
    if (userModel) {
        return res.status(409).json({ message: "Username already exists" });
    }
    userModel = yield User_1.default.findOne({ email });
    if ((userModel === null || userModel === void 0 ? void 0 : userModel.email) === email) {
        return res.status(409).json({ message: "Email already exists" });
    }
    if (password === confirmPassword) {
        const hashedPw = yield bcryptjs_1.default.hash(password, 12);
        const newUser = new User_1.default({
            username,
            password: hashedPw,
            email
        });
        yield newUser.save();
        const token = (0, jwt_1.sign)({
            username,
            id: newUser === null || newUser === void 0 ? void 0 : newUser.id,
            password: yield bcryptjs_1.default.hash(password, 12),
            role: "user"
        });
        res.cookie("jwt", token, { httpOnly: true });
        return res.json({ message: "Signed in successfully", token });
    }
    else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});
exports.signup = signup;
const logout = (req, res) => {
    res.clearCookie("jwt");
    return res.json({ message: "Logged out successfully" });
};
exports.logout = logout;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { password, confirmPassword } = req.body;
    if (password === confirmPassword) {
        yield User_1.default.findById((_c = req.user) === null || _c === void 0 ? void 0 : _c.id).updateOne({ password });
        return res.json({ message: "Password changed successfully" });
    }
    else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});
exports.resetPassword = resetPassword;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    yield User_1.default.findByIdAndDelete((_d = req.user) === null || _d === void 0 ? void 0 : _d.id);
    return res.json({ message: "Account deleted successfully" });
});
exports.deleteAccount = deleteAccount;
const getUserInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const user = yield User_1.default.findById((_e = req.params.id) !== null && _e !== void 0 ? _e : (_f = req.user) === null || _f === void 0 ? void 0 : _f.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json((0, lodash_1.omit)(user, "password"));
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUserInfo = getUserInfo;
//# sourceMappingURL=authController.js.map