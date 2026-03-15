import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi } from "../../api/appointment.api";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Search, Clock, Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "../../types";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi
      .getMyAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => {
        setAppointments([]);
        toast.error("Failed to load appointments");
      })
      .finally(() => setLoading(false));
  }, []);

  const list = Array.isArray(appointments) ? appointments : [];
  const upcoming = list.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  );
  const completed = list.filter((a) => a.status === "COMPLETED");
  const recentCompleted = [...completed]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const handleCancel = async (id: string) => {
    try {
      await appointmentApi.cancel(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-gray-500 mt-1">Here's your health overview</p>
        </div>

        {!loading && list.length === 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-1">Welcome to HealthEase!</h3>
              <p className="text-sm text-gray-600 mb-4">You're all set. Find a doctor and book your first appointment.</p>
              <Button asChild>
                <Link to="/doctors">Browse Doctors</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Search className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{list.length}</p>
                <p className="text-xs text-gray-500">Total Visits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/doctors">
              <Search className="mr-2 h-4 w-4" /> Find a Doctor
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/appointments">My Appointments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patient/profile">
              <UserCircle className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Upcoming Appointments
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : !upcoming.length ? (
            <div className="rounded-lg border bg-gray-50 py-10 text-center">
              <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming appointments</p>
              <Button className="mt-4" size="sm" asChild>
                <Link to="/doctors">Book Now</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  role="PATIENT"
                  onCancel={handleCancel}
                />
              ))}
              {upcoming.length > 3 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/appointments">View all {upcoming.length} →</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Recent Activity
          </h2>
          {loading ? null : recentCompleted.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 py-8 text-center">
              <p className="text-sm text-gray-500">No past appointments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCompleted.map((appt) => (
                <Card key={appt.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Dr. {appt.doctor?.user?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(appt.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Completed
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
