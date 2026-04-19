import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { AppointmentStatus } from "@prisma/client";
import {
  sendAppointmentCancellation,
  sendAppointmentReschedule,
} from "../../services/email.service.js";

export const bookAppointment = async (
  patientId: string,
  data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }
) => {
  // Check doctor exists
  const doctor = await db.doctorProfile.findUnique({
    where: { id: data.doctorId },
  });
  if (!doctor) throw new AppError("Doctor not found", 404);

  // Check patient is not the doctor themselves
  if (doctor.userId === patientId) {
    throw new AppError("You cannot book an appointment with yourself", 400);
  }

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

  // Check slot is not already booked
  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await db.appointment.findFirst({
    where: {
      doctorId: data.doctorId,
      date: { gte: startOfDay, lte: endOfDay },
      startTime: data.startTime,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  if (conflict) throw new AppError("This slot has already been booked", 409);

  const appointment = await db.appointment.create({
    data: {
      patientId,
      doctorId: data.doctorId,
      date: dateObj,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
    },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
  });

  return appointment;
};

export const getPatientAppointments = async (patientId: string) => {
  return db.appointment.findMany({
    where: { patientId },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
};

export const getDoctorAppointments = async (userId: string) => {
  const doctor = await db.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new AppError("Doctor profile not found", 404);

  return db.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
};

export const cancelAppointment = async (userId: string, appointmentId: string) => {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  // Only the patient or the doctor can cancel
  const isPatient = appointment.patientId === userId;
  const isDoctor = appointment.doctor.userId === userId;

  if (!isPatient && !isDoctor) {
    throw new AppError("You are not authorized to cancel this appointment", 403);
  }

  if (appointment.status === "CANCELLED") {
    throw new AppError("Appointment is already cancelled", 400);
  }

  if (appointment.status === "COMPLETED") {
    throw new AppError("Cannot cancel a completed appointment", 400);
  }

  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
  });

  // Fire-and-forget cancellation emails
  try {
    await sendAppointmentCancellation({
      patientName: updated.patient.name,
      patientEmail: updated.patient.email,
      doctorName: updated.doctor.user.name,
      doctorEmail: updated.doctor.user.email,
      specialization: updated.doctor.specialization,
      consultationFee: updated.doctor.consultationFee,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
    });
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
  }

  return updated;
};

export const rescheduleAppointment = async (
  patientId: string,
  appointmentId: string,
  data: { date: string; startTime: string; endTime: string }
) => {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.patientId !== patientId)
    throw new AppError("You are not authorized to reschedule this appointment", 403);

  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED")
    throw new AppError("Only PENDING or CONFIRMED appointments can be rescheduled", 400);

  if (appointment.rescheduleCount >= 2)
    throw new AppError("You have reached the maximum number of reschedules for this appointment", 400);

  const newDateObj = new Date(data.date);
  if (isNaN(newDateObj.getTime())) throw new AppError("Invalid date format", 400);

  const now = new Date();
  if (newDateObj <= now) throw new AppError("New date must be in the future", 400);

  // Cannot reschedule to same date and time
  const existingDate = new Date(appointment.date).toISOString().split("T")[0];
  if (existingDate === data.date && appointment.startTime === data.startTime)
    throw new AppError("Cannot reschedule to the same date and time", 400);

  // Check slot is available (not booked by another patient)
  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await db.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      date: { gte: startOfDay, lte: endOfDay },
      startTime: data.startTime,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: { not: appointmentId },
    },
  });
  if (conflict) throw new AppError("This slot has already been booked", 409);

  // Check new slot exists in doctor's schedule
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = dayNames[newDateObj.getDay()];

  const schedule = await db.schedule.findFirst({
    where: {
      doctorId: appointment.doctorId,
      dayOfWeek: dayOfWeek as import("@prisma/client").DayOfWeek,
      isActive: true,
    },
  });
  if (!schedule) throw new AppError("Doctor is not available on this day", 400);

  const [schStartH, schStartM] = schedule.startTime.split(":").map(Number);
  const [schEndH, schEndM] = schedule.endTime.split(":").map(Number);
  const [slotH, slotM] = data.startTime.split(":").map(Number);
  const schStartMins = schStartH * 60 + schStartM;
  const schEndMins = schEndH * 60 + schEndM;
  const slotMins = slotH * 60 + slotM;

  if (slotMins < schStartMins || slotMins >= schEndMins)
    throw new AppError("Selected time slot is outside the doctor's schedule", 400);

  const oldDate = appointment.date;
  const oldStartTime = appointment.startTime;
  const oldEndTime = appointment.endTime;

  const rescheduled = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      date: newDateObj,
      startTime: data.startTime,
      endTime: data.endTime,
      rescheduledAt: new Date(),
      originalDate: appointment.originalDate ?? appointment.date,
      originalStartTime: appointment.originalStartTime ?? appointment.startTime,
      rescheduleCount: { increment: 1 },
    },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
  });

  // Fire-and-forget reschedule emails
  try {
    await sendAppointmentReschedule({
      patientName: rescheduled.patient.name,
      patientEmail: rescheduled.patient.email,
      doctorName: rescheduled.doctor.user.name,
      doctorEmail: rescheduled.doctor.user.email,
      specialization: rescheduled.doctor.specialization,
      consultationFee: rescheduled.doctor.consultationFee,
      date: rescheduled.date,
      startTime: rescheduled.startTime,
      endTime: rescheduled.endTime,
      oldDate,
      oldStartTime,
      oldEndTime,
    });
  } catch (err) {
    console.error("Failed to send reschedule email:", err);
  }

  return rescheduled;
};

export const updateAppointmentStatus = async (
  userId: string,
  appointmentId: string,
  status: AppointmentStatus
) => {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  // Only the doctor can update status
  if (appointment.doctor.userId !== userId) {
    throw new AppError("You are not authorized to update this appointment", 403);
  }

  const allowed: AppointmentStatus[] = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"];
  if (!allowed.includes(status)) {
    throw new AppError(`Status must be one of: ${allowed.join(", ")}`, 400);
  }

  return db.appointment.update({
    where: { id: appointmentId },
    data: { status },
    include: {
      patient: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
  });
};