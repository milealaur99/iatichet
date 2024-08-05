import { Request, Response, NextFunction } from "express";
import User, { User as UserModel } from "../models/User";

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await User.find({ _id: req.params.id });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  } else {
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "User deleted successfully" });
  }
};

export const changeRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user: UserModel | null = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  } else {
    user.role = req.body.role;
    await user.save();
    return res.status(200).json({ message: "Role changed successfully" });
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const users = await User.find();
  if (!users) {
    return res.status(404).json({ message: "Users not found" });
  }

  return res.status(200).json(users);
};
