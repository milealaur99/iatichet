import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (
  req: Request & { user?: { role: string } },
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};
