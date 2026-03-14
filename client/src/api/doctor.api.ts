import client from "./client";
import type { ApiResponse, DoctorProfile } from "../types";

export const doctorApi = {
  getAll: async (params?: {
    specialization?: string;
    name?: string;
  }): Promise<DoctorProfile[]> => {
    const res = await client.get<ApiResponse<DoctorProfile[]>>("/doctors", { params });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getById: async (id: string): Promise<DoctorProfile | null> => {
    const res = await client.get<ApiResponse<DoctorProfile>>(`/doctors/${id}`);
    return res.data?.data ?? null;
  },

  getMyProfile: async (): Promise<DoctorProfile | null> => {
    try {
      const res = await client.get<ApiResponse<DoctorProfile>>("/doctors/profile/me");
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  },

  createProfile: async (data: {
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio?: string;
    avatarUrl?: string;
  }): Promise<DoctorProfile> => {
    const res = await client.post<ApiResponse<DoctorProfile>>("/doctors/profile", data);
    return res.data.data;
  },

  updateProfile: async (data: Partial<{
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio: string;
    avatarUrl: string;
  }>): Promise<DoctorProfile> => {
    const res = await client.put<ApiResponse<DoctorProfile>>("/doctors/profile", data);
    return res.data.data;
  },
};
