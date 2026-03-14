import type { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse.js";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(`[Error] ${err.message}`);

  // Known app error
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Prisma unique constraint violation
  if ((err as any).code === "P2002") {
    return sendError(res, "A record with this value already exists", 409);
  }

  // Prisma record not found
  if ((err as any).code === "P2025") {
    return sendError(res, "Record not found", 404);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  // Default
  return sendError(res, "Internal server error", 500);
};