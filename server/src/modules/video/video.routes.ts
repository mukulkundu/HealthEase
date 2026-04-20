import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as videoController from "./video.controller.js";

const router = Router();

router.get(
  "/:appointmentId/token",
  authenticate,
  authorize("PATIENT", "DOCTOR"),
  videoController.getToken
);

router.post(
  "/:appointmentId/end",
  authenticate,
  authorize("PATIENT", "DOCTOR"),
  videoController.endCall
);

export default router;

