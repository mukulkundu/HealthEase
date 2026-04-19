import client from "./client";
import type { ApiResponse, Conversation, Message } from "../types";

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await client.get<ApiResponse<Conversation[]>>("/chat/conversations");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getMessages: async (appointmentId: string): Promise<Message[]> => {
    const res = await client.get<ApiResponse<Message[]>>(`/chat/${appointmentId}/messages`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};
