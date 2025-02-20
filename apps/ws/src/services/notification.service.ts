import { logger } from "../utils/logger";

export const notifyUser = async (userId: string, message: string) => {
  try {
    // await prisma.notification.create({
    //   data: {
    //     userId,
    //     message,
    //   },
    // });
    // logger.info(`Notification created for user ${userId}: ${message}`);
    // Here you would typically trigger a real-time notification
    // using WebSockets or a similar technology
  } catch (error) {
    logger.error("Error creating notification:", error);
  }
};
