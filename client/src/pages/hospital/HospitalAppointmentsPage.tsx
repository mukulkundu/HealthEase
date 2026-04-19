import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, User, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HospitalAppointment, AppointmentStatus } from "../../types";

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function to12h(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  } catch { return t; }
}

export default function HospitalAppointmentsPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = () => {
    setLoading(true);
    const fetcher = user?.role === "RECEPTIONIST"
      ? hospitalAppointmentApi.getReceptionistAppointments()
      : hospitalAppointmentApi.getHospitalAppointments();
    fetcher
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => { setAppointments([]); toast.error("Failed to load appointments"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const prev = appointments;
    setAppointments((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    try {
      await hospitalAppointmentApi.updateStatus(id, status);
      toast.success(`Marked as ${status.toLowerCase()}`);
    } catch {
      setAppointments(prev);
      toast.error("Failed to update status");
    }
  };

  const list = Array.isArray(appointments) ? appointments : [];
  const pending = list.filter((a) => a.status === "PENDING");
  const confirmed = list.filter((a) => a.status === "CONFIRMED");
  const completed = list.filter((a) => a.status === "COMPLETED" || a.status === "NO_SHOW");
  const cancelled = list.filter((a) => a.status === "CANCELLED");

  const AppointmentCard = ({ appt }: { appt: HospitalAppointment }) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-sm text-gray-900">{appt.patient?.name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-blue-600">{appt.department?.name ?? "—"}</span>
            </div>
            <p className="text-xs text-gray-500 pl-6">Dr. {appt.doctor?.user?.name ?? "—"}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarCheck className="h-3.5 w-3.5" /> {formatDate(appt.date)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" /> {to12h(appt.startTime)} – {to12h(appt.endTime)}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs ${statusStyles[appt.status]}`}>
              {appt.status}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${appt.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
              {appt.isPaid ? "Paid" : "Unpaid"}
            </Badge>

            {appt.status === "PENDING" && (
              <Button size="sm" className="text-xs h-7" onClick={() => handleStatusChange(appt.id, "CONFIRMED")}>
                Confirm
              </Button>
            )}
            {appt.status === "CONFIRMED" && (
              <div className="flex flex-col gap-1">
                <Button size="sm" className="text-xs h-7" onClick={() => handleStatusChange(appt.id, "COMPLETED")}>
                  Complete
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(appt.id, "NO_SHOW")}>
                  No Show
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Hospital Appointments</h1>
          <p className="text-gray-500 mt-1">Manage patient appointments</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed {confirmed.length > 0 && `(${confirmed.length})`}</TabsTrigger>
              <TabsTrigger value="completed">Completed {completed.length > 0 && `(${completed.length})`}</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled {cancelled.length > 0 && `(${cancelled.length})`}</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? <EmptyState /> : pending.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </TabsContent>
            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 ? <EmptyState /> : confirmed.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3">
              {completed.length === 0 ? <EmptyState /> : completed.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </TabsContent>
            <TabsContent value="cancelled" className="space-y-3">
              {cancelled.length === 0 ? <EmptyState /> : cancelled.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
