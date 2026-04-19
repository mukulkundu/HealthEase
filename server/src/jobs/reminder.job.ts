import cron from "node-cron";
import db from "../config/db.js";
import { sendAppointmentReminder } from "../services/email.service.js";

export function startReminderJob() {
  // Runs every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[reminder.job] Running daily appointment reminder...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    try {
      const appointments = await db.appointment.findMany({
        where: {
          date: { gte: tomorrowStart, lte: tomorrowEnd },
          status: "CONFIRMED",
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      let sent = 0;
      for (const appt of appointments) {
        try {
          await sendAppointmentReminder({
            patientName: appt.patient.name,
            patientEmail: appt.patient.email,
            doctorName: appt.doctor.user.name,
            specialization: appt.doctor.specialization,
            date: appt.date,
            startTime: appt.startTime,
            endTime: appt.endTime,
          });
          sent++;
        } catch (err) {
          console.error(`[reminder.job] Failed to send reminder for appointment ${appt.id}:`, err);
        }
      }

      console.log(`[reminder.job] Sent ${sent}/${appointments.length} reminders`);
    } catch (err) {
      console.error("[reminder.job] Failed to fetch appointments:", err);
    }
  });

  console.log("[reminder.job] Daily reminder cron job registered (08:00 AM)");
}
