import client from "./client";
import type { ApiResponse, HospitalSchedule, TimeSlot, DayOfWeek } from "../types";

export const hospitalScheduleApi = {
  upsert: async (data: {
    departmentId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime?: number;
    isActive?: boolean;
  }): Promise<HospitalSchedule> => {
    const res = await client.post<ApiResponse<HospitalSchedule>>("/hospital-schedules", data);
    return res.data.data;
  },

  getMySchedules: async (departmentId: string): Promise<HospitalSchedule[]> => {
    const res = await client.get<ApiResponse<HospitalSchedule[]>>(`/hospital-schedules/my/${departmentId}`);
    return Array.isArray(res.data.data) ? res.data.data : [];
  },

  getAvailableSlots: async (doctorId: string, departmentId: string, date: string): Promise<TimeSlot[]> => {
    const res = await client.get<ApiResponse<TimeSlot[]>>(
      `/hospital-schedules/slots/${doctorId}/${departmentId}`,
      { params: { date } }
    );
    return Array.isArray(res.data.data) ? res.data.data : [];
  },
};
