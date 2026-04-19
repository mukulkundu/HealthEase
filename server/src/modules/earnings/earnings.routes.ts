import { Router } from "express";
import * as earningsController from "./earnings.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";

const router = Router();

// All earnings routes require DOCTOR auth
router.use(authenticate, authorize("DOCTOR"));

// GET /api/earnings/summary
router.get("/summary", earningsController.getSummary);

// GET /api/earnings/history?month=&year=
router.get("/history", earningsController.getHistory);

// GET /api/earnings/monthly-chart
router.get("/monthly-chart", earningsController.getMonthlyChart);

export default router;
