import client from "./client";
import type { AuthResponse, User } from "../types";

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: "PATIENT" | "DOCTOR";
  }): Promise<AuthResponse> => {
    const res = await client.post("/auth/register", data);
    return res.data;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await client.post("/auth/login", data);
    return res.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await client.post("/auth/logout", { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await client.post("/auth/refresh", { refreshToken });
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await client.get("/auth/me");
    return res.data;
  },
};