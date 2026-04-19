import client from "./client";
import type { ApiResponse, HospitalStaff } from "../types";

export const staffApi = {
  list: async (): Promise<HospitalStaff[]> => {
    const res = await client.get<ApiResponse<HospitalStaff[]>>("/staff");
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  invite: async (email: string): Promise<HospitalStaff> => {
    const res = await client.post<ApiResponse<HospitalStaff>>("/staff", { email });
    return res.data.data;
  },

  remove: async (userId: string): Promise<void> => {
    await client.delete(`/staff/${userId}`);
  },
};
