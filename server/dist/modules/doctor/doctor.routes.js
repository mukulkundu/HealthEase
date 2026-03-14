import { Router } from "express";
import * as doctorController from "./doctor.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
const router = Router();
// GET /api/doctors — public list with optional filters
router.get("/", doctorController.getAllDoctors);
// GET /api/doctors/profile/me — must be before /:id to avoid conflict
router.get("/profile/me", authenticate, authorize("DOCTOR"), doctorController.getMyProfile);
// GET /api/doctors/:id — public single doctor
router.get("/:id", doctorController.getDoctorById);
// POST /api/doctors/profile — create profile
router.post("/profile", authenticate, authorize("DOCTOR"), doctorController.createProfile);
// PUT /api/doctors/profile — update profile
router.put("/profile", authenticate, authorize("DOCTOR"), doctorController.updateProfile);
export default router;
