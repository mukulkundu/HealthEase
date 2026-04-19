import { Router } from "express";
import * as appointmentController from "./appointment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

const router = Router();

// POST /api/appointments — patient books an appointment
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  appointmentController.bookAppointment
);

// GET /api/appointments/my — patient gets own appointments
router.get(
  "/my",
  authenticate,
  authorize("PATIENT"),
  appointmentController.getMyAppointments
);

// GET /api/appointments/doctor — doctor gets own appointments
router.get(
  "/doctor",
  authenticate,
  authorize("DOCTOR"),
  appointmentController.getDoctorAppointments
);

// PATCH /api/appointments/:id/reschedule — patient reschedules
router.patch(
  "/:id/reschedule",
  authenticate,
  authorize("PATIENT"),
  appointmentController.rescheduleAppointment
);

// PATCH /api/appointments/:id/cancel — patient or doctor cancels
router.patch(
  "/:id/cancel",
  authenticate,
  appointmentController.cancelAppointment
);

// PATCH /api/appointments/:id/status — doctor updates status
router.patch(
  "/:id/status",
  authenticate,
  authorize("DOCTOR"),
  appointmentController.updateAppointmentStatus
);

export default router;