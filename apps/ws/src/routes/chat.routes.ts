import express from "express";
import {
  createChat,
  getChats,
  getChat,
  deleteChat,
} from "../controllers/chat.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { createChatSchema } from "../validators/chat.validator";

const router = express.Router();

// All chat routes require authentication
router.use(protect);

router.route("/").get(getChats).post(validate(createChatSchema), createChat);

//@ts-ignore
router.route("/:id").get(getChat).delete(deleteChat);

export default router;
