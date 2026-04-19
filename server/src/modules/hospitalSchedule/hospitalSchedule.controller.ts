import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as scheduleService from "./hospitalSchedule.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { DayOfWeek } from "@prisma/client";

const VALID_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const upsertHospitalSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as Record<string, any>;
    const { departmentId, dayOfWeek, startTime, endTime, slotDuration, bufferTime, isActive } = body;
    if (!departmentId || !dayOfWeek || !startTime || !endTime || !slotDuration) {
      return sendError(res, "departmentId, dayOfWeek, startTime, endTime, slotDuration are required", 400);
    }
    if (!VALID_DAYS.includes(dayOfWeek)) return sendError(res, "Invalid dayOfWeek", 400);
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return sendError(res, "Invalid time format, use HH:MM", 400);
    }
    const schedule = await scheduleService.upsertHospitalSchedule(req.user!.id, String(departmentId), {
      dayOfWeek: dayOfWeek as DayOfWeek,
      startTime: String(startTime),
      endTime: String(endTime),
      slotDuration: Number(slotDuration),
      bufferTime: bufferTime != null ? Number(bufferTime) : 0,
      isActive: isActive != null ? Boolean(isActive) : undefined,
    });
    return sendSuccess(res, schedule, "Schedule saved");
  } catch (err) { next(err); }
};

export const getDoctorHospitalSchedules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.params.departmentId as string;
    const schedules = await scheduleService.getDoctorHospitalSchedules(req.user!.id, departmentId);
    return sendSuccess(res, schedules);
  } catch (err) { next(err); }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const departmentId = req.params.departmentId as string;
    const date = req.query.date;
    if (!date || typeof date !== "string") return sendError(res, "date query param required", 400);
    const slots = await scheduleService.getAvailableSlots(doctorId, departmentId, date);
    return sendSuccess(res, slots);
  } catch (err) { next(err); }
};
