import client from "./client";
import type { ApiResponse, DoctorProfile, PaginatedDoctorsResponse } from "../types";

export const doctorApi = {
  getAll: async (params?: {
    name?: string;
    specialization?: string;
    minFee?: number;
    maxFee?: number;
    minExperience?: number;
    maxExperience?: number;
    minRating?: number;
    availableOn?: string;
    sortBy?: "rating" | "fee_asc" | "fee_desc" | "experience";
    page?: number;
    limit?: number;
    languages?: string[];
  }): Promise<PaginatedDoctorsResponse> => {
    const query = {
      ...params,
      ...(params?.languages?.length
        ? { languages: params.languages.join(",") }
        : { languages: undefined }),
    };
    const res = await client.get<ApiResponse<PaginatedDoctorsResponse>>("/doctors", {
      params: query,
    });

    return (
      res.data?.data ?? {
        doctors: [],
        total: 0,
        page: params?.page ?? 1,
        totalPages: 0,
        hasMore: false,
      }
    );
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
    return res.data?.data as DoctorProfile;
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
    return res.data?.data as DoctorProfile;
  },
};
