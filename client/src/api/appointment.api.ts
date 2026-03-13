import client from "./client";
import type { Appointment, AppointmentStatus } from "../types";

export const appointmentApi = {
  // Patient — book an appointment
  book: async (data: {
    doctorId: string;
    date: string; // "YYYY-MM-DD"
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<Appointment> => {
    const res = await client.post("/appointments", data);
    return res.data;
  },

  // Patient — get own appointments
  getMyAppointments: async (): Promise<Appointment[]> => {
    const res = await client.get("/appointments/my");
    return res.data;
  },

  // Doctor — get own appointments
  getDoctorAppointments: async (): Promise<Appointment[]> => {
    const res = await client.get("/appointments/doctor");
    return res.data;
  },

  // Patient or Doctor — cancel an appointment
  cancel: async (id: string): Promise<Appointment> => {
    const res = await client.patch(`/appointments/${id}/cancel`);
    return res.data;
  },

  // Doctor — update appointment status
  updateStatus: async (
    id: string,
    status: AppointmentStatus
  ): Promise<Appointment> => {
    const res = await client.patch(`/appointments/${id}/status`, { status });
    return res.data;
  },
};