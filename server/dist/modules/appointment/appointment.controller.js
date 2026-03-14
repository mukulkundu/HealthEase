import * as appointmentService from "./appointment.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const bookAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, startTime, endTime, notes } = req.body;
        if (!doctorId || !date || !startTime || !endTime) {
            return sendError(res, "doctorId, date, startTime and endTime are required", 400);
        }
        if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
            return sendError(res, "startTime and endTime must be in HH:MM format", 400);
        }
        const appointment = await appointmentService.bookAppointment(req.user.id, {
            doctorId,
            date,
            startTime,
            endTime,
            notes,
        });
        return sendSuccess(res, appointment, "Appointment booked successfully", 201);
    }
    catch (err) {
        next(err);
    }
};
export const getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await appointmentService.getPatientAppointments(req.user.id);
        return sendSuccess(res, appointments);
    }
    catch (err) {
        next(err);
    }
};
export const getDoctorAppointments = async (req, res, next) => {
    try {
        const appointments = await appointmentService.getDoctorAppointments(req.user.id);
        return sendSuccess(res, appointments);
    }
    catch (err) {
        next(err);
    }
};
export const cancelAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.cancelAppointment(req.user.id, req.params.id);
        return sendSuccess(res, appointment, "Appointment cancelled successfully");
    }
    catch (err) {
        next(err);
    }
};
export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return sendError(res, "status is required", 400);
        }
        const appointment = await appointmentService.updateAppointmentStatus(req.user.id, req.params.id, status);
        return sendSuccess(res, appointment, "Appointment status updated");
    }
    catch (err) {
        next(err);
    }
};
