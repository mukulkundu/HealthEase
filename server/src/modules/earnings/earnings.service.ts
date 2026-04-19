import db from "../../config/db.js";
import { AppError } from "../../middleware/error.middleware.js";

async function getDoctorProfileByUserId(userId: string) {
  const doctor = await db.doctorProfile.findUnique({ where: { userId } });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor;
}

export const getEarningsSummary = async (userId: string) => {
  const doctor = await getDoctorProfileByUserId(userId);

  const allAppointments = await db.appointment.findMany({
    where: { doctorId: doctor.id },
    include: { payment: true },
  });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const isPaid = (a: (typeof allAppointments)[number]) =>
    a.isPaid && a.payment?.status === "PAID";

  const totalEarningsPaise = allAppointments
    .filter(isPaid)
    .reduce((s, a) => s + (a.payment?.amount ?? 0), 0);

  const thisMonthPaise = allAppointments
    .filter((a) => isPaid(a) && new Date(a.date) >= startOfThisMonth)
    .reduce((s, a) => s + (a.payment?.amount ?? 0), 0);

  const lastMonthPaise = allAppointments
    .filter(
      (a) =>
        isPaid(a) &&
        new Date(a.date) >= startOfLastMonth &&
        new Date(a.date) <= endOfLastMonth
    )
    .reduce((s, a) => s + (a.payment?.amount ?? 0), 0);

  const thisWeekPaise = allAppointments
    .filter((a) => isPaid(a) && new Date(a.date) >= startOfThisWeek)
    .reduce((s, a) => s + (a.payment?.amount ?? 0), 0);

  const paidCount = allAppointments.filter(isPaid).length;
  const unpaidCount = allAppointments.length - paidCount;

  // Rating info from profile
  return {
    totalEarnings: totalEarningsPaise / 100,
    thisMonthEarnings: thisMonthPaise / 100,
    lastMonthEarnings: lastMonthPaise / 100,
    thisWeekEarnings: thisWeekPaise / 100,
    totalAppointments: allAppointments.length,
    paidAppointments: paidCount,
    unpaidAppointments: unpaidCount,
    averageRating: doctor.rating,
    totalReviews: doctor.totalReviews,
  };
};

export const getEarningsHistory = async (
  userId: string,
  month: number,
  year: number
) => {
  const doctor = await getDoctorProfileByUserId(userId);

  const startOfPeriod = new Date(year, month - 1, 1);
  const endOfPeriod = new Date(year, month, 0, 23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: {
      doctorId: doctor.id,
      date: { gte: startOfPeriod, lte: endOfPeriod },
    },
    include: {
      patient: { select: { id: true, name: true } },
      payment: true,
    },
    orderBy: { date: "desc" },
  });

  const earnings = appointments.map((a) => ({
    appointmentId: a.id,
    patientName: a.patient.name,
    date: a.date,
    startTime: a.startTime,
    amount: a.payment ? a.payment.amount / 100 : 0,
    paymentStatus: a.payment?.status ?? "UNPAID",
    appointmentStatus: a.status,
  }));

  const totalForPeriodPaise = appointments
    .filter((a) => a.isPaid && a.payment?.status === "PAID")
    .reduce((s, a) => s + (a.payment?.amount ?? 0), 0);

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return {
    earnings,
    totalForPeriod: totalForPeriodPaise / 100,
    periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
  };
};

export const getMonthlyChart = async (userId: string) => {
  const doctor = await getDoctorProfileByUserId(userId);

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNum = d.getMonth(); // 0-indexed
    const year = d.getFullYear();

    const start = new Date(year, monthNum, 1);
    const end = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        date: { gte: start, lte: end },
        isPaid: true,
        payment: { status: "PAID" },
      },
      include: { payment: true },
    });

    const earningsPaise = appointments.reduce(
      (s, a) => s + (a.payment?.amount ?? 0),
      0
    );

    result.push({
      month: MONTH_NAMES[monthNum],
      year,
      earnings: earningsPaise / 100,
    });
  }

  return result;
};
