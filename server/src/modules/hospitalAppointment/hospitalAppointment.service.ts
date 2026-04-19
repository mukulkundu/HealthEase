import prisma from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { AppointmentStatus } from "@prisma/client";

export async function getPatientHospitalAppointments(patientId: string) {
  return prisma.hospitalAppointment.findMany({
    where: { patientId },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      department: { select: { id: true, name: true } },
      hospital: { select: { id: true, name: true, city: true } },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function getDoctorHospitalAppointments(doctorUserId: string) {
  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!doctorProfile) throw new AppError("Doctor profile not found", 404);

  return prisma.hospitalAppointment.findMany({
    where: { doctorId: doctorProfile.id },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      department: { select: { id: true, name: true } },
      hospital: { select: { id: true, name: true } },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function getHospitalAppointments(adminId: string, filters?: {
  status?: AppointmentStatus;
  departmentId?: string;
}) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found", 404);

  return prisma.hospitalAppointment.findMany({
    where: {
      hospitalId: hospital.id,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      department: { select: { id: true, name: true } },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function getReceptionistAppointments(userId: string, filters?: {
  status?: AppointmentStatus;
  departmentId?: string;
}) {
  const staff = await prisma.hospitalStaff.findUnique({ where: { userId } });
  if (!staff) throw new AppError("Not associated with any hospital", 404);

  return prisma.hospitalAppointment.findMany({
    where: {
      hospitalId: staff.hospitalId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      department: { select: { id: true, name: true } },
      payment: true,
    },
    orderBy: { date: "desc" },
  });
}

export async function updateHospitalAppointmentStatus(
  userId: string,
  role: string,
  appointmentId: string,
  status: AppointmentStatus
) {
  const appointment = await prisma.hospitalAppointment.findUnique({
    where: { id: appointmentId },
    include: { hospital: true },
  });
  if (!appointment) throw new AppError("Appointment not found", 404);

  if (role === "DOCTOR") {
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (!doctorProfile || appointment.doctorId !== doctorProfile.id) {
      throw new AppError("Forbidden", 403);
    }
  } else if (role === "RECEPTIONIST") {
    const staff = await prisma.hospitalStaff.findUnique({ where: { userId } });
    if (!staff || staff.hospitalId !== appointment.hospitalId) {
      throw new AppError("Forbidden", 403);
    }
  } else if (role === "HOSPITAL_ADMIN") {
    const hospital = await prisma.hospital.findUnique({ where: { adminId: userId } });
    if (!hospital || hospital.id !== appointment.hospitalId) {
      throw new AppError("Forbidden", 403);
    }
  }

  return prisma.hospitalAppointment.update({
    where: { id: appointmentId },
    data: { status },
  });
}

export async function cancelHospitalAppointment(patientId: string, appointmentId: string) {
  const appointment = await prisma.hospitalAppointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.patientId !== patientId) throw new AppError("Forbidden", 403);
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new AppError("Cannot cancel this appointment", 400);
  }
  return prisma.hospitalAppointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });
}
