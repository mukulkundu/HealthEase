import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = Router();
// POST /api/auth/register
router.post("/register", authController.register);
// POST /api/auth/login
router.post("/login", authController.login);
// POST /api/auth/refresh
router.post("/refresh", authController.refresh);
// POST /api/auth/logout
router.post("/logout", authController.logout);
// GET /api/auth/me
router.get("/me", authenticate, authController.me);
export default router;
