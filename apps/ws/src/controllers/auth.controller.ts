import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { AppError } from "../utils/errors";
import { redisClient } from "../services/redis.service";
import prisma from "../services/prisma.service";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, username } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new AppError(
        400,
        "User with this email or username already exists"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    redisClient.set(`session:${user.id}`, JSON.stringify(user), {
      EX: parseInt(config.jwt.expiresIn, 10),
    });

    // Store user in Redis for verification
    // Remove this code in production
    redisClient.set(
      `newuser:${email}`,
      JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username,
        password,
      })
    );

    //@ts-ignore
    const token = jwt.sign({ id: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    res.cookie(config.cookie.name, token, {
      maxAge: config.cookie.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Send welcome email
    // await sendWelcomeEmail(user.email, user.username);

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, "Incorrect email or password");
    }

    //@ts-ignore
    const token = jwt.sign({ id: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    res.cookie(config.cookie.name, token, {
      maxAge: config.cookie.maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Store user session in Redis
    await redisClient.set(`session:${user.id}`, JSON.stringify(user), {
      EX: parseInt(config.jwt.expiresIn, 10),
    });

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    const userId = req.user.id;

    // Clear user session from Redis
    await redisClient.del(`session:${userId}`);

    res.clearCookie(config.cookie.name);
    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //@ts-ignore
    const userId = req?.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
