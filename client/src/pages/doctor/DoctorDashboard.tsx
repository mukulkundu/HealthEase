import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../../api/appointment.api";
import { doctorApi } from "../../api/doctor.api";
import { scheduleApi } from "../../api/schedule.api";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarCheck,
  Clock,
  Users,
  Loader2,
  Settings,
  Stethoscope,
  Pencil,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  X,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, DoctorProfile, AppointmentStatus } from "../../types";

const LIVE_BANNER_KEY = "healthease_live_banner_dismissed";

function DoctorDashboard() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [schedules, setSchedules] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveBannerDismissed, setLiveBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(LIVE_BANNER_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [appts, prof] = await Promise.all([
          appointmentApi.getDoctorAppointments(),
          doctorApi.getMyProfile(),
        ]);
        if (cancelled) return;
        setAppointments(Array.isArray(appts) ? appts : []);
        const p = prof ?? null;
        setProfile(p);
        if (p?.id) {
          const s = await scheduleApi.getByDoctor(p.id);
          if (!cancelled) setSchedules(Array.isArray(s) ? s : []);
        } else {
          setSchedules([]);
        }
      } catch {
        if (!cancelled) {
          setAppointments([]);
          setProfile(null);
          setSchedules([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await appointmentApi.updateStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      toast.success(`Marked as ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentApi.cancel(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const today = new Date().toDateString();
  const apptList = Array.isArray(appointments) ? appointments : [];
  const todayAppts = apptList.filter(
    (a) =>
      new Date(a.date).toDateString() === today &&
      (a.status === "PENDING" || a.status === "CONFIRMED")
  );
  const pending = apptList.filter((a) => a.status === "PENDING");
  const totalPatients = new Set(apptList.map((a) => a.patientId)).size;

  const todayPaid = apptList.filter(
    (a) =>
      new Date(a.date).toDateString() === today &&
      a.isPaid &&
      a.payment?.status === "PAID"
  );
  const todayEarningsPaise = todayPaid.reduce(
    (sum, a) => sum + (a.payment?.amount ?? 0),
    0
  );
  const todayEarnings = todayEarningsPaise / 100;

  // STATE 1 — No profile
  if (!loading && !profile) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="rounded-full bg-blue-50 p-6 mb-4">
            <Stethoscope className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to HealthEase</h1>
          <p className="text-gray-500 mt-2 max-w-sm">
            Complete your profile to start accepting patients and managing appointments.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/doctor/setup-profile">Complete Profile</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const hasSchedule = schedules.length > 0;
  const showLiveBanner = profile && !liveBannerDismissed;
  const showChecklist = profile && !hasSchedule;

  const dismissLiveBanner = () => {
    try {
      localStorage.setItem(LIVE_BANNER_KEY, "true");
    } catch {}
    setLiveBannerDismissed(true);
  };

  // STATE 2 — Profile exists
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {showLiveBanner && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Your profile is live! Patients can now discover and book appointments with you.
              </p>
              <Link
                to={profile ? `/doctors/${profile.id}` : "/doctors"}
                className="text-sm text-green-700 underline font-medium mt-1 inline-flex items-center gap-1"
              >
                View your public profile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <button
              type="button"
              onClick={dismissLiveBanner}
              className="shrink-0 p-1 rounded hover:bg-green-100 text-green-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {showChecklist && (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Complete your setup</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-gray-600">Create profile</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Link to="/doctor/schedule" className="flex items-center gap-3 text-blue-600 hover:underline w-full">
                    <Circle className="h-4 w-4 shrink-0 border-2 border-gray-300 rounded-full" />
                    <span>Set your weekly schedule</span>
                  </Link>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-500">
                  <Circle className="h-4 w-4 shrink-0 border-2 border-gray-300 rounded-full" />
                  <span>Your first booking will appear here</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, Dr. {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's your practice overview</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link to="/doctor/schedule">
                <Calendar className="mr-2 h-4 w-4" /> Manage Schedule
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/doctor/profile">
                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-6 w-6 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{todayAppts.length}</p>
                    <p className="text-xs text-gray-500">Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
                    <p className="text-xs text-gray-500">Total Patients</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{todayEarnings.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">Today's Earnings</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(profile?.rating ?? 0) > 0
                        ? `${(profile!.rating).toFixed(1)} / 5`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-500">Your Rating</p>
                    <p className="text-[10px] text-gray-400">
                      Based on {profile?.totalReviews ?? 0} review{(profile?.totalReviews ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/doctor/schedule">
                  <Settings className="mr-2 h-4 w-4" /> Manage Schedule
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/doctor/appointments">View All Appointments</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/doctor/profile">Edit Profile</Link>
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Today's Appointments</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/doctor/appointments">View all →</Link>
                </Button>
              </div>
              {todayAppts.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 py-10 text-center">
                  <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      role="DOCTOR"
                      onCancel={handleCancel}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default DoctorDashboard;
