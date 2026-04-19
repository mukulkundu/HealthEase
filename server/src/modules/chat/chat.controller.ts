import type { Response, NextFunction } from "express";
import * as chatService from "./chat.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const conversations = await chatService.getConversationsWithUnread(req.user!.id);
    return sendSuccess(res, conversations);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const messages = await chatService.getMessages(
      req.user!.id,
      req.params.appointmentId as string
    );
    return sendSuccess(res, messages);
  } catch (err) {
    next(err);
  }
};
