import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { redisClient } from "./redis.service";
import { logger } from "../utils/logger";
import prisma from "./prisma.service";
import { boolean } from "zod";

// Types and Interfaces
export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  user1?: User;
  user2?: User;
  messages?: Message[];
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  createdAt: Date;
}

export enum WebSocketMessageType {
  CHAT = "chat",
  JOIN = "join",
  TYPING = "typing",
  CONNECTION = "connection",
  ERROR = "error",
  PRESENCE = "presence",
  ONLINE = "online",
}

export enum WebSocketCloseCode {
  NORMAL = 1000,
  AUTH_REQUIRED = 4001,
  INVALID_AUTH = 4002,
  INVALID_MESSAGE = 4003,
  INTERNAL_ERROR = 4500,
}

interface BaseWebSocketPayload {
  chatId?: string;
  userId?: string;
  message?: Message;
}

interface ChatMessagePayload extends BaseWebSocketPayload {
  content: string;
  senderId: string;
}

interface JoinChatPayload extends BaseWebSocketPayload {
  chatId: string;
}

interface TypingPayload extends BaseWebSocketPayload {
  isTyping: boolean;
}

interface ConnectionPayload extends BaseWebSocketPayload {
  status: "connected" | "disconnected";
}

interface OnlineStatusPayload extends BaseWebSocketPayload {
  user2Id: string;
  userId: string;
}

interface WebSocketMessage<
  T extends BaseWebSocketPayload = BaseWebSocketPayload,
> {
  type: WebSocketMessageType;
  payload: T;
}

export class WebSocketService {
  private readonly wss: WebSocketServer;
  private readonly userSockets: Map<string, WebSocket>;
  private readonly messageHandlers: Map<
    WebSocketMessageType,
    (ws: WebSocket, payload: any) => Promise<void>
  >;
  private readonly PING_INTERVAL = 30000;
  private readonly CACHE_EXPIRY = 3600;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.userSockets = new Map();
    this.messageHandlers = new Map();
    this.registerMessageHandlers();
    this.init();
  }

  private registerMessageHandlers(): void {
    this.messageHandlers.set(
      WebSocketMessageType.CHAT,
      this.handleChat.bind(this)
    );
    this.messageHandlers.set(
      WebSocketMessageType.JOIN,
      this.handleJoin.bind(this)
    );
    this.messageHandlers.set(
      WebSocketMessageType.TYPING,
      this.handleTyping.bind(this)
    );
    this.messageHandlers.set(
      WebSocketMessageType.ONLINE,
      this.handleOnlineStatus.bind(this)
    );
  }

  private async authenticateConnection(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const cacheKey = `user:${decoded.id}`;

      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, username: true },
      });

      if (user) {
        await redisClient.set(cacheKey, JSON.stringify(user), {
          EX: this.CACHE_EXPIRY,
        });
      }

      return user;
    } catch (error) {
      logger.error("WebSocket authentication error:", error);
      return null;
    }
  }

  private async handleMessage(
    ws: WebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    try {
      const handler = this.messageHandlers.get(
        message.type as WebSocketMessageType
      );

      if (!handler) {
        logger.warn(`Unhandled message type: ${message.type}`);
        this.sendError(ws, "Unsupported message type");
        return;
      }

      await handler(ws, message.payload);
    } catch (error) {
      logger.error("Message handling error:", error);
      this.sendError(ws, "Failed to process message");
    }
  }

  private async handleChat(
    ws: WebSocket,
    payload: ChatMessagePayload
  ): Promise<void> {
    const { chatId, content, senderId } = payload;

    if (!chatId || !content || !senderId) {
      this.sendError(ws, "Invalid chat message");
      return;
    }

    try {
      const message = await prisma.message.create({
        data: { content, senderId, chatId },
      });

      console.log("Chat message created:", message);

      const chat = await this.getChatById(chatId);
      if (!chat) return;

      console.log("Chat found:", chat);

      await this.notifyRecipient(chat, senderId, {
        type: WebSocketMessageType.CHAT,
        payload: { chatId, message },
      });

      await this.invalidateCache(chatId);
    } catch (error) {
      logger.error("Chat handling error:", error);
      this.sendError(ws, "Failed to process chat message");
    }
  }

  private async handleJoin(
    ws: WebSocket,
    payload: JoinChatPayload
  ): Promise<void> {
    try {
      const chat = await prisma.chat.findUnique({
        where: { id: payload.chatId },
        include: {
          user1: { select: { id: true, email: true, username: true } },
          user2: { select: { id: true, email: true, username: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            take: 500,
          },
        },
      });

      // console.log("Chat found:", chat);
      // console.log("Handle join chats", chat);
      // console.log(`Total msg in chat ${chat?.id}`, chat?.messages.length);

      if (!chat) {
        this.sendError(ws, "Chat not found");
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        chat.messages.forEach((msg) => {
          ws.send(
            JSON.stringify({
              type: WebSocketMessageType.CHAT,
              payload: { chatId: payload.chatId, message: msg },
            })
          );
        });
      }

      // await this.invalidateCache(payload.chatId);
    } catch (error) {
      logger.error("Join handling error:", error);
      this.sendError(ws, "Failed to join chat");
    }
  }

  private async handleOnlineStatus(
    ws: WebSocket,
    payload: OnlineStatusPayload
  ): Promise<void> {
    try {
      console.log("Handle online status", payload);
      const { userId, user2Id } = payload;
      
      if (!userId) {
        this.sendError(ws, "Invalid online status");
        return;
      }

      const chat = await prisma.chat.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id },
            { user1Id: user2Id, user2Id: userId },
          ],
        },
      });

      console.log("Chat found for online status: ", chat);

      if (!chat) return;

      if (
        !this.userSockets.get(user2Id) ||
        this.userSockets.get(user2Id)?.readyState !== WebSocket.OPEN
      ) {
        console.log("User is offline");
        //send last seen status
        const lastSeen = await redisClient.get(`lastSeen:${user2Id}`);
        const onlineStatus = lastSeen
          ? new Date(lastSeen) > new Date(Date.now() - 30000)
          : false;

        console.log("Last seen status", lastSeen, onlineStatus);
        this.userSockets.get(userId)?.send(
          JSON.stringify({
            type: WebSocketMessageType.ONLINE,
            payload: { online: onlineStatus, lastSeen },
          })
        );
        // await this.notifyRecipient(chat, userId, {
        //   type: WebSocketMessageType.ONLINE,
        //   //@ts-ignore
        //   payload: { online: onlineStatus, lastSeen },
        // });
        return;
      }

      console.log("User is online");
      this.userSockets.get(userId)?.send(
        JSON.stringify({
          type: WebSocketMessageType.ONLINE,
          payload: { online: true },
        })
      );
      // await this.notifyRecipient(chat, userId, {
      //   type: WebSocketMessageType.ONLINE,
      //   //@ts-ignore
      //   payload: {
      //     //@ts-ignore
      //     online: true,
      //   },
      // });

      console.log("Online status payload", payload);
    } catch (error) {
      logger.error("Online status handling error:", error);
      this.sendError(ws, "Failed to process online status");
    }
  }

  private async handleTyping(
    ws: WebSocket,
    payload: TypingPayload
  ): Promise<void> {
    try {
      const { chatId, userId, isTyping } = payload;

      console.log("Typing payload", payload);

      if (!chatId || !userId) {
        this.sendError(ws, "Invalid typing status");
        return;
      }
      const chat = await this.getChatById(chatId);

      if (!chat) return;

      await this.notifyRecipient(chat, userId, {
        type: WebSocketMessageType.TYPING,
        //@ts-ignore
        payload: { chatId, userId, isTyping },
      });
    } catch (error) {
      logger.error("Typing handling error:", error);
      this.sendError(ws, "Failed to process typing status");
    }
  }

  private async getChatById(chatId: string): Promise<Chat | null> {
    return prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
      },
    }) as Promise<Chat | null>;
  }

  private async notifyRecipient(
    chat: Chat,
    senderId: string,
    message: WebSocketMessage
  ): Promise<void> {
    const recipientId = chat.user1Id === senderId ? chat.user2Id : chat.user1Id;
    const recipientSocket = this.userSockets.get(recipientId);

    if (recipientSocket?.readyState === WebSocket.OPEN) {
      // this.userSockets.get(senderId)?.send(JSON.stringify(message));
      console.log("Sending message to recipient", message);
      recipientSocket.send(JSON.stringify(message));
    }
    const senderSocket = this.userSockets.get(senderId);
    if (
      message.type === WebSocketMessageType.CHAT &&
      senderSocket?.readyState === WebSocket.OPEN
    ) {
      console.log("Sending message to sender", message);
      senderSocket.send(JSON.stringify(message));
    }
  }

  private async invalidateCache(chatId: string): Promise<void> {
    await redisClient.del(`chat:${chatId}`);
  }

  private sendError(ws: WebSocket, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: WebSocketMessageType.ERROR,
          payload: { message },
        })
      );
    }
  }

  private setupHeartbeat(): void {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, this.PING_INTERVAL);
  }

  private init(): void {
    this.wss.on("connection", async (ws: WebSocket, req) => {
      try {
        const url = new URL(req.url!, `ws://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          ws.close(WebSocketCloseCode.AUTH_REQUIRED, "Authentication required");
          return;
        }

        const user = await this.authenticateConnection(token);
        if (!user) {
          ws.close(WebSocketCloseCode.INVALID_AUTH, "Invalid authentication");
          return;
        }

        logger.info(`User ${user.id} connected to WebSocket`);
        this.userSockets.set(user.id, ws);

        ws.on("message", async (msg) => {
          try {
            const parsedMessage = JSON.parse(
              msg.toString()
            ) as WebSocketMessage;
            await this.handleMessage(ws, parsedMessage);
          } catch (error) {
            logger.error("Failed to parse message:", error);
            this.sendError(ws, "Invalid message format");
          }
        });

        ws.on("close", async () => {
          this.userSockets.delete(user.id);
          // store last seen status in redis client
          await redisClient.set(
            `lastSeen:${user.id}`,
            new Date().toISOString()
          );
          logger.info(`User ${user.id} disconnected from WebSocket`);
        });

        ws.on("error", (error) => {
          logger.error(`WebSocket error for user ${user.id}:`, error);
          this.userSockets.delete(user.id);
        });

        this.sendConnectionStatus(ws, user.id, "connected");
      } catch (error) {
        logger.error("Connection handling error:", error);
        ws.close(WebSocketCloseCode.INTERNAL_ERROR, "Internal server error");
      }
    });

    this.setupHeartbeat();
  }

  private sendConnectionStatus(
    ws: WebSocket,
    userId: string,
    status: "connected" | "disconnected"
  ): void {
    ws.send(
      JSON.stringify({
        type: WebSocketMessageType.CONNECTION,
        payload: { status, userId },
      })
    );
  }
}
