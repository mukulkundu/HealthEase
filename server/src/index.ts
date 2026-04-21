import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

// Route imports (filled in as we build each module)
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import doctorRoutes from "./modules/doctor/doctor.routes.js";
import scheduleRoutes from "./modules/schedule/schedule.routes.js";
import appointmentRoutes from "./modules/appointment/appointment.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import earningsRoutes from "./modules/earnings/earnings.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import hospitalRoutes from "./modules/hospital/hospital.routes.js";
import departmentRoutes from "./modules/department/department.routes.js";
import hospitalScheduleRoutes from "./modules/hospitalSchedule/hospitalSchedule.routes.js";
import hospitalAppointmentRoutes from "./modules/hospitalAppointment/hospitalAppointment.routes.js";
import hospitalPaymentRoutes from "./modules/hospitalPayment/hospitalPayment.routes.js";
import staffRoutes from "./modules/staff/staff.routes.js";
import videoRoutes from "./modules/video/video.routes.js";
import { startReminderJob } from "./jobs/reminder.job.js";
import { startChatCleanupJob } from "./jobs/chatCleanup.job.js";

const app = express();
const httpServer = createServer(app);

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

// Socket.io server
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

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
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/earnings", earningsRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/hospital-schedules", hospitalScheduleRoutes);
app.use("/api/hospital-appointments", hospitalAppointmentRoutes);
app.use("/api/hospital-payments", hospitalPaymentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/video", videoRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler — must be last
app.use(errorMiddleware);

// Register socket handlers
import("./socket/socket.handler.js").then(({ registerSocketHandlers }) => {
  registerSocketHandlers(io);
});

// Start reminder cron job
startReminderJob();
startChatCleanupJob();

// Start server
httpServer.listen(Number(env.PORT), () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;