import * as scheduleService from "./schedule.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
const VALID_DAYS = [
    "MONDAY", "TUESDAY", "WEDNESDAY",
    "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const getDoctorSchedules = async (req, res, next) => {
    try {
        const schedules = await scheduleService.getDoctorSchedules(req.params.doctorId);
        return sendSuccess(res, schedules);
    }
    catch (err) {
        next(err);
    }
};
export const getAvailableSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        if (!date) {
            return sendError(res, "date query parameter is required (YYYY-MM-DD)", 400);
        }
        const slots = await scheduleService.getAvailableSlots(req.params.doctorId, date);
        return sendSuccess(res, slots);
    }
    catch (err) {
        next(err);
    }
};
export const upsertSchedule = async (req, res, next) => {
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
        const schedule = await scheduleService.upsertSchedule(req.user.id, {
            dayOfWeek,
            startTime,
            endTime,
            slotDuration: Number(slotDuration),
            bufferTime: bufferTime ? Number(bufferTime) : 0,
        });
        return sendSuccess(res, schedule, "Schedule saved successfully");
    }
    catch (err) {
        next(err);
    }
};
export const deleteSchedule = async (req, res, next) => {
    try {
        await scheduleService.deleteSchedule(req.user.id, req.params.scheduleId);
        return sendSuccess(res, null, "Schedule deleted successfully");
    }
    catch (err) {
        next(err);
    }
};
