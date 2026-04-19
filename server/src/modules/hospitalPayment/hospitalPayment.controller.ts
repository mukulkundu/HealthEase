import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as paymentService from "./hospitalPayment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, departmentId, date, startTime, endTime, notes } = req.body;
    if (!doctorId || !departmentId || !date || !startTime || !endTime) {
      return sendError(res, "doctorId, departmentId, date, startTime and endTime are required", 400);
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return sendError(res, "Invalid time format, use HH:MM", 400);
    }
    const order = await paymentService.createOrderForHospitalAppointment(req.user!.id, {
      doctorId, departmentId, date, startTime, endTime, notes,
    });
    return sendSuccess(res, order, "Order created");
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      doctorId, departmentId, date, startTime, endTime, notes,
      razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency,
    } = req.body;
    if (!doctorId || !departmentId || !date || !startTime || !endTime ||
        !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return sendError(res, "Missing required payment fields", 400);
    }
    const appointment = await paymentService.verifyPaymentAndCreateHospitalAppointment(req.user!.id, {
      doctorId, departmentId, date, startTime, endTime, notes,
      razorpayOrderId, razorpayPaymentId, razorpaySignature,
      amount: Number(amount), currency: currency || "INR",
    });
    return sendSuccess(res, appointment, "Appointment booked successfully", 201);
  } catch (err) { next(err); }
};
