import prisma from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
import { generateSlots, markBookedSlots } from "../../utils/slots.js";
import type { DayOfWeek } from "@prisma/client";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export async function upsertHospitalSchedule(
  doctorUserId: string,
  departmentId: string,
  data: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime?: number;
    isActive?: boolean;
  }
) {
  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!doctorProfile) throw new AppError("Doctor profile not found", 404);

  const link = await prisma.departmentDoctor.findUnique({
    where: { doctorId_departmentId: { doctorId: doctorProfile.id, departmentId } },
  });
  if (!link || !link.isActive) throw new AppError("Not associated with this department", 403);

  return prisma.hospitalSchedule.upsert({
    where: {
      doctorId_departmentId_dayOfWeek: {
        doctorId: doctorProfile.id,
        departmentId,
        dayOfWeek: data.dayOfWeek,
      },
    },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime ?? 0,
      isActive: data.isActive ?? true,
    },
    create: {
      doctorId: doctorProfile.id,
      departmentId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime ?? 0,
    },
  });
}

export async function getDoctorHospitalSchedules(doctorUserId: string, departmentId: string) {
  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!doctorProfile) throw new AppError("Doctor profile not found", 404);

  return prisma.hospitalSchedule.findMany({
    where: { doctorId: doctorProfile.id, departmentId },
    orderBy: { dayOfWeek: "asc" },
  });
}

export async function getAvailableSlots(
  doctorProfileId: string,
  departmentId: string,
  dateStr: string
) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new AppError("Invalid date", 400);

  const dayOfWeek = DAYS[date.getDay()] as DayOfWeek;

  const schedule = await prisma.hospitalSchedule.findUnique({
    where: {
      doctorId_departmentId_dayOfWeek: {
        doctorId: doctorProfileId,
        departmentId,
        dayOfWeek,
      },
    },
  });

  if (!schedule || !schedule.isActive) return [];

  const slots = generateSlots(
    schedule.startTime,
    schedule.endTime,
    schedule.slotDuration,
    schedule.bufferTime
  );

  const booked = await prisma.hospitalAppointment.findMany({
    where: {
      doctorId: doctorProfileId,
      departmentId,
      date: {
        gte: new Date(date.toISOString().split("T")[0]),
        lt: new Date(new Date(date.toISOString().split("T")[0]).getTime() + 86400000),
      },
      status: { notIn: ["CANCELLED"] },
    },
    select: { startTime: true },
  });

  return markBookedSlots(slots, booked.map((b: { startTime: string }) => b.startTime));
}
