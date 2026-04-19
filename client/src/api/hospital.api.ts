import client from "./client";
import type { ApiResponse, Hospital } from "../types";

export const hospitalApi = {
  listHospitals: async (q?: string): Promise<Hospital[]> => {
    const res = await client.get<ApiResponse<Hospital[]>>("/hospitals", { params: q ? { q } : {} });
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getById: async (id: string): Promise<Hospital> => {
    const res = await client.get<ApiResponse<Hospital>>(`/hospitals/${id}`);
    return res.data.data;
  },

  getMyHospital: async (): Promise<Hospital> => {
    const res = await client.get<ApiResponse<Hospital>>("/hospitals/admin/me");
    return res.data.data;
  },

  create: async (data: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    website?: string;
    description?: string;
  }): Promise<Hospital> => {
    const res = await client.post<ApiResponse<Hospital>>("/hospitals", data);
    return res.data.data;
  },

  update: async (data: Partial<Hospital>): Promise<Hospital> => {
    const res = await client.patch<ApiResponse<Hospital>>("/hospitals/admin/me", data);
    return res.data.data;
  },

  getHospitalForStaff: async (): Promise<Hospital> => {
    const res = await client.get<ApiResponse<Hospital>>("/hospitals/staff/my-hospital");
    return res.data.data;
  },
};
