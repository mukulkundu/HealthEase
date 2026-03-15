import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/appointment.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CalendarCheck, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, AppointmentStatus } from "../../types";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAppointments = () => {
    setLoading(true);
    setError(false);
    appointmentApi
      .getDoctorAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => {
        setAppointments([]);
        setError(true);
        toast.error("Failed to load appointments");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const prev = appointments;
    setAppointments((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await appointmentApi.updateStatus(id, status);
      toast.success(`Marked as ${status.toLowerCase()}`);
    } catch {
      setAppointments(prev);
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async (id: string) => {
    const prev = appointments;
    setAppointments((p) => p.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)));
    try {
      await appointmentApi.cancel(id);
      toast.success("Appointment cancelled");
    } catch {
      setAppointments(prev);
      toast.error("Failed to cancel");
    }
  };

  const list = Array.isArray(appointments) ? appointments : [];
  const pending = list.filter((a) => a.status === "PENDING");
  const confirmed = list.filter((a) => a.status === "CONFIRMED");
  const completed = list.filter((a) => a.status === "COMPLETED" || a.status === "NO_SHOW");
  const cancelled = list.filter((a) => a.status === "CANCELLED");

  const paidAppointments = list.filter(
    (a) => a.isPaid && a.payment?.status === "PAID"
  );
  const totalEarningsPaise = paidAppointments.reduce(
    (sum, a) => sum + (a.payment?.amount ?? 0),
    0
  );
  const totalEarnings = totalEarningsPaise / 100;

  const EmptyState = () => (
    <div className="rounded-lg border bg-gray-50 py-12 text-center">
      <CalendarCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">No appointments here</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage your patient appointments</p>
        </div>

        <div className="rounded-lg border bg-gray-50 px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-gray-600">Total earnings from paid appointments</span>
          <span className="flex items-center gap-1 font-semibold text-gray-900">
            <IndianRupee className="h-3 w-3" />
            {totalEarnings.toFixed(0)}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : error ? (
          <div className="rounded-lg border bg-gray-50 py-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Could not load appointments</p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={fetchAppointments}
            >
              Retry
            </button>
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending {pending.length > 0 && `(${pending.length})`}
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed {confirmed.length > 0 && `(${confirmed.length})`}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed {completed.length > 0 && `(${completed.length})`}
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled {cancelled.length > 0 && `(${cancelled.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? <EmptyState /> : pending.map((a) => (
                <AppointmentCard
                  key={a.id} appointment={a} role="DOCTOR"
                  onCancel={handleCancel} onStatusChange={handleStatusChange}
                />
              ))}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 ? <EmptyState /> : confirmed.map((a) => (
                <AppointmentCard
                  key={a.id} appointment={a} role="DOCTOR"
                  onCancel={handleCancel} onStatusChange={handleStatusChange}
                />
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completed.length === 0 ? <EmptyState /> : completed.map((a) => (
                <AppointmentCard key={a.id} appointment={a} role="DOCTOR" />
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3">
              {cancelled.length === 0 ? <EmptyState /> : cancelled.map((a) => (
                <AppointmentCard key={a.id} appointment={a} role="DOCTOR" />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}