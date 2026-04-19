import { Router } from "express";
import * as patientController from "./patient.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

const router = Router();

// GET /api/patients/:patientId/history — DOCTOR only
router.get(
  "/:patientId/history",
  authenticate,
  authorize("DOCTOR"),
  patientController.getPatientHistory
);

export default router;
