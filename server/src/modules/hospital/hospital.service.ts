import prisma from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function createHospital(adminId: string, data: {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
}) {
  const existing = await prisma.hospital.findUnique({ where: { adminId } });
  if (existing) throw new AppError("You already have a registered hospital", 409);

  const emailTaken = await prisma.hospital.findUnique({ where: { email: data.email } });
  if (emailTaken) throw new AppError("A hospital with this email already exists", 409);

  return prisma.hospital.create({
    data: { ...data, adminId },
    include: { admin: { select: { id: true, name: true, email: true } } },
  });
}

export async function getMyHospital(adminId: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { adminId },
    include: {
      departments: {
        include: {
          departmentDoctors: {
            where: { isActive: true },
            include: { doctor: { include: { user: { select: { id: true, name: true } } } } },
          },
        },
      },
      staff: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
  if (!hospital) throw new AppError("No hospital found for this account", 404);
  return hospital;
}

export async function updateHospital(adminId: string, data: Partial<{
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  website: string;
  description: string;
  logoUrl: string;
}>) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found", 404);
  return prisma.hospital.update({ where: { id: hospital.id }, data });
}

export async function listHospitals(filters: {
  name?: string;
  city?: string;
  state?: string;
  department?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
  const skip = (page - 1) * limit;
  const where = {
    status: "APPROVED" as const,
    ...(filters.name && {
      name: { contains: filters.name, mode: "insensitive" as const },
    }),
    ...(filters.city && {
      city: { contains: filters.city, mode: "insensitive" as const },
    }),
    ...(filters.state && {
      state: { contains: filters.state, mode: "insensitive" as const },
    }),
  };

  const hospitals = await prisma.hospital.findMany({
    where,
    include: { departments: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const filtered = filters.department
    ? hospitals.filter((hospital) =>
        hospital.departments.some((department) =>
          department.name
            .toLowerCase()
            .includes(filters.department!.toLowerCase())
        )
      )
    : hospitals;

  const total = filtered.length;
  const pagedHospitals = filtered.slice(skip, skip + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    hospitals: pagedHospitals,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
}

export async function getHospitalById(id: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      departments: {
        include: {
          departmentDoctors: {
            where: { isActive: true },
            include: {
              doctor: {
                include: {
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!hospital) throw new AppError("Hospital not found", 404);
  return hospital;
}

export async function getHospitalForStaff(userId: string) {
  const staff = await prisma.hospitalStaff.findUnique({
    where: { userId },
    include: {
      hospital: {
        include: {
          departments: {
            include: {
              departmentDoctors: {
                where: { isActive: true },
                include: {
                  doctor: { include: { user: { select: { id: true, name: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!staff) throw new AppError("Not associated with any hospital", 404);
  return staff.hospital;
}
