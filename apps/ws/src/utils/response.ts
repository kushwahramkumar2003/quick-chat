import { Response } from "express";
import { ErrorDetail } from "../middleware/error.types";

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string = "An error occurred",
  statusCode: number = 500,
  errors: ErrorDetail[] = []
): void => {
  res.status(statusCode).json({
    status: "error",
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
};
