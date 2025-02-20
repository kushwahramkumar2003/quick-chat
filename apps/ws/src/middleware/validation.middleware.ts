import type { Request, Response, NextFunction } from "express";
import type { AnyZodObject } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      logger.error(error);
      next(new AppError(400, "Invalid input data", false));
    }
  };
