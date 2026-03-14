import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../../api/appointment.api";
import { doctorApi } from "../../api/doctor.api";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarCheck, Clock, Users, AlertCircle,
  Loader2, Settings,
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, DoctorProfile, AppointmentStatus } from "../../types";

function DoctorDashboard() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentApi.getDoctorAppointments(),
      doctorApi.getMyProfile(),
    ]).then(([appts, prof]) => {
      setAppointments(Array.isArray(appts) ? appts : []);
      setProfile(prof ?? null);
    }).catch(() => {
      setAppointments([]);
      setProfile(null);
    }).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await appointmentApi.updateStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      toast.success(`Appointment marked as ${status.toLowerCase()}`);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, Dr. {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's your practice overview</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/doctor/schedule">
              <Settings className="mr-2 h-4 w-4" /> Manage Schedule
            </Link>
          </Button>
        </div>

        {/* Profile incomplete warning */}
        {!loading && !profile && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Complete your profile
              </p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Set up your doctor profile so patients can find and book you.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/doctor/schedule">Manage Schedule</Link>
            </Button>
          </div>
        )}

        {/* Approval status */}
        {profile && !profile.isApproved && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              Your profile is <strong>pending approval</strong>. You won't appear in public listings until an admin approves your account.
            </p>
          </div>
        )}

        {/* Stats */}
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
        </div>

        {/* Today's appointments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Today's Appointments
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/doctor/appointments">View all →</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : todayAppts.length === 0 ? (
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
      </div>
    </DashboardLayout>
  );
}

export default DoctorDashboard;