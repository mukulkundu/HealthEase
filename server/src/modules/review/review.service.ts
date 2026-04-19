import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export const createReview = async (
  patientId: string,
  data: { appointmentId: string; rating: number; comment?: string }
) => {
  const appointment = await db.appointment.findUnique({
    where: { id: data.appointmentId },
    include: { doctor: true },
  });

  if (!appointment) throw new AppError("Appointment not found", 404);
  if (appointment.patientId !== patientId)
    throw new AppError("You are not authorized to review this appointment", 403);
  if (appointment.status !== "COMPLETED")
    throw new AppError("You can only review completed appointments", 400);

  const existing = await db.review.findUnique({
    where: { appointmentId: data.appointmentId },
  });
  if (existing) throw new AppError("You have already reviewed this appointment", 409);

  if (data.rating < 1 || data.rating > 5)
    throw new AppError("Rating must be between 1 and 5", 400);

  const review = await db.review.create({
    data: {
      rating: data.rating,
      comment: data.comment,
      patientId,
      doctorId: appointment.doctorId,
      appointmentId: data.appointmentId,
    },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
  });

  // Recalculate doctor rating
  const allReviews = await db.review.findMany({
    where: { doctorId: appointment.doctorId },
    select: { rating: true },
  });
  const avg =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await db.doctorProfile.update({
    where: { id: appointment.doctorId },
    data: {
      rating: Math.round(avg * 10) / 10,
      totalReviews: allReviews.length,
    },
  });

  return review;
};

export const getDoctorReviews = async (
  doctorId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.review.count({ where: { doctorId } }),
  ]);

  return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getMyReviews = async (patientId: string) => {
  return db.review.findMany({
    where: { patientId },
    include: {
      doctor: {
        select: { id: true, specialization: true, user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const checkCanReview = async (patientId: string, appointmentId: string) => {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment)
    return { canReview: false, reason: "Appointment not found" };
  if (appointment.patientId !== patientId)
    return { canReview: false, reason: "Not your appointment" };
  if (appointment.status !== "COMPLETED")
    return { canReview: false, reason: "Appointment is not completed" };

  const existing = await db.review.findUnique({
    where: { appointmentId },
  });
  if (existing)
    return { canReview: false, reason: "Already reviewed" };

  return { canReview: true };
};
