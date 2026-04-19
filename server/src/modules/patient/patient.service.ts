import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export const getPatientHistory = async (
  requestingDoctorUserId: string,
  patientId: string
) => {
  // Find the requesting doctor's profile
  const doctorProfile = await db.doctorProfile.findUnique({
    where: { userId: requestingDoctorUserId },
  });
  if (!doctorProfile) throw new AppError("Doctor profile not found", 404);

  // Verify the doctor has at least one appointment with this patient
  const hasRelationship = await db.appointment.findFirst({
    where: {
      doctorId: doctorProfile.id,
      patientId,
    },
  });
  if (!hasRelationship)
    throw new AppError(
      "You do not have permission to view this patient's history",
      403
    );

  // Fetch patient info
  const patient = await db.user.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, phone: true },
  });
  if (!patient) throw new AppError("Patient not found", 404);

  // History with this doctor (all statuses)
  const historyWithThisDoctor = await db.appointment.findMany({
    where: {
      doctorId: doctorProfile.id,
      patientId,
    },
    include: {
      review: true,
    },
    orderBy: { date: "desc" },
  });

  // Recent history across all doctors (COMPLETED or NO_SHOW only, last 10)
  const recentAllDoctors = await db.appointment.findMany({
    where: {
      patientId,
      status: { in: ["COMPLETED", "NO_SHOW"] },
    },
    include: {
      doctor: {
        select: { specialization: true },
      },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  const recentHistory = recentAllDoctors.map((a) => ({
    id: a.id,
    date: a.date,
    startTime: a.startTime,
    status: a.status,
    doctorSpecialization: a.doctor.specialization,
    notes: a.notes,
  }));

  const totalAppointments = await db.appointment.count({ where: { patientId } });
  const completedAppointments = await db.appointment.count({
    where: { patientId, status: "COMPLETED" },
  });

  return {
    patient,
    totalAppointments,
    completedAppointments,
    historyWithThisDoctor: historyWithThisDoctor.map((a) => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      notes: a.notes,
      isPaid: a.isPaid,
      review: a.review ?? null,
    })),
    recentHistory,
  };
};
