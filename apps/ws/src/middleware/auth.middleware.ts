import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { AppError } from "../utils/errors";
import { redisClient } from "../services/redis.service";
import prisma from "../services/prisma.service";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies[config.cookie.name];

    if (!token) {
      throw new AppError(401, "Please log in to access this resource");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

    // Check Redis cache first
    const cachedUser = await redisClient.get(`user:${decoded.id}`);
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      throw new AppError(401, "User no longer exists");
    }

    // Cache user data in Redis
    await redisClient.set(`user:${user.id}`, JSON.stringify(user), {
      EX: 3600,
    });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
      };
    }
  }
}
