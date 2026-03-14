import { Router } from "express";
import * as scheduleController from "./schedule.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
const router = Router();
// GET /api/schedules/:doctorId — public, get all schedules for a doctor
router.get("/:doctorId", scheduleController.getDoctorSchedules);
// GET /api/schedules/:doctorId/slots?date=YYYY-MM-DD — public, available slots
router.get("/:doctorId/slots", scheduleController.getAvailableSlots);
// POST /api/schedules — doctor creates or updates a day schedule
router.post("/", authenticate, authorize("DOCTOR"), scheduleController.upsertSchedule);
// DELETE /api/schedules/:scheduleId — doctor deletes a schedule day
router.delete("/:scheduleId", authenticate, authorize("DOCTOR"), scheduleController.deleteSchedule);
export default router;
