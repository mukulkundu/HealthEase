import cron from "node-cron";
import db from "../config/db.js";
import {
  sendAppointmentReminder,
  sendVideoCallReminder,
} from "../services/email.service.js";

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

  // Runs every 15 minutes to remind about video calls.
  cron.schedule("*/15 * * * *", async () => {
    const now = new Date();
    const in15 = new Date(now.getTime() + 15 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    try {
      const appointments = await db.appointment.findMany({
        where: {
          status: "CONFIRMED",
          date: { gte: todayStart, lte: todayEnd },
          reminderSent: false,
          videoCallStarted: null,
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      for (const appt of appointments) {
        const apptTime = new Date(appt.date);
        const [h, m] = appt.startTime.split(":").map(Number);
        apptTime.setHours(h, m, 0, 0);
        const diffMs = apptTime.getTime() - in15.getTime();
        if (Math.abs(diffMs) > 10 * 60 * 1000) continue;

        await sendVideoCallReminder({
          recipientName: appt.patient.name,
          recipientEmail: appt.patient.email,
          counterpartName: `Dr. ${appt.doctor.user.name}`,
          appointmentId: appt.id,
          type: "independent",
          startTime: appt.startTime,
        });
        await sendVideoCallReminder({
          recipientName: `Dr. ${appt.doctor.user.name}`,
          recipientEmail: appt.doctor.user.email,
          counterpartName: appt.patient.name,
          appointmentId: appt.id,
          type: "independent",
          startTime: appt.startTime,
        });
        await db.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });
      }

      const hospitalAppointments = await db.hospitalAppointment.findMany({
        where: {
          status: "CONFIRMED",
          date: { gte: todayStart, lte: todayEnd },
          reminderSent: false,
          videoCallStarted: null,
        },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      for (const appt of hospitalAppointments) {
        const apptTime = new Date(appt.date);
        const [h, m] = appt.startTime.split(":").map(Number);
        apptTime.setHours(h, m, 0, 0);
        const diffMs = apptTime.getTime() - in15.getTime();
        if (Math.abs(diffMs) > 10 * 60 * 1000) continue;

        await sendVideoCallReminder({
          recipientName: appt.patient.name,
          recipientEmail: appt.patient.email,
          counterpartName: `Dr. ${appt.doctor.user.name}`,
          appointmentId: appt.id,
          type: "hospital",
          startTime: appt.startTime,
        });
        await sendVideoCallReminder({
          recipientName: `Dr. ${appt.doctor.user.name}`,
          recipientEmail: appt.doctor.user.email,
          counterpartName: appt.patient.name,
          appointmentId: appt.id,
          type: "hospital",
          startTime: appt.startTime,
        });
        await db.hospitalAppointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });
      }
    } catch (err) {
      console.error("[reminder.job] Video reminder job failed:", err);
    }
  });

  console.log("[reminder.job] Daily reminder cron job registered (08:00 AM)");
  console.log("[reminder.job] Video reminder cron job registered (every 15 minutes)");
}
