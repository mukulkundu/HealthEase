import client from "./client";
import type { ApiResponse, HospitalAppointment, AppointmentStatus } from "../types";

export const hospitalAppointmentApi = {
  getMyAppointments: async (): Promise<HospitalAppointment[]> => {
    const res = await client.get<ApiResponse<HospitalAppointment[]>>("/hospital-appointments/my");
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getDoctorAppointments: async (): Promise<HospitalAppointment[]> => {
    const res = await client.get<ApiResponse<HospitalAppointment[]>>("/hospital-appointments/doctor");
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getHospitalAppointments: async (filters?: {
    status?: AppointmentStatus;
    departmentId?: string;
  }): Promise<HospitalAppointment[]> => {
    const res = await client.get<ApiResponse<HospitalAppointment[]>>("/hospital-appointments/hospital", {
      params: filters,
    });
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getReceptionistAppointments: async (filters?: {
    status?: AppointmentStatus;
    departmentId?: string;
  }): Promise<HospitalAppointment[]> => {
    const res = await client.get<ApiResponse<HospitalAppointment[]>>("/hospital-appointments/reception", {
      params: filters,
    });
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<HospitalAppointment> => {
    const res = await client.patch<ApiResponse<HospitalAppointment>>(
      `/hospital-appointments/${id}/status`,
      { status }
    );
    return res.data.data;
  },

  cancel: async (id: string): Promise<HospitalAppointment> => {
    const res = await client.patch<ApiResponse<HospitalAppointment>>(
      `/hospital-appointments/${id}/cancel`
    );
    return res.data.data;
  },
};
