import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { redisClient } from "../services/redis.service";
import prisma from "../services/prisma.service";

export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { secondUserName } = req.body;
    const user2 = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: secondUserName,
          },
          {
            username: secondUserName,
          },
        ],
      },
    });

    if (!user2) {
      throw new AppError(404, "User not found");
    }

    const user2Id = user2.id;
    // @ts-ignore
    const user1Id = req.user.id;

    if (user1Id === user2Id) {
      throw new AppError(400, "You cannot create a chat with yourself");
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: user1Id, user2Id: user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    if (existingChat) {
      throw new AppError(400, "Chat already exists between these users");
    }

    const chat = await prisma.chat.create({
      data: {
        user1Id,
        user2Id,
      },
      include: {
        user1: { select: { username: true } },
        user2: { select: { username: true } },
      },
    });

    // Notify the other user about the new chat
    // await notifyUser(user2Id, `${chat.user1.username} started a chat with you`);

    // Cache the chat data
    await redisClient.set(`chat:${chat.id}`, JSON.stringify(chat), {
      EX: 3600,
    });

    res.status(201).json({
      status: "success",
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

export const getChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalChats = await prisma.chat.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        chats,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalChats / limit),
          totalChats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatId = req.params.id;
    //@ts-ignore
    const userId = req.user.id;

    // Try to get chat from cache
    const cachedChat = await redisClient.get(`chat:${chatId}`);
    if (cachedChat) {
      const chat = JSON.parse(cachedChat);
      if (chat.user1Id === userId || chat.user2Id === userId) {
        return res.status(200).json({
          status: "success",
          data: { chat },
          source: "cache",
        });
      }
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user1: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        user2: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    if (!chat) {
      throw new AppError(404, "Chat not found");
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new AppError(403, "You are not authorized to access this chat");
    }
    await redisClient.set(`chat:${chatId}`, JSON.stringify(chat), {
      EX: 3600,
    });
    // Cache the chat data
    await redisClient.set(`chat:${chatId}`, JSON.stringify(chat), {
      EX: 3600,
    });

    res.status(200).json({
      status: "success",
      data: { chat },
      source: "database",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatId = req.params.id;
    //@ts-ignore
    const userId = req.user.id;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new AppError(404, "Chat not found");
    }

    if (chat.user1Id !== userId && chat.user2Id !== userId) {
      throw new AppError(403, "You are not authorized to delete this chat");
    }

    await prisma.chat.delete({
      where: { id: chatId },
    });

    // Remove chat from cache
    await redisClient.del(`chat:${chatId}`);

    res.status(200).json({
      status: "success",
      message: "Chat deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
