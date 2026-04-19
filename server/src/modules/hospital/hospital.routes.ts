import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./hospital.controller.js";

const router = Router();

// Public
router.get("/", ctrl.listHospitals);
router.get("/:id", ctrl.getHospitalById);

// Hospital admin
router.post("/", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.createHospital);
router.get("/admin/me", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.getMyHospital);
router.patch("/admin/me", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.updateHospital);

// Receptionist
router.get("/staff/my-hospital", authenticate, authorize("RECEPTIONIST"), ctrl.getHospitalForStaff);

export default router;
