import client from "./client";
import type { ApiResponse, Appointment, AppointmentStatus } from "../types";

export const appointmentApi = {
  // Patient — book an appointment
  book: async (data: {
    doctorId: string;
    date: string; // "YYYY-MM-DD"
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<Appointment> => {
    const res = await client.post<ApiResponse<Appointment>>("/appointments", data);
    return res.data.data;
  },

  // Patient — get own appointments
  getMyAppointments: async (): Promise<Appointment[]> => {
    const res = await client.get<ApiResponse<Appointment[]>>("/appointments/my");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Doctor — get own appointments
  getDoctorAppointments: async (): Promise<Appointment[]> => {
    const res = await client.get<ApiResponse<Appointment[]>>("/appointments/doctor");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Patient or Doctor — cancel an appointment
  cancel: async (id: string): Promise<Appointment> => {
    const res = await client.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`);
    return res.data.data;
  },

  // Doctor — update appointment status
  updateStatus: async (
    id: string,
    status: AppointmentStatus
  ): Promise<Appointment> => {
    const res = await client.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
    return res.data.data;
  },

  // Patient — reschedule an appointment
  reschedule: async (
    id: string,
    data: { date: string; startTime: string; endTime: string }
  ): Promise<Appointment> => {
    const res = await client.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, data);
    return res.data.data;
  },
};