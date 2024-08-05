import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import { AppError } from "./errorMiddleware";

declare global {
  namespace Express {
    interface Response {
      sendResponse?: (body: Object) => void;
    }
  }
}

export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.originalUrl || req.url;

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      res.send(JSON.parse(cachedData));
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        redisClient.setEx(key, 3600, JSON.stringify(body));
        const response = res.sendResponse && res.sendResponse(body);
        return response ?? res.send(body);
      };
      next();
    }
  } catch (error) {
    next(new AppError("Error caching data", 500));
  }
};
