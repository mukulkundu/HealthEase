import client from "./client";
import type { ApiResponse, User } from "../types";

export const userApi = {
  updateProfile: async (data: {
    name?: string;
    phone?: string;
  }): Promise<User> => {
    const res = await client.patch<ApiResponse<User>>("/users/profile", data);
    return (res.data?.data ?? res.data) as User;
  },
};
