import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export const getAllDoctors = async (filters: {
  specialization?: string;
  name?: string;
  minFee?: number;
  maxFee?: number;
  minExperience?: number;
  maxExperience?: number;
  minRating?: number;
  languages?: string[];
  availableOn?: string;
  sortBy?: "rating" | "fee_asc" | "fee_desc" | "experience";
  page?: number;
  limit?: number;
}) => {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
  const skip = (page - 1) * limit;

  const orderBy =
    filters.sortBy === "fee_asc"
      ? { consultationFee: "asc" as const }
      : filters.sortBy === "fee_desc"
      ? { consultationFee: "desc" as const }
      : filters.sortBy === "experience"
      ? { experience: "desc" as const }
      : { rating: "desc" as const };

  const doctors = await db.doctorProfile.findMany({
    where: {
      ...(filters.specialization && {
        specialization: {
          contains: filters.specialization,
          mode: "insensitive",
        },
      }),
      ...(filters.name && {
        OR: [
          {
            user: {
              name: {
                contains: filters.name,
                mode: "insensitive",
              },
            },
          },
          {
            bio: {
              contains: filters.name,
              mode: "insensitive",
            },
          },
          {
            specialization: {
              contains: filters.name,
              mode: "insensitive",
            },
          },
          {
            qualifications: {
              hasSome: [filters.name],
            },
          },
        ],
      }),
      ...((filters.minFee !== undefined || filters.maxFee !== undefined) && {
        consultationFee: {
          ...(filters.minFee !== undefined && { gte: filters.minFee }),
          ...(filters.maxFee !== undefined && { lte: filters.maxFee }),
        },
      }),
      ...((filters.minExperience !== undefined || filters.maxExperience !== undefined) && {
        experience: {
          ...(filters.minExperience !== undefined && { gte: filters.minExperience }),
          ...(filters.maxExperience !== undefined && { lte: filters.maxExperience }),
        },
      }),
      ...(filters.minRating !== undefined && {
        rating: {
          gte: filters.minRating,
        },
      }),
      ...(filters.languages?.length && {
        languages: {
          hasSome: filters.languages,
        },
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      schedules: true,
    },
    orderBy,
  });

  const filteredByDay = filters.availableOn
    ? doctors.filter((doctor) =>
        doctor.schedules.some(
          (schedule) =>
            schedule.isActive && schedule.dayOfWeek === filters.availableOn
        )
      )
    : doctors;

  const total = filteredByDay.length;
  const pagedDoctors = filteredByDay.slice(skip, skip + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    doctors: pagedDoctors,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
};

export const getDoctorById = async (id: string) => {
  const doctor = await db.doctorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!doctor) throw new AppError("Doctor not found", 404);
  return doctor;
};

export const getMyProfile = async (userId: string) => {
  const doctor = await db.doctorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor;
};

export const createProfile = async (
  userId: string,
  data: {
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio?: string;
    avatarUrl?: string;
  }
) => {
  const existing = await db.doctorProfile.findUnique({ where: { userId } });
  if (existing) throw new AppError("Profile already exists", 409);

  const profile = await db.doctorProfile.create({
    data: {
      userId,
      ...data,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return profile;
};

export const updateProfile = async (
  userId: string,
  data: Partial<{
    specialization: string;
    experience: number;
    qualifications: string[];
    languages: string[];
    consultationFee: number;
    bio: string;
    avatarUrl: string;
  }>
) => {
  const existing = await db.doctorProfile.findUnique({ where: { userId } });
  if (!existing) throw new AppError("Doctor profile not found", 404);

  const updated = await db.doctorProfile.update({
    where: { userId },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return updated;
};