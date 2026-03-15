import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import * as paymentService from "./payment.service.js";

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doctorId, date, startTime, endTime, notes } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return sendError(res, "doctorId, date, startTime and endTime are required", 400);
    }

    const order = await paymentService.createOrderForAppointment(req.user!.id, {
      doctorId,
      date,
      startTime,
      endTime,
      notes,
    });

    return sendSuccess(res, order, "Payment order created");
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      doctorId,
      date,
      startTime,
      endTime,
      notes,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount: amountRaw,
      currency,
    } = req.body;

    const amount = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
    if (
      !doctorId ||
      !date ||
      !startTime ||
      !endTime ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !currency
    ) {
      return sendError(res, "Missing required payment verification fields", 400);
    }

    const appointment = await paymentService.verifyPaymentAndCreateAppointment(req.user!.id, {
      doctorId,
      date,
      startTime,
      endTime,
      notes,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      currency,
    });

    return sendSuccess(res, appointment, "Payment verified and appointment created", 201);
  } catch (err) {
    next(err);
  }
};

