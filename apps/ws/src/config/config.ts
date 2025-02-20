import dotenv from "dotenv";

dotenv.config();

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: "24h",
  },
  server: {
    port: parseInt(process.env.PORT || "8080", 10),
    wsPort: parseInt(process.env.WS_PORT || "8081", 10),
  },
  cookie: {
    name: "token",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  email: {
    from: process.env.EMAIL_FROM || "",
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
