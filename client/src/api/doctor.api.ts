import client from "./client";
import type { DoctorProfile } from "../types";

export const doctorApi = {
  // Public — list all approved doctors, optional filters
  getAll: async (params?: {
    specialization?: string;
    name?: string;
  }): Promise<DoctorProfile[]> => {
    const res = await client.get("/doctors", { params });
    return res.data;
  },

  // Public — single doctor profile
  getById: async (id: string): Promise<DoctorProfile> => {
    const res = await client.get(`/doctors/${id}`);
    return res.data;
  },

  // Doctor — get own full profile
  getMyProfile: async (): Promise<DoctorProfile> => {
    const res = await client.get("/doctors/profile/me");
    return res.data;
  },

  // Doctor — create profile (first time setup)
  createProfile: async (data: {
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio?: string;
    avatarUrl?: string;
  }): Promise<DoctorProfile> => {
    const res = await client.post("/doctors/profile", data);
    return res.data;
  },

  // Doctor — update own profile
  updateProfile: async (data: Partial<{
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio: string;
    avatarUrl: string;
  }>): Promise<DoctorProfile> => {
    const res = await client.put("/doctors/profile", data);
    return res.data;
  },
};