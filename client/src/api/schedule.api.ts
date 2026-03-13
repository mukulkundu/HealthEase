import client from "./client";
import type { Schedule, TimeSlot, DayOfWeek } from "../types";

export const scheduleApi = {
  // Public — get all schedules for a doctor
  getByDoctor: async (doctorId: string): Promise<Schedule[]> => {
    const res = await client.get(`/schedules/${doctorId}`);
    return res.data;
  },

  // Public — get available slots for a doctor on a specific date
  getAvailableSlots: async (
    doctorId: string,
    date: string // "YYYY-MM-DD"
  ): Promise<TimeSlot[]> => {
    const res = await client.get(`/schedules/${doctorId}/slots`, {
      params: { date },
    });
    return res.data;
  },

  // Doctor — create or update a schedule for a day
  upsert: async (data: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime?: number;
  }): Promise<Schedule> => {
    const res = await client.post("/schedules", data);
    return res.data;
  },

  // Doctor — delete a schedule day
  delete: async (scheduleId: string): Promise<void> => {
    await client.delete(`/schedules/${scheduleId}`);
  },
};