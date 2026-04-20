import client from "./client";
import type { ApiResponse, Hospital, PaginatedHospitalsResponse } from "../types";

export const hospitalApi = {
  listHospitals: async (params?: {
    q?: string;
    name?: string;
    city?: string;
    state?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedHospitalsResponse> => {
    const res = await client.get<ApiResponse<PaginatedHospitalsResponse>>("/hospitals", {
      params: params ?? {},
    });
    return (
      res.data.data ?? {
        hospitals: [],
        total: 0,
        page: params?.page ?? 1,
        totalPages: 0,
        hasMore: false,
      }
    );
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
