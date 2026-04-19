import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./hospitalSchedule.controller.js";

const router = Router();

// Public: get available slots
router.get("/slots/:doctorId/:departmentId", ctrl.getAvailableSlots);

// Doctor: manage own hospital schedules
router.post("/", authenticate, authorize("DOCTOR"), ctrl.upsertHospitalSchedule);
router.get("/my/:departmentId", authenticate, authorize("DOCTOR"), ctrl.getDoctorHospitalSchedules);

export default router;
