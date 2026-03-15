import type { Response, NextFunction } from "express";
import * as appointmentService from "./appointment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import type { AppointmentStatus } from "@prisma/client";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const bookAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Direct booking is no longer allowed; appointments are created only
    // after successful payment verification via the payments module.
    return sendError(
      res,
      "Direct booking is disabled. Please use the payment flow.",
      400
    );
  } catch (err) {
    next(err);
  }
};

export const getMyAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointments = await appointmentService.getPatientAppointments(req.user!.id);
    return sendSuccess(res, appointments);
  } catch (err) {
    next(err);
  }
};

export const getDoctorAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointments = await appointmentService.getDoctorAppointments(req.user!.id);
    return sendSuccess(res, appointments);
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.user!.id,
      req.params.id as string
    );
    return sendSuccess(res, appointment, "Appointment cancelled successfully");
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    if (!status) {
      return sendError(res, "status is required", 400);
    }

    const appointment = await appointmentService.updateAppointmentStatus(
      req.user!.id,
      req.params.id as string,
      status as AppointmentStatus
    );

    return sendSuccess(res, appointment, "Appointment status updated");
  } catch (err) {
    next(err);
  }
};