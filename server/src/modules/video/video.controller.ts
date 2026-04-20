import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendError, sendSuccess } from "../../utils/apiResponse.js";
import * as videoService from "./video.service.js";

type VideoType = "independent" | "hospital";

function parseType(type?: string): VideoType | null {
  if (type === "independent" || type === "hospital") return type;
  return null;
}

export async function getToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const type = parseType(req.query.type as string | undefined);
    if (!type) {
      return sendError(res, "Valid type is required: independent or hospital", 400);
    }
    const data = await videoService.getVideoToken(
      req.user!.id,
      req.params.appointmentId as string,
      type
    );
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function endCall(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const type = parseType(req.query.type as string | undefined);
    if (!type) {
      return sendError(res, "Valid type is required: independent or hospital", 400);
    }
    const data = await videoService.endVideoCall(
      req.user!.id,
      req.params.appointmentId as string,
      type
    );
    return sendSuccess(res, data, "Call ended successfully");
  } catch (err) {
    next(err);
  }
}

