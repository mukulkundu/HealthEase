import type { Appointment, HospitalAppointment } from "../types";

type CallableAppointment = Pick<Appointment, "date" | "startTime"> | Pick<HospitalAppointment, "date" | "startTime">;

export function getAppointmentStart(date: string, startTime: string) {
  const start = new Date(date);
  const [h, m] = startTime.split(":").map(Number);
  start.setHours(h, m, 0, 0);
  return start;
}

export function isCallJoinable(appointment: CallableAppointment) {
  const start = getAppointmentStart(appointment.date, appointment.startTime);
  const now = new Date();
  const startWindow = new Date(start.getTime() - 30 * 60 * 1000);
  const endWindow = new Date(start.getTime() + 60 * 60 * 1000);
  return now >= startWindow && now <= endWindow;
}

export function isCallNotStartedYet(appointment: CallableAppointment) {
  const start = getAppointmentStart(appointment.date, appointment.startTime);
  const now = new Date();
  return now < new Date(start.getTime() - 30 * 60 * 1000);
}

