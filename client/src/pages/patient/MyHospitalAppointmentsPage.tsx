import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, Building2, Loader2 } from "lucide-react";
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

export default function MyHospitalAppointmentsPage() {
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalAppointmentApi
      .getMyAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => { toast.error("Failed to load appointments"); })
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    const prev = appointments;
    setAppointments((p) => p.map((a) => a.id === id ? { ...a, status: "CANCELLED" } : a));
    try {
      await hospitalAppointmentApi.cancel(id);
      toast.success("Appointment cancelled");
    } catch {
      setAppointments(prev);
      toast.error("Failed to cancel");
    }
  };

  const list = Array.isArray(appointments) ? appointments : [];
  const upcoming = list.filter((a) => ["PENDING", "CONFIRMED"].includes(a.status));
  const past = list.filter((a) => ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status));

  const ApptCard = ({ appt }: { appt: HospitalAppointment }) => {
    const isCancellable = appt.status === "PENDING" || appt.status === "CONFIRMED";
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-sm text-gray-900">{appt.hospital?.name ?? "—"}</span>
              </div>
              <p className="text-xs text-blue-600 pl-6">
                {appt.department?.name} — Dr. {appt.doctor?.user?.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarCheck className="h-3.5 w-3.5" /> {formatDate(appt.date)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" /> {to12h(appt.startTime)} – {to12h(appt.endTime)}
              </div>
              {appt.notes && (
                <p className="text-xs text-gray-400 italic pl-6">"{appt.notes}"</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex flex-wrap gap-1 justify-end">
                <Badge variant="outline" className={`text-xs ${statusStyles[appt.status]}`}>
                  {appt.status}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${appt.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500"}`}>
                  {appt.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              {isCancellable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  onClick={() => handleCancel(appt.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <p className="text-gray-500 mt-1">Your appointments via hospitals</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming {upcoming.length > 0 && `(${upcoming.length})`}</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-3">
              {upcoming.length === 0 ? <EmptyState /> : upcoming.map((a) => <ApptCard key={a.id} appt={a} />)}
            </TabsContent>
            <TabsContent value="past" className="space-y-3">
              {past.length === 0 ? <EmptyState /> : past.map((a) => <ApptCard key={a.id} appt={a} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
