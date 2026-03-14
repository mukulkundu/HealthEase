import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
import { generateSlots, markBookedSlots } from "../../utils/slots.js";
import type { DayOfWeek } from "@prisma/client";

export const getDoctorSchedules = async (doctorId: string) => {
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new AppError("Doctor not found", 404);

  return db.schedule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: "asc" },
  });
};

export const getAvailableSlots = async (doctorId: string, date: string) => {
  const doctor = await db.doctorProfile.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new AppError("Doctor not found", 404);

  // Get day of week from date string
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

  const days: DayOfWeek[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
    "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  const dayOfWeek = days[dateObj.getDay()];

  const schedule = await db.schedule.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });

  if (!schedule || !schedule.isActive) {
    return [];
  }

  // Generate all slots for this schedule
  const allSlots = generateSlots(
    schedule.startTime,
    schedule.endTime,
    schedule.slotDuration,
    schedule.bufferTime
  );

  // Get already booked start times for this doctor on this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const booked = await db.appointment.findMany({
    where: {
      doctorId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startTime: true },
  });

  const bookedStartTimes = booked.map((a) => a.startTime);
  return markBookedSlots(allSlots, bookedStartTimes);
};

export const upsertSchedule = async (
  userId: string,
  data: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime?: number;
  }
) => {
  const doctor = await db.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new AppError("Doctor profile not found. Please create your profile first.", 404);

  // Validate times
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes >= endMinutes) {
    throw new AppError("Start time must be before end time", 400);
  }

  if (data.slotDuration < 5 || data.slotDuration > 120) {
    throw new AppError("Slot duration must be between 5 and 120 minutes", 400);
  }

  // Upsert — create if not exists, update if exists
  const schedule = await db.schedule.upsert({
    where: {
      doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: data.dayOfWeek },
    },
    create: {
      doctorId: doctor.id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime ?? 0,
    },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime ?? 0,
      isActive: true,
    },
  });

  return schedule;
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  const doctor = await db.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new AppError("Doctor profile not found", 404);

  const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new AppError("Schedule not found", 404);

  if (schedule.doctorId !== doctor.id) {
    throw new AppError("You are not authorized to delete this schedule", 403);
  }

  await db.schedule.delete({ where: { id: scheduleId } });
};