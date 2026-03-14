import { sendError } from "../utils/apiResponse.js";
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
export const errorMiddleware = (err, _req, res, _next) => {
    console.error(`[Error] ${err.message}`);
    // Known app error
    if (err instanceof AppError) {
        return sendError(res, err.message, err.statusCode);
    }
    // Prisma unique constraint violation
    if (err.code === "P2002") {
        return sendError(res, "A record with this value already exists", 409);
    }
    // Prisma record not found
    if (err.code === "P2025") {
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
