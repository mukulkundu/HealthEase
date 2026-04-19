import client from "./client";
import type { ApiResponse, AppointmentStatus } from "../types";

export interface PatientHistoryAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  isPaid: boolean;
  review: { rating: number; comment?: string | null } | null;
}

export interface RecentHistoryAppointment {
  id: string;
  date: string;
  startTime: string;
  status: AppointmentStatus;
  doctorSpecialization: string;
  notes?: string | null;
}

export interface PatientHistory {
  patient: { id: string; name: string; phone?: string | null };
  totalAppointments: number;
  completedAppointments: number;
  historyWithThisDoctor: PatientHistoryAppointment[];
  recentHistory: RecentHistoryAppointment[];
}

export const patientApi = {
  getPatientHistory: async (patientId: string): Promise<PatientHistory> => {
    const res = await client.get<ApiResponse<PatientHistory>>(
      `/patients/${patientId}/history`
    );
    return res.data.data;
  },
};
