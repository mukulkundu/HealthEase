import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

// Route imports (filled in as we build each module)
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import doctorRoutes from "./modules/doctor/doctor.routes.js";
import scheduleRoutes from "./modules/schedule/schedule.routes.js";
import appointmentRoutes from "./modules/appointment/appointment.routes.js";

const app = express();

// CORS — allow credentials for cookie-based auth (allow localhost + 127.0.0.1 in dev)
const allowedOrigins =
  env.NODE_ENV === "development"
    ? [env.FRONTEND_URL, "http://127.0.0.1:5173", "http://localhost:5173"]
    : [env.FRONTEND_URL];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

// Body parser & cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
  // Allow auth endpoints to stay responsive even if the app is refreshed often
  skip: (req) => req.path.startsWith("/auth"),
});
app.use("/api", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/appointments", appointmentRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler — must be last
app.use(errorMiddleware);

// Start server
app.listen(Number(env.PORT), () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;