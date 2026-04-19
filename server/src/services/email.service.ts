import resend from "../config/resend.js";
import { env } from "../config/env.js";

// ─── HTML builder ────────────────────────────────────────────────────────────

function buildEmailHtml(subject: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="background:#2563eb;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">HealthEase</h1>
    <p style="color:#bfdbfe;margin:8px 0 0">Healthcare made simple</p>
  </div>
  <div style="max-width:600px;margin:0 auto;background:white;padding:32px;border-radius:0 0 8px 8px">
    ${content}
  </div>
  <div style="text-align:center;padding:24px;color:#6b7280;font-size:12px">
    <p>HealthEase - Healthcare made simple</p>
    <p>You received this email because you have an account on HealthEase</p>
  </div>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<div style="margin:24px 0">
    <a href="${href}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">${label}</a>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:14px;width:140px">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table style="border-collapse:collapse;width:100%;margin:16px 0">${rows}</table>`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function to12h(t: string): string {
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  } catch {
    return t;
  }
}

// ─── Email functions ──────────────────────────────────────────────────────────

interface AppointmentEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorEmail: string;
  specialization: string;
  consultationFee: number;
  date: string | Date;
  startTime: string;
  endTime: string;
}

export async function sendAppointmentConfirmation(data: AppointmentEmailData) {
  const timeRange = `${to12h(data.startTime)} – ${to12h(data.endTime)}`;
  const formattedDate = formatDate(data.date);
  const frontendUrl = env.FRONTEND_URL;

  // To patient
  const patientContent = `
    <h2 style="color:#111827;margin:0 0 8px">Your appointment is confirmed!</h2>
    <p style="color:#6b7280;margin:0 0 20px">Here are your appointment details:</p>
    ${infoTable(
      row("Doctor", `Dr. ${data.doctorName} (${data.specialization})`) +
      row("Date", formattedDate) +
      row("Time", timeRange) +
      row("Fee", `₹${data.consultationFee}`) +
      row("Payment", "Paid")
    )}
    ${btn("View Appointment", `${frontendUrl}/appointments`)}
  `;

  // To doctor
  const doctorContent = `
    <h2 style="color:#111827;margin:0 0 8px">You have a new appointment!</h2>
    <p style="color:#6b7280;margin:0 0 20px">A patient has booked an appointment with you.</p>
    ${infoTable(
      row("Patient", data.patientName) +
      row("Date", formattedDate) +
      row("Time", timeRange)
    )}
    ${btn("View Appointment", `${frontendUrl}/doctor/appointments`)}
  `;

  await Promise.all([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.patientEmail,
      subject: `Appointment Confirmed - Dr. ${data.doctorName}`,
      html: buildEmailHtml(`Appointment Confirmed - Dr. ${data.doctorName}`, patientContent),
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.doctorEmail,
      subject: `New Appointment - ${data.patientName}`,
      html: buildEmailHtml(`New Appointment - ${data.patientName}`, doctorContent),
    }),
  ]);
}

export async function sendAppointmentCancellation(data: AppointmentEmailData) {
  const timeRange = `${to12h(data.startTime)} – ${to12h(data.endTime)}`;
  const formattedDate = formatDate(data.date);
  const frontendUrl = env.FRONTEND_URL;

  const patientContent = `
    <h2 style="color:#111827;margin:0 0 8px">Your appointment has been cancelled</h2>
    <p style="color:#6b7280;margin:0 0 20px">The following appointment has been cancelled:</p>
    ${infoTable(
      row("Doctor", `Dr. ${data.doctorName}`) +
      row("Date", formattedDate) +
      row("Time", timeRange)
    )}
    <p style="color:#6b7280;font-size:14px">If you have any questions please contact us.</p>
    ${btn("Book Another Appointment", `${frontendUrl}/doctors`)}
  `;

  const doctorContent = `
    <h2 style="color:#111827;margin:0 0 8px">An appointment has been cancelled</h2>
    <p style="color:#6b7280;margin:0 0 20px">The following appointment was cancelled:</p>
    ${infoTable(
      row("Patient", data.patientName) +
      row("Date", formattedDate) +
      row("Time", timeRange)
    )}
  `;

  await Promise.all([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.patientEmail,
      subject: "Appointment Cancelled",
      html: buildEmailHtml("Appointment Cancelled", patientContent),
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.doctorEmail,
      subject: `Appointment Cancelled - ${data.patientName}`,
      html: buildEmailHtml(`Appointment Cancelled - ${data.patientName}`, doctorContent),
    }),
  ]);
}

interface RescheduleEmailData extends AppointmentEmailData {
  oldDate: string | Date;
  oldStartTime: string;
  oldEndTime: string;
}

export async function sendAppointmentReschedule(data: RescheduleEmailData) {
  const newTimeRange = `${to12h(data.startTime)} – ${to12h(data.endTime)}`;
  const oldTimeRange = `${to12h(data.oldStartTime)} – ${to12h(data.oldEndTime)}`;
  const newDate = formatDate(data.date);
  const oldDate = formatDate(data.oldDate);
  const frontendUrl = env.FRONTEND_URL;

  const content = (recipient: "patient" | "doctor") => `
    <h2 style="color:#111827;margin:0 0 8px">Your appointment has been rescheduled</h2>
    ${recipient === "patient"
      ? `<p style="color:#6b7280;margin:0 0 20px">Your appointment with Dr. ${data.doctorName} has been rescheduled.</p>`
      : `<p style="color:#6b7280;margin:0 0 20px">An appointment with ${data.patientName} has been rescheduled.</p>`
    }
    <p style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 4px">Previous</p>
    ${infoTable(
      row("Date", `<span style="text-decoration:line-through;color:#9ca3af">${oldDate}</span>`) +
      row("Time", `<span style="text-decoration:line-through;color:#9ca3af">${oldTimeRange}</span>`)
    )}
    <p style="color:#059669;font-size:13px;font-weight:600;margin:8px 0 4px">New</p>
    ${infoTable(
      row("Date", newDate) +
      row("Time", newTimeRange)
    )}
    ${btn("View Appointment",
      recipient === "patient"
        ? `${frontendUrl}/appointments`
        : `${frontendUrl}/doctor/appointments`
    )}
  `;

  await Promise.all([
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.patientEmail,
      subject: `Appointment Rescheduled - Dr. ${data.doctorName}`,
      html: buildEmailHtml(`Appointment Rescheduled - Dr. ${data.doctorName}`, content("patient")),
    }),
    resend.emails.send({
      from: env.EMAIL_FROM,
      to: data.doctorEmail,
      subject: `Appointment Rescheduled - ${data.patientName}`,
      html: buildEmailHtml(`Appointment Rescheduled - ${data.patientName}`, content("doctor")),
    }),
  ]);
}

interface ReminderEmailData {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  specialization: string;
  date: string | Date;
  startTime: string;
  endTime: string;
}

export async function sendAppointmentReminder(data: ReminderEmailData) {
  const timeRange = `${to12h(data.startTime)} – ${to12h(data.endTime)}`;
  const formattedDate = formatDate(data.date);
  const frontendUrl = env.FRONTEND_URL;

  const patientContent = `
    <h2 style="color:#111827;margin:0 0 8px">Your appointment is tomorrow!</h2>
    <p style="color:#6b7280;margin:0 0 20px">Don't forget your upcoming appointment:</p>
    ${infoTable(
      row("Doctor", `Dr. ${data.doctorName} (${data.specialization})`) +
      row("Date", formattedDate) +
      row("Time", timeRange)
    )}
    ${btn("View Details", `${frontendUrl}/appointments`)}
  `;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: data.patientEmail,
    subject: `Reminder: Appointment Tomorrow with Dr. ${data.doctorName}`,
    html: buildEmailHtml(`Reminder: Appointment Tomorrow with Dr. ${data.doctorName}`, patientContent),
  });
}

interface WelcomeEmailData {
  name: string;
  email: string;
  role: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const frontendUrl = env.FRONTEND_URL;
  const isDoctor = data.role === "DOCTOR";

  const subject = "Welcome to HealthEase!";
  const content = isDoctor
    ? `
        <h2 style="color:#111827;margin:0 0 8px">Welcome to HealthEase, Dr. ${data.name}!</h2>
        <p style="color:#6b7280;margin:0 0 20px">Complete your profile to start accepting patients.</p>
        ${btn("Complete Profile", `${frontendUrl}/doctor/setup-profile`)}
      `
    : `
        <h2 style="color:#111827;margin:0 0 8px">Welcome to HealthEase, ${data.name}!</h2>
        <p style="color:#6b7280;margin:0 0 20px">You can now discover doctors and book appointments instantly.</p>
        ${btn("Find a Doctor", `${frontendUrl}/doctors`)}
      `;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: data.email,
    subject,
    html: buildEmailHtml(subject, content),
  });
}
