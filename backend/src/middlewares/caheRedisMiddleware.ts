import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorMiddleware";
import { setAsync, getAsync } from "../utils/redisUtils";

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
    const cachedData = await getAsync(key);
    if (cachedData) {
      res.send(cachedData);
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        setAsync({ key, value: body });
        const response = res.sendResponse && res.sendResponse(body);
        return response ?? res.send(body);
      };
      next();
    }
  } catch (error) {
    next(new AppError("Error caching data", 500));
  }
};
