import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./staff.controller.js";

const router = Router();

router.get("/", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.listStaff);
router.post("/", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.inviteStaff);
router.delete("/:userId", authenticate, authorize("HOSPITAL_ADMIN"), ctrl.removeStaff);

export default router;
