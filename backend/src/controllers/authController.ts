import { Response, Request } from "express";
import { sign } from "../utils/jwt";
import UserModel, { User } from "../models/User";
import bcrypt from "bcryptjs";
import { omit } from "lodash";

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
    secure: true,
    sameSite: "none",
  });

  return res.json({
    message: "Logged in successfully",
    token,
    userId: userModel._id,
  });
};

export const signup = async (req: Request & { user?: User }, res: Response) => {
  const { username, password, confirmPassword, email } = req.body;
  let userModel = await UserModel.findOne({ username });

  if (userModel) {
    return res.status(409).json({ message: "Username already exists" });
  }
  userModel = await UserModel.findOne({ email });

  if (userModel?.email === email) {
    return res.status(409).json({ message: "Email already exists" });
  }

  if (password === confirmPassword) {
    const hashedPw = await bcrypt.hash(password, 12);
    const newUser = new UserModel({
      username,
      password: hashedPw,
      email,
    });
    await newUser.save();

    const token = sign({
      username,
      id: newUser?.id,
      password: await bcrypt.hash(password, 12),
      role: "user",
    });

    res.cookie("jwt", token, { httpOnly: true });
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

export const getUserInfo = async (
  req: Request & { user?: User },
  res: Response
) => {
  try {
    const user = await UserModel.findById(req.params.id ?? req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(omit(user, "password"));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
