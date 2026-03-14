import client from "./client";
import type { ApiResponse, User } from "../types";

/** Response shape when backend returns only { user } (cookie-based auth) */
export interface AuthUserResponse {
  user: User;
}

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: "PATIENT" | "DOCTOR";
  }): Promise<ApiResponse<AuthUserResponse>> => {
    const res = await client.post<ApiResponse<AuthUserResponse>>("/auth/register", data);
    return res.data;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthUserResponse>> => {
    const res = await client.post<ApiResponse<AuthUserResponse>>("/auth/login", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await client.post("/auth/logout");
  },

  refresh: async (): Promise<ApiResponse<AuthUserResponse>> => {
    const res = await client.post<ApiResponse<AuthUserResponse>>("/auth/refresh");
    return res.data;
  },

  me: async (): Promise<User | null> => {
    const res = await client.get<ApiResponse<User>>("/auth/me");
    return (res.data?.data ?? res.data?.user ?? null) as User | null;
  },
};
