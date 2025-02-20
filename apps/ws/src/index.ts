import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./config/config";
import { WebSocketService } from "./services/websocket.service";
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/chat.routes";
import { errorHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", roomRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling
app.use(errorHandler);

// Start servers
const wsService = new WebSocketService(config.server.wsPort);
app.listen(config.server.port, () => {
  logger.info(`HTTP server listening on port ${config.server.port}`);
  logger.info(`WebSocket server listening on port ${config.server.wsPort}`);
});

export default app;
