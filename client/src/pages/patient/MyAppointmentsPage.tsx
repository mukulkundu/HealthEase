import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/appointment.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Appointment } from "../../types";

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentApi.getMyAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

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

  const list = Array.isArray(appointments) ? appointments : [];
  const upcoming = list.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  );
  const past = list.filter(
    (a) => a.status === "COMPLETED" || a.status === "NO_SHOW"
  );
  const cancelled = list.filter((a) => a.status === "CANCELLED");

  const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-lg border bg-gray-50 py-12 text-center">
      <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
      <Button size="sm" className="mt-4" asChild>
        <Link to="/doctors">Find a Doctor</Link>
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">Track and manage your bookings</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">
                Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
              </TabsTrigger>
              <TabsTrigger value="past">
                Past {past.length > 0 && `(${past.length})`}
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled {cancelled.length > 0 && `(${cancelled.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3">
              {upcoming.length === 0 ? (
                <EmptyState message="No upcoming appointments" />
              ) : (
                upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    role="PATIENT"
                    onCancel={handleCancel}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? (
                <EmptyState message="No past appointments" />
              ) : (
                past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} role="PATIENT" />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3">
              {cancelled.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 py-12 text-center">
                  <p className="text-sm text-gray-500">No cancelled appointments</p>
                </div>
              ) : (
                cancelled.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} role="PATIENT" />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}