import type { Server, Socket } from "socket.io";
import db from "../config/db.js";

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
    socket.on("join_appointment_room", async ({ appointmentId }: { appointmentId: string }) => {
      try {
        const appointment = await db.appointment.findUnique({
          where: { id: appointmentId },
          include: { doctor: { select: { userId: true } } },
        });

        if (!appointment) {
          socket.emit("error", "Appointment not found");
          return;
        }

        const isPatient = appointment.patientId === userId;
        const isDoctor = appointment.doctor.userId === userId;

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
      }: {
        appointmentId: string;
        receiverId: string;
        content: string;
      }) => {
        try {
          if (!content || !content.trim()) {
            socket.emit("error", "Message content cannot be empty");
            return;
          }

          // Verify appointment exists and belongs to sender & receiver with CONFIRMED or COMPLETED status
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
            include: { doctor: { select: { userId: true } } },
          });

          if (!appointment) {
            socket.emit("error", "No valid appointment found for this conversation");
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
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });
}
