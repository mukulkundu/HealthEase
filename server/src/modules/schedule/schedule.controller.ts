import type { Request, Response, NextFunction } from "express";
import * as scheduleService from "./schedule.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import type { DayOfWeek } from "@prisma/client";

const VALID_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY",
  "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const getDoctorSchedules = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schedules = await scheduleService.getDoctorSchedules(req.params.doctorId as string);
    return sendSuccess(res, schedules);
  } catch (err) {
    next(err);
  }
};

export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date } = req.query as { date?: string };

    if (!date) {
      return sendError(res, "date query parameter is required (YYYY-MM-DD)", 400);
    }

    const slots = await scheduleService.getAvailableSlots(req.params.doctorId as string, date);
    return sendSuccess(res, slots);
  } catch (err) {
    next(err);
  }
};

export const upsertSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDuration, bufferTime } = req.body;

    if (!dayOfWeek || !startTime || !endTime || !slotDuration) {
      return sendError(res, "dayOfWeek, startTime, endTime and slotDuration are required", 400);
    }

    if (!VALID_DAYS.includes(dayOfWeek)) {
      return sendError(res, `dayOfWeek must be one of: ${VALID_DAYS.join(", ")}`, 400);
    }

    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return sendError(res, "startTime and endTime must be in HH:MM format", 400);
    }

    const schedule = await scheduleService.upsertSchedule(req.user!.id, {
      dayOfWeek,
      startTime,
      endTime,
      slotDuration: Number(slotDuration),
      bufferTime: bufferTime ? Number(bufferTime) : 0,
    });

    return sendSuccess(res, schedule, "Schedule saved successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await scheduleService.deleteSchedule(req.user!.id, req.params.scheduleId as string);
    return sendSuccess(res, null, "Schedule deleted successfully");
  } catch (err) {
    next(err);
  }
};