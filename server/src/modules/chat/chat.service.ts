import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

const CHAT_RETENTION_DAYS = 3;
const CHAT_EXPIRY_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const getChatExpiryDate = (appointmentDate: Date) =>
  new Date(appointmentDate.getTime() + CHAT_EXPIRY_MS);

export const isChatExpired = (appointmentDate: Date) =>
  Date.now() > getChatExpiryDate(appointmentDate).getTime();

export const getConversations = async (userId: string) => {
  // Find all CONFIRMED or COMPLETED appointments where the user is patient or doctor
  const appointments = await db.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      date: { gte: new Date(Date.now() - CHAT_EXPIRY_MS) },
      OR: [
        { patientId: userId },
        { doctor: { userId } },
      ],
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { date: "desc" },
  });

  return appointments.map((appt) => {
    const isPatient = appt.patientId === userId;
    const otherUser = isPatient
      ? { id: appt.doctor.user.id, name: appt.doctor.user.name }
      : { id: appt.patient.id, name: appt.patient.name };

    const lastMsg = appt.messages[0] ?? null;

    // Count unread messages sent by the other user
    return {
      appointmentId: appt.id,
      otherUser,
      lastMessage: lastMsg?.content ?? null,
      lastMessageTime: lastMsg?.createdAt ?? null,
      appointmentStatus: appt.status,
      appointmentDate: appt.date,
    };
  });
};

export const getConversationsWithUnread = async (userId: string) => {
  const appointments = await db.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      date: { gte: new Date(Date.now() - CHAT_EXPIRY_MS) },
      OR: [
        { patientId: userId },
        { doctor: { userId } },
      ],
    },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { date: "desc" },
  });

  const result = await Promise.all(
    appointments.map(async (appt) => {
      const isPatient = appt.patientId === userId;
      const otherUser = isPatient
        ? { id: appt.doctor.user.id, name: appt.doctor.user.name }
        : { id: appt.patient.id, name: appt.patient.name };

      const lastMsg = appt.messages[0] ?? null;

      const unreadCount = await db.message.count({
        where: {
          appointmentId: appt.id,
          receiverId: userId,
          isRead: false,
        },
      });

      return {
        appointmentId: appt.id,
        otherUser,
        lastMessage: lastMsg?.content ?? null,
        lastMessageTime: lastMsg?.createdAt ?? null,
        unreadCount,
        appointmentStatus: appt.status,
        appointmentDate: appt.date,
      };
    })
  );

  return result;
};

export const getMessages = async (userId: string, appointmentId: string) => {
  // Verify user is part of this appointment
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: { select: { userId: true } } },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);

  const isPatient = appointment.patientId === userId;
  const isDoctor = appointment.doctor.userId === userId;

  if (!isPatient && !isDoctor) {
    throw new AppError("You are not authorized to view these messages", 403);
  }

  if (isChatExpired(appointment.date)) {
    throw new AppError(
      "Chat is no longer available for this appointment. Chats expire 3 days after the appointment date.",
      403
    );
  }

  // Mark all received messages as read
  await db.message.updateMany({
    where: {
      appointmentId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return db.message.findMany({
    where: { appointmentId },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};
