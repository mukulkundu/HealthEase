import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./department.controller.js";

const router = Router();

// Public: list departments for a hospital
router.get("/hospital/:hospitalId", ctrl.listDepartments);

// Doctor: get own departments
router.get("/my", authenticate, authorize("DOCTOR"), ctrl.getMyDepartments);

// Hospital admin
router.post("/", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.createDepartment);
router.delete("/:id", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.deleteDepartment);
router.post("/:departmentId/doctors", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.addDoctorToDepartment);
router.delete("/:departmentId/doctors/:doctorId", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.removeDoctorFromDepartment);

export default router;
