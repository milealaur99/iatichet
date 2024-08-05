import { Request, Response, NextFunction } from "express";
import { decode, verify } from "../utils/jwt";
import { AppError } from "./errorMiddleware";
import { getTokenFromHeader } from "../utils/jwt";

export const authMiddleware = async (
  req: Request & {
    user?: {
      username: string;
      id: string;
      password: string;
    };
  },
  res: Response | null,
  next: NextFunction
) => {
  const token = req.cookies?.jwt || getTokenFromHeader(req as any);

  if (!token && res) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    if (verify(token)) {
      const decoded = decode(token);
      req.user = decoded.payload;
      next();
    }
  } catch (error) {
    next(new AppError("Invalid token", 400));
  }
};
