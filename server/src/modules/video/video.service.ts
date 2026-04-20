import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";
import { createMeetingToken, createRoom } from "../../config/daily.js";
import { sendVideoConsultationCompleted } from "../../services/email.service.js";

type VideoType = "independent" | "hospital";

function parseAppointmentStart(date: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
}

async function getIndependentAppointment(appointmentId: string) {
  return db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

async function getHospitalAppointment(appointmentId: string) {
  return db.hospitalAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      hospital: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  });
}

export async function createVideoRoom(appointmentId: string, type: VideoType) {
  const appointment =
    type === "independent"
      ? await getIndependentAppointment(appointmentId)
      : await getHospitalAppointment(appointmentId);

  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.status !== "CONFIRMED") {
    throw new AppError("Video room can only be created for confirmed appointments", 400);
  }

  if (appointment.videoRoomName && appointment.videoRoomUrl) {
    return {
      roomName: appointment.videoRoomName,
      roomUrl: appointment.videoRoomUrl,
    };
  }

  const roomName = `healthease-${appointmentId.slice(0, 8)}-${Date.now()}`;
  const roomExpiry = Math.floor(
    (parseAppointmentStart(appointment.date, appointment.startTime).getTime() +
      2 * 60 * 60 * 1000) /
      1000
  );
  const room = await createRoom(roomName, roomExpiry);

  if (type === "independent") {
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        videoRoomName: room.roomName,
        videoRoomUrl: room.roomUrl,
      },
    });
  } else {
    await db.hospitalAppointment.update({
      where: { id: appointmentId },
      data: {
        videoRoomName: room.roomName,
        videoRoomUrl: room.roomUrl,
      },
    });
  }

  return {
    roomName: room.roomName,
    roomUrl: room.roomUrl,
  };
}

export async function getVideoToken(userId: string, appointmentId: string, type: VideoType) {
  const appointment =
    type === "independent"
      ? await getIndependentAppointment(appointmentId)
      : await getHospitalAppointment(appointmentId);

  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.status !== "CONFIRMED") {
    throw new AppError("Video call is only available for confirmed appointments", 400);
  }

  const isPatient = appointment.patientId === userId;
  const isDoctor = appointment.doctor.userId === userId;
  if (!isPatient && !isDoctor) {
    throw new AppError("You are not authorized to join this video call", 403);
  }

  const start = parseAppointmentStart(appointment.date, appointment.startTime);
  const now = new Date();
  const windowStart = new Date(start.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(start.getTime() + 60 * 60 * 1000);

  if (now < windowStart || now > windowEnd) {
    throw new AppError("Video call is not available at this time", 400);
  }

  const room =
    appointment.videoRoomName && appointment.videoRoomUrl
      ? { roomName: appointment.videoRoomName, roomUrl: appointment.videoRoomUrl }
      : await createVideoRoom(appointmentId, type);

  const userName = isDoctor ? appointment.doctor.user.name : appointment.patient.name;
  const token = await createMeetingToken(room.roomName, userId, userName, isDoctor);

  if (!appointment.videoCallStarted) {
    if (type === "independent") {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { videoCallStarted: new Date() },
      });
    } else {
      await db.hospitalAppointment.update({
        where: { id: appointmentId },
        data: { videoCallStarted: new Date() },
      });
    }
  }

  return {
    token,
    roomUrl: room.roomUrl,
    roomName: room.roomName,
  };
}

export async function endVideoCall(userId: string, appointmentId: string, type: VideoType) {
  const appointment =
    type === "independent"
      ? await getIndependentAppointment(appointmentId)
      : await getHospitalAppointment(appointmentId);

  if (!appointment) throw new AppError("Appointment not found", 404);

  const isPatient = appointment.patientId === userId;
  const isDoctor = appointment.doctor.userId === userId;
  if (!isPatient && !isDoctor) {
    throw new AppError("You are not authorized to end this video call", 403);
  }

  if (type === "independent") {
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        videoCallEnded: new Date(),
        ...(isDoctor ? { status: "COMPLETED" } : {}),
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (isDoctor) {
      await sendVideoConsultationCompleted({
        patientName: updated.patient.name,
        patientEmail: updated.patient.email,
        doctorName: updated.doctor.user.name,
        date: updated.date,
        startTime: updated.startTime,
      });
    }
    return updated;
  }

  const updated = await db.hospitalAppointment.update({
    where: { id: appointmentId },
    data: {
      videoCallEnded: new Date(),
      ...(isDoctor ? { status: "COMPLETED" } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  if (isDoctor) {
    await sendVideoConsultationCompleted({
      patientName: updated.patient.name,
      patientEmail: updated.patient.email,
      doctorName: updated.doctor.user.name,
      date: updated.date,
      startTime: updated.startTime,
    });
  }
  return updated;
}

