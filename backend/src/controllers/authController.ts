import { Response, Request } from "express";
import { sign } from "../utils/jwt";
import UserModel, { User } from "../models/User";
import bcrypt from "bcryptjs";

export const login = async (req: Request & { user?: User }, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }

  const userModel = await UserModel.findOne({ username });

  if (!userModel) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatch = await bcrypt.compare(password, userModel.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = sign({
    username,
    id: userModel._id?.toString() ?? "",
    password: userModel.password,
    role: userModel.role,
  });
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ message: "Logged in successfully", token });
};

export const signup = async (req: Request & { user?: User }, res: Response) => {
  const { username, password, confirmPassword } = req.body;
  const userModel = await UserModel.findOne({ username });

  if (userModel) {
    return res.status(409).json({ message: "Username already exists" });
  }

  if (password === confirmPassword) {
    const hashedPw = await bcrypt.hash(password, 12);
    const newUser = new UserModel({
      username,
      password: hashedPw,
      email: username + "@gmail.com",
    });
    await newUser.save();

    const token = sign({
      username,
      id: newUser?.id,
      password: await bcrypt.hash(password, 12),
      role: "user",
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({ message: "Signed in successfully", token });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};

export const logout = (req: Request & { user?: User }, res: Response) => {
  res.clearCookie("jwt");
  return res.json({ message: "Logged out successfully" });
};

export const resetPassword = async (
  req: Request & { user?: User },
  res: Response
) => {
  const { password, confirmPassword } = req.body;
  if (password === confirmPassword) {
    await UserModel.findById(req.user?.id).updateOne({ password });
    return res.json({ message: "Password changed successfully" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};

export const deleteAccount = async (
  req: Request & { user?: User },
  res: Response
) => {
  await UserModel.findByIdAndDelete(req.user?.id);
  return res.json({ message: "Account deleted successfully" });
};
