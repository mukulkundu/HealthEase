import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, User, Building2, Loader2 } from "lucide-react";
import { Video } from "lucide-react";
import { toast } from "sonner";
import type { HospitalAppointment, AppointmentStatus } from "../../types";
import { useNavigate } from "react-router-dom";
import { isCallJoinable, isCallNotStartedYet } from "../../utils/video";

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}
function to12h(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  } catch { return t; }
}

export default function DoctorHospitalAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalAppointmentApi
      .getDoctorAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => { toast.error("Failed to load appointments"); })
      .finally(() => setLoading(false));
  }, []);

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

  const renderApptCard = (appt: HospitalAppointment) => (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-sm text-gray-900">{appt.patient?.name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Building2 className="h-3.5 w-3.5" />
              {appt.hospital?.name} — {appt.department?.name}
            </div>
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
            {appt.status === "PENDING" && (
              <Button size="sm" className="text-xs h-7" onClick={() => handleStatusChange(appt.id, "CONFIRMED")}>
                Confirm
              </Button>
            )}
            {appt.status === "CONFIRMED" && (
              <div className="flex flex-col gap-1">
                {isCallJoinable(appt) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs h-7"
                    onClick={() => navigate(`/call/${appt.id}?type=hospital`)}
                  >
                    <Video className="h-3.5 w-3.5 mr-1" />
                    Join Call
                  </Button>
                ) : isCallNotStartedYet(appt) ? (
                  <Button size="sm" variant="outline" className="text-xs h-7" disabled>
                    Call Starts At {to12h(appt.startTime)}
                  </Button>
                ) : null}
                <Button size="sm" className="text-xs h-7" onClick={() => handleStatusChange(appt.id, "COMPLETED")}>
                  Mark Complete
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

  const renderEmptyState = () => (
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
          <p className="text-gray-500 mt-1">Appointments via hospital departments</p>
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
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="space-y-3">
              {pending.length === 0 ? renderEmptyState() : pending.map((a) => <div key={a.id}>{renderApptCard(a)}</div>)}
            </TabsContent>
            <TabsContent value="confirmed" className="space-y-3">
              {confirmed.length === 0 ? renderEmptyState() : confirmed.map((a) => <div key={a.id}>{renderApptCard(a)}</div>)}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3">
              {completed.length === 0 ? renderEmptyState() : completed.map((a) => <div key={a.id}>{renderApptCard(a)}</div>)}
            </TabsContent>
            <TabsContent value="cancelled" className="space-y-3">
              {cancelled.length === 0 ? renderEmptyState() : cancelled.map((a) => <div key={a.id}>{renderApptCard(a)}</div>)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
