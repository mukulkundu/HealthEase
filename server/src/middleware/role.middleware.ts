import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import { sendError } from "../utils/apiResponse.js";

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "You do not have permission to perform this action", 403);
    }

    next();
  };
};