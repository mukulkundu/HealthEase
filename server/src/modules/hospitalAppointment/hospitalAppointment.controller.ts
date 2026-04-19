import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as apptService from "./hospitalAppointment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AppointmentStatus } from "@prisma/client";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export const getMyAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointments = await apptService.getPatientHospitalAppointments(req.user!.id);
    return sendSuccess(res, appointments);
  } catch (err) { next(err); }
};

export const getDoctorAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointments = await apptService.getDoctorHospitalAppointments(req.user!.id);
    return sendSuccess(res, appointments);
  } catch (err) { next(err); }
};

export const getHospitalAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as AppointmentStatus | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const appointments = await apptService.getHospitalAppointments(req.user!.id, {
      status: status && VALID_STATUSES.includes(status) ? status : undefined,
      departmentId,
    });
    return sendSuccess(res, appointments);
  } catch (err) { next(err); }
};

export const getReceptionistAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as AppointmentStatus | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const appointments = await apptService.getReceptionistAppointments(req.user!.id, {
      status: status && VALID_STATUSES.includes(status) ? status : undefined,
      departmentId,
    });
    return sendSuccess(res, appointments);
  } catch (err) { next(err); }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return sendError(res, "Valid status required", 400);
    }
    const appointment = await apptService.updateHospitalAppointmentStatus(
      req.user!.id,
      req.user!.role,
      req.params.id as string,
      status as AppointmentStatus
    );
    return sendSuccess(res, appointment, "Status updated");
  } catch (err) { next(err); }
};

export const cancel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = await apptService.cancelHospitalAppointment(req.user!.id, req.params.id as string);
    return sendSuccess(res, appointment, "Appointment cancelled");
  } catch (err) { next(err); }
};
