import { z } from "zod";

export const createChatSchema = z.object({
  body: z.object({
    secondUserName: z.string().min(3, "Room name must be at least 3 characters"),
  }),
});

export const joinRoomSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid room ID"),
  }),
});
