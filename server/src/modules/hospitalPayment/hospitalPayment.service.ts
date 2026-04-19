import prisma from "../../config/db.js";
import { razorpay } from "../../config/razorpay.js";
import { AppError } from "../../middleware/error.middleware.js";

export const createOrderForHospitalAppointment = async (
  patientId: string,
  data: {
    doctorId: string;
    departmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }
) => {
  const deptDoctor = await prisma.departmentDoctor.findUnique({
    where: { doctorId_departmentId: { doctorId: data.doctorId, departmentId: data.departmentId } },
    include: { department: { include: { hospital: true } } },
  });
  if (!deptDoctor || !deptDoctor.isActive) throw new AppError("Doctor not available in this department", 404);

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await prisma.hospitalAppointment.findFirst({
    where: {
      doctorId: data.doctorId,
      departmentId: data.departmentId,
      date: { gte: startOfDay, lte: endOfDay },
      startTime: data.startTime,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflict) throw new AppError("This slot has already been booked", 409);

  const amountPaise = Math.round(deptDoctor.consultationFee * 100);
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `happt_${data.doctorId}_${Date.now()}`,
  } as Parameters<typeof razorpay.orders.create>[0]);

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    hospitalId: deptDoctor.department.hospitalId,
    consultationFee: deptDoctor.consultationFee,
  };
};

export const verifyPaymentAndCreateHospitalAppointment = async (
  patientId: string,
  data: {
    doctorId: string;
    departmentId: string;
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
  const hasValidIds =
    typeof data.razorpayOrderId === "string" && data.razorpayOrderId.trim() !== "" &&
    typeof data.razorpayPaymentId === "string" && data.razorpayPaymentId.trim() !== "" &&
    typeof data.razorpaySignature === "string" && data.razorpaySignature.trim() !== "";
  if (!hasValidIds) throw new AppError("Payment verification failed", 400);

  const deptDoctor = await prisma.departmentDoctor.findUnique({
    where: { doctorId_departmentId: { doctorId: data.doctorId, departmentId: data.departmentId } },
    include: { department: true },
  });
  if (!deptDoctor || !deptDoctor.isActive) throw new AppError("Doctor not available in this department", 404);

  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) throw new AppError("Invalid date format", 400);

  const startOfDay = new Date(data.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(data.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await prisma.hospitalAppointment.findFirst({
    where: {
      doctorId: data.doctorId,
      departmentId: data.departmentId,
      date: { gte: startOfDay, lte: endOfDay },
      startTime: data.startTime,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflict) throw new AppError("This slot has already been booked", 409);

  const appointment = await prisma.hospitalAppointment.create({
    data: {
      patientId,
      doctorId: data.doctorId,
      departmentId: data.departmentId,
      hospitalId: deptDoctor.department.hospitalId,
      date: dateObj,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
      isPaid: true,
      status: "PENDING",
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      patient: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      hospital: { select: { id: true, name: true } },
    },
  });

  await prisma.hospitalPayment.create({
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

  return appointment;
};
