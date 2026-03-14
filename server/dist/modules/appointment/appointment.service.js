import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
export const bookAppointment = async (patientId, data) => {
    // Check doctor exists
    const doctor = await db.doctorProfile.findUnique({
        where: { id: data.doctorId },
    });
    if (!doctor)
        throw new AppError("Doctor not found", 404);
    // Check patient is not the doctor themselves
    if (doctor.userId === patientId) {
        throw new AppError("You cannot book an appointment with yourself", 400);
    }
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime()))
        throw new AppError("Invalid date format", 400);
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
    if (conflict)
        throw new AppError("This slot has already been booked", 409);
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
        },
    });
    return appointment;
};
export const getPatientAppointments = async (patientId) => {
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
        },
        orderBy: { date: "desc" },
    });
};
export const getDoctorAppointments = async (userId) => {
    const doctor = await db.doctorProfile.findUnique({ where: { userId } });
    if (!doctor)
        throw new AppError("Doctor profile not found", 404);
    return db.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
            patient: {
                select: { id: true, name: true, email: true, phone: true },
            },
        },
        orderBy: { date: "desc" },
    });
};
export const cancelAppointment = async (userId, appointmentId) => {
    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });
    if (!appointment)
        throw new AppError("Appointment not found", 404);
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
    return db.appointment.update({
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
        },
    });
};
export const updateAppointmentStatus = async (userId, appointmentId, status) => {
    const appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: { doctor: true },
    });
    if (!appointment)
        throw new AppError("Appointment not found", 404);
    // Only the doctor can update status
    if (appointment.doctor.userId !== userId) {
        throw new AppError("You are not authorized to update this appointment", 403);
    }
    const allowed = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"];
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
        },
    });
};
