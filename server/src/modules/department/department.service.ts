import prisma from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

async function assertHospitalAdmin(adminId: string, hospitalId?: string) {
  const hospital = await prisma.hospital.findUnique({ where: { adminId } });
  if (!hospital) throw new AppError("No hospital found for this account", 404);
  if (hospitalId && hospital.id !== hospitalId) throw new AppError("Forbidden", 403);
  return hospital;
}

export async function createDepartment(adminId: string, name: string) {
  const hospital = await assertHospitalAdmin(adminId);
  const existing = await prisma.department.findUnique({
    where: { hospitalId_name: { hospitalId: hospital.id, name } },
  });
  if (existing) throw new AppError("Department already exists", 409);
  return prisma.department.create({ data: { name, hospitalId: hospital.id } });
}

export async function listDepartments(hospitalId: string) {
  return prisma.department.findMany({
    where: { hospitalId },
    include: {
      departmentDoctors: {
        where: { isActive: true },
        include: {
          doctor: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function deleteDepartment(adminId: string, departmentId: string) {
  const hospital = await assertHospitalAdmin(adminId);
  const dept = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId: hospital.id },
  });
  if (!dept) throw new AppError("Department not found", 404);
  await prisma.department.delete({ where: { id: departmentId } });
}

export async function addDoctorToDepartment(
  adminId: string,
  departmentId: string,
  doctorId: string,
  consultationFee: number
) {
  const hospital = await assertHospitalAdmin(adminId);
  const dept = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId: hospital.id },
  });
  if (!dept) throw new AppError("Department not found", 404);

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
  if (!doctorProfile) throw new AppError("Doctor not found", 404);

  return prisma.departmentDoctor.upsert({
    where: { doctorId_departmentId: { doctorId, departmentId } },
    update: { consultationFee, isActive: true },
    create: { doctorId, departmentId, consultationFee },
  });
}

export async function removeDoctorFromDepartment(adminId: string, departmentId: string, doctorId: string) {
  const hospital = await assertHospitalAdmin(adminId);
  const dept = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId: hospital.id },
  });
  if (!dept) throw new AppError("Department not found", 404);
  await prisma.departmentDoctor.update({
    where: { doctorId_departmentId: { doctorId, departmentId } },
    data: { isActive: false },
  });
}

export async function getMyDepartments(doctorUserId: string) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
  });
  if (!doctorProfile) throw new AppError("Doctor profile not found", 404);

  return prisma.departmentDoctor.findMany({
    where: { doctorId: doctorProfile.id, isActive: true },
    include: {
      department: {
        include: { hospital: { select: { id: true, name: true, city: true } } },
      },
    },
  });
}
