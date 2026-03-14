import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/appointment.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Appointment } from "../../types";

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await appointmentApi.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
      setError(true);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelClick = (appt: Appointment) => {
    setCancelConfirm(appt);
  };

  const handleCancelConfirm = async () => {
    if (!cancelConfirm) return;
    setCancellingId(cancelConfirm.id);
    const prev = appointments;
    setAppointments((p) =>
      p.map((a) => (a.id === cancelConfirm.id ? { ...a, status: "CANCELLED" as const } : a))
    );
    setCancelConfirm(null);
    try {
      await appointmentApi.cancel(cancelConfirm.id);
      toast.success("Appointment cancelled");
    } catch {
      setAppointments(prev);
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
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
        ) : error ? (
          <div className="rounded-lg border bg-gray-50 py-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Could not load appointments</p>
            <Button onClick={fetchAppointments}>Retry</Button>
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
                <div className="rounded-lg border bg-gray-50 py-12 text-center">
                  <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No upcoming appointments</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link to="/doctors">Book an Appointment</Link>
                  </Button>
                </div>
              ) : (
                upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    role="PATIENT"
                    onCancel={(id) => {
                      const appt = appointments.find((x) => x.id === id);
                      if (appt) handleCancelClick(appt);
                    }}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? (
                <div className="rounded-lg border bg-gray-50 py-12 text-center">
                  <p className="text-sm text-gray-500">No past appointments yet</p>
                </div>
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

      <Dialog open={!!cancelConfirm} onOpenChange={(open) => !open && setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will cancel your appointment. You can book a new one anytime.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelConfirm(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              disabled={cancellingId === cancelConfirm?.id}
              onClick={handleCancelConfirm}
            >
              {cancellingId === cancelConfirm?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
