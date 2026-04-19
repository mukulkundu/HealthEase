import db from "../../config/db.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendAppointmentConfirmation } from "../../services/email.service.js";

export const createOrderForAppointment = async (
  patientId: string,
  data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }
) => {
  const doctor = await db.doctorProfile.findUnique({
    where: { id: data.doctorId },
  });
  if (!doctor) throw new AppError("Doctor not found", 404);

  // Reuse the same slot conflict rules as booking
  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

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

  const amountRupees = doctor.consultationFee;
  const amountPaise = Math.round(amountRupees * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `appt_${data.doctorId}_${Date.now()}`,
    notes: {
      patientId,
      doctorId: data.doctorId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
};

export const verifyPaymentAndCreateAppointment = async (
  patientId: string,
  data: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    currency: string;
  }
) => {
  // Mock verification: accept if all payment IDs and signature are non-empty.
  // For real Razorpay, replace with crypto HMAC verification using RAZORPAY_KEY_SECRET.
  const hasValidIds =
    typeof data.razorpayOrderId === "string" &&
    data.razorpayOrderId.trim() !== "" &&
    typeof data.razorpayPaymentId === "string" &&
    data.razorpayPaymentId.trim() !== "" &&
    typeof data.razorpaySignature === "string" &&
    data.razorpaySignature.trim() !== "";
  if (!hasValidIds) {
    throw new AppError("Payment verification failed", 400);
  }

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

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
      isPaid: true,
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

  await db.payment.create({
    data: {
      appointmentId: appointment.id,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      amount: data.amount,
      currency: data.currency,
      status: "PAID",
    },
  });

  // Fire-and-forget confirmation emails
  try {
    await sendAppointmentConfirmation({
      patientName: appointment.patient.name,
      patientEmail: appointment.patient.email,
      doctorName: appointment.doctor.user.name,
      doctorEmail: appointment.doctor.user.email,
      specialization: appointment.doctor.specialization,
      consultationFee: appointment.doctor.consultationFee,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  return appointment;
};

