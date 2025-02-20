import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { logger } from "../utils/logger";

interface ErrorResponse {
  status: string;
  message: string;
  errors?: any;
  stack?: string;
}

const handleCastErrorDB = (error: PrismaClientKnownRequestError): AppError => {
  const message = `Invalid ${error.meta?.target}: ${error.message}`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = (
  error: PrismaClientKnownRequestError
): AppError => {
  const value = error.meta?.target;
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(400, message);
};

const handleValidationError = (error: ZodError): AppError => {
  const errors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return new AppError(400, "Invalid input data", false);
};

const handleJWTError = (): AppError =>
  new AppError(401, "Invalid token. Please log in again!");

const handleJWTExpiredError = (): AppError =>
  new AppError(401, "Your token has expired! Please log in again.");

const sendErrorDev = (err: AppError, res: Response): void => {
  logger.error("ERROR 💥", err);

  const errorResponse: ErrorResponse = {
    status: "error",
    message: err.message,
    stack: err.stack,
  };

  if (!err.isOperational) {
    errorResponse.errors = err;
  }

  res.status(err.statusCode).json(errorResponse);
};

const sendErrorProd = (err: AppError, res: Response): void => {
  logger.error("ERROR 💥", err);

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error =
    err instanceof AppError ? err : new AppError(500, err.message, false);

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
    return;
  }

  // Handle specific error types
  if (err instanceof PrismaClientKnownRequestError) {
    // Handling Prisma specific errors
    switch (err.code) {
      case "P2002": // Unique constraint violation
        error = handleDuplicateFieldsDB(err);
        break;
      case "P2025": // Record not found
        error = new AppError(404, "Record not found");
        break;
      case "P2003": // Foreign key constraint violation
        error = new AppError(400, "Invalid reference to related record");
        break;
      default:
        error = handleCastErrorDB(err);
    }
  } else if (err instanceof ZodError) {
    error = handleValidationError(err);
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  sendErrorProd(error, res);
};
