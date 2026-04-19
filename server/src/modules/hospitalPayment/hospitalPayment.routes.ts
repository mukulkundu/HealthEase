import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as ctrl from "./hospitalPayment.controller.js";

const router = Router();

router.post("/order", authenticate, authorize("PATIENT"), ctrl.createOrder);
router.post("/verify", authenticate, authorize("PATIENT"), ctrl.verifyPayment);

export default router;
