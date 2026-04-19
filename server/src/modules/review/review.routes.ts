import { Router } from "express";
import * as reviewController from "./review.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

const router = Router();

// POST /api/reviews — patient creates a review
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  reviewController.createReview
);

// GET /api/reviews/doctor/:doctorId — public, list reviews for a doctor
router.get("/doctor/:doctorId", reviewController.getDoctorReviews);

// GET /api/reviews/my — patient gets their own reviews
router.get(
  "/my",
  authenticate,
  authorize("PATIENT"),
  reviewController.getMyReviews
);

// GET /api/reviews/can-review/:appointmentId — patient checks if they can review
router.get(
  "/can-review/:appointmentId",
  authenticate,
  authorize("PATIENT"),
  reviewController.checkCanReview
);

export default router;
