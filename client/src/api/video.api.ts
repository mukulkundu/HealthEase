import client from "./client";
import type { ApiResponse } from "../types";

type VideoType = "independent" | "hospital";

interface VideoTokenResponse {
  token: string;
  roomUrl: string;
  roomName: string;
}

export const videoApi = {
  getToken: async (appointmentId: string, type: VideoType): Promise<VideoTokenResponse> => {
    const res = await client.get<ApiResponse<VideoTokenResponse>>(
      `/video/${appointmentId}/token`,
      { params: { type } }
    );
    return res.data.data;
  },

  endCall: async (appointmentId: string, type: VideoType) => {
    const res = await client.post<ApiResponse<unknown>>(
      `/video/${appointmentId}/end`,
      undefined,
      { params: { type } }
    );
    return res.data.data;
  },
};

