import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import * as paymentController from "./payment.controller.js";

const router = Router();

// POST /api/payments/create-order — create Razorpay order for appointment
router.post(
  "/create-order",
  authenticate,
  authorize("PATIENT"),
  paymentController.createOrder
);

// POST /api/payments/verify — verify Razorpay payment and create appointment
router.post(
  "/verify",
  authenticate,
  authorize("PATIENT"),
  paymentController.verifyPayment
);

export default router;

