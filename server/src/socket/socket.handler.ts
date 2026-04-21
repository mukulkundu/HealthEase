import type { Server, Socket } from "socket.io";
import db from "../config/db.js";
import { isChatExpired } from "../modules/chat/chat.service.js";

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Join personal room
    socket.join(userId);
    console.log(`User ${userId} connected`);

    // ─── join_appointment_room ───────────────────────────────────────────────
    socket.on("join_appointment_room", async ({ appointmentId, type }: { appointmentId: string; type?: "independent" | "hospital" }) => {
      try {
        let isPatient = false;
        let isDoctor = false;

        if (type === "hospital") {
          const appointment = await db.hospitalAppointment.findUnique({
            where: { id: appointmentId },
            include: { doctor: { include: { user: { select: { id: true } } } } },
          });
          if (!appointment) {
            socket.emit("error", "Appointment not found");
            return;
          }
          isPatient = appointment.patientId === userId;
          isDoctor = appointment.doctor.user.id === userId;
        } else {
          const appointment = await db.appointment.findUnique({
            where: { id: appointmentId },
            include: { doctor: { select: { userId: true } } },
          });
          if (!appointment) {
            socket.emit("error", "Appointment not found");
            return;
          }
          isPatient = appointment.patientId === userId;
          isDoctor = appointment.doctor.userId === userId;

          if (isChatExpired(appointment.date)) {
            socket.emit("chat_error", {
              message: "Chat has expired for this appointment",
            });
            return;
          }
        }

        if (!isPatient && !isDoctor) {
          socket.emit("error", "Unauthorized");
          return;
        }

        socket.join(`appointment_${appointmentId}`);
      } catch (err) {
        console.error("join_appointment_room error:", err);
        socket.emit("error", "Failed to join room");
      }
    });

    // ─── send_message ────────────────────────────────────────────────────────
    socket.on(
      "send_message",
      async ({
        appointmentId,
        receiverId,
        content,
        type,
      }: {
        appointmentId: string;
        receiverId: string;
        content: string;
        type?: "independent" | "hospital";
      }) => {
        try {
          if (!content || !content.trim()) {
            socket.emit("error", "Message content cannot be empty");
            return;
          }

          // Verify appointment exists and belongs to sender & receiver with CONFIRMED or COMPLETED status
          if (type === "hospital") {
            socket.emit("error", "In-call chat is currently available only for independent appointments");
            return;
          }

          const appointment = await db.appointment.findFirst({
            where: {
              id: appointmentId,
              status: { in: ["CONFIRMED", "COMPLETED"] },
              OR: [
                {
                  patientId: userId,
                  doctor: { userId: receiverId },
                },
                {
                  patientId: receiverId,
                  doctor: { userId: userId },
                },
              ],
            },
          });

          if (!appointment) {
            socket.emit("error", "No valid appointment found for this conversation");
            return;
          }

          if (isChatExpired(appointment.date)) {
            socket.emit("chat_error", {
              message: "Chat has expired for this appointment",
            });
            return;
          }

          const savedMessage = await db.message.create({
            data: {
              content: content.trim(),
              senderId: userId,
              receiverId,
              appointmentId,
            },
            include: {
              sender: {
                select: { id: true, name: true },
              },
            },
          });

          io.to(`appointment_${appointmentId}`).emit("new_message", savedMessage);
        } catch (err) {
          console.error("send_message error:", err);
          socket.emit("error", "Failed to send message");
        }
      }
    );

    // ─── mark_read ───────────────────────────────────────────────────────────
    socket.on(
      "mark_read",
      async ({
        appointmentId,
        senderId,
      }: {
        appointmentId: string;
        senderId: string;
      }) => {
        try {
          await db.message.updateMany({
            where: {
              appointmentId,
              senderId,
              receiverId: userId,
              isRead: false,
            },
            data: { isRead: true },
          });

          io.to(`appointment_${appointmentId}`).emit("messages_read", {
            appointmentId,
            senderId,
          });
        } catch (err) {
          console.error("mark_read error:", err);
        }
      }
    );

    // ─── disconnect ──────────────────────────────────────────────────────────
    socket.on(
      "call_started",
      ({
        appointmentId,
        callerName,
        callerRole,
        type,
      }: {
        appointmentId: string;
        callerName: string;
        callerRole: string;
        type: "independent" | "hospital";
      }) => {
        io.to(`appointment_${appointmentId}`).emit("incoming_call", {
          appointmentId,
          callerName,
          callerRole,
          type,
        });
      }
    );

    socket.on("call_ended", ({ appointmentId }: { appointmentId: string }) => {
      io.to(`appointment_${appointmentId}`).emit("call_ended", { appointmentId });
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
}
