import prisma from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function inviteStaff(adminId: string, staffEmail: string) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found", 404);

  const user = await prisma.user.findUnique({ where: { email: staffEmail } });
  if (!user) throw new AppError("No user found with this email", 404);
  if (user.role !== "RECEPTIONIST") throw new AppError("User must have the RECEPTIONIST role", 400);

  const existing = await prisma.hospitalStaff.findUnique({ where: { userId: user.id } });
  if (existing) {
    if (existing.hospitalId === hospital.id) throw new AppError("Staff already in this hospital", 409);
    throw new AppError("This user is already staff at another hospital", 409);
  }

  return prisma.hospitalStaff.create({
    data: { userId: user.id, hospitalId: hospital.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeStaff(adminId: string, staffUserId: string) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found", 404);

  const staffRecord = await prisma.hospitalStaff.findFirst({
    where: { userId: staffUserId, hospitalId: hospital.id },
  });
  if (!staffRecord) throw new AppError("Staff member not found", 404);

  await prisma.hospitalStaff.delete({ where: { id: staffRecord.id } });
}

export async function listStaff(adminId: string) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found", 404);

  return prisma.hospitalStaff.findMany({
    where: { hospitalId: hospital.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
}
