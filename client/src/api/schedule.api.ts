import client from "./client";
import type { ApiResponse, Schedule, TimeSlot, DayOfWeek } from "../types";

export const scheduleApi = {
  getByDoctor: async (doctorId: string): Promise<Schedule[]> => {
    const res = await client.get<ApiResponse<Schedule[]>>(`/schedules/${doctorId}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getAvailableSlots: async (
    doctorId: string,
    date: string
  ): Promise<TimeSlot[]> => {
    const res = await client.get<ApiResponse<TimeSlot[]>>(`/schedules/${doctorId}/slots`, {
      params: { date },
    });
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  upsert: async (data: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime?: number;
  }): Promise<Schedule> => {
    const res = await client.post<ApiResponse<Schedule>>("/schedules", data);
    return res.data.data;
  },

  delete: async (scheduleId: string): Promise<void> => {
    await client.delete(`/schedules/${scheduleId}`);
  },
};
