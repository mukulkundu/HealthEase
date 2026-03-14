import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export const getAllDoctors = async (filters: {
  specialization?: string;
  name?: string;
}) => {
  const doctors = await db.doctorProfile.findMany({
    where: {
      isApproved: true,
      ...(filters.specialization && {
        specialization: {
          contains: filters.specialization,
          mode: "insensitive",
        },
      }),
      ...(filters.name && {
        user: {
          name: {
            contains: filters.name,
            mode: "insensitive",
          },
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
    },
    orderBy: { rating: "desc" },
  });

  return doctors;
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