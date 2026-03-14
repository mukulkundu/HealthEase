import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { sendError } from "../utils/apiResponse.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : undefined);

    if (!token) {
      return sendError(res, "No token provided", 401);
    }

    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return sendError(res, "Invalid or expired token", 401);
  }
};