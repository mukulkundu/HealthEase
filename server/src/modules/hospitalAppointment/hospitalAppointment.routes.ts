import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./hospitalAppointment.controller.js";

const router = Router();

// Patient
router.get("/my", authenticate, authorize("PATIENT"), ctrl.getMyAppointments);
router.patch("/:id/cancel", authenticate, authorize("PATIENT"), ctrl.cancel);

// Doctor
router.get("/doctor", authenticate, authorize("DOCTOR"), ctrl.getDoctorAppointments);

// Hospital admin
router.get("/hospital", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.getHospitalAppointments);

// Receptionist
router.get("/reception", authenticate, authorize("RECEPTIONIST"), ctrl.getReceptionistAppointments);

// Status update (doctor, receptionist, admin)
router.patch("/:id/status", authenticate, authorize("DOCTOR", "RECEPTIONIST", "HOSPITAL_ADMIN"), ctrl.updateStatus);

export default router;
