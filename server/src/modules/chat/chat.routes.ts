import { Router } from "express";
import * as chatController from "./chat.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

// GET /api/chat/conversations — list all conversations for the current user
router.get("/conversations", authenticate, chatController.getConversations);

// GET /api/chat/:appointmentId/messages — get all messages for an appointment
router.get(
  "/:appointmentId/messages",
  authenticate,
  chatController.getMessages
);

export default router;
