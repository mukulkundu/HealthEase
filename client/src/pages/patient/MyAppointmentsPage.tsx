import { useEffect, useState } from "react";
import { appointmentApi } from "../../api/appointment.api";
import { reviewApi } from "../../api/review.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AppointmentCard from "../../components/shared/AppointmentCard";
import RescheduleDialog from "../../components/shared/RescheduleDialog";
import LeaveReviewDialog from "../../components/shared/LeaveReviewDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, Star } from "lucide-react";
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

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  // Review state: appointmentId → canReview boolean (cached after check)
  const [canReviewMap, setCanReviewMap] = useState<Record<string, boolean>>({});
  const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null);

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

  // Check canReview for completed appointments
  useEffect(() => {
    const completed = appointments.filter((a) => a.status === "COMPLETED");
    completed.forEach((a) => {
      if (canReviewMap[a.id] !== undefined) return;
      reviewApi.checkCanReview(a.id).then((res) => {
        setCanReviewMap((prev) => ({ ...prev, [a.id]: res.canReview }));
      }).catch(() => {
        setCanReviewMap((prev) => ({ ...prev, [a.id]: false }));
      });
    });
  }, [appointments]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRescheduleSuccess = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleReviewSuccess = (appointmentId: string) => {
    setCanReviewMap((prev) => ({ ...prev, [appointmentId]: false }));
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
                    onReschedule={(id) => {
                      const appt = appointments.find((x) => x.id === id);
                      if (appt) setRescheduleAppt(appt);
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
                  <div key={a.id} className="space-y-1">
                    <AppointmentCard appointment={a} role="PATIENT" />
                    {a.status === "COMPLETED" && (
                      <div className="flex justify-end px-1">
                        {canReviewMap[a.id] === true ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 text-xs flex items-center gap-1"
                            onClick={() => setReviewAppt(a)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            Leave Review
                          </Button>
                        ) : canReviewMap[a.id] === false ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            Reviewed
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </div>
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

      {/* Cancel confirmation dialog */}
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

      {/* Reschedule dialog */}
      {rescheduleAppt && (
        <RescheduleDialog
          appointment={rescheduleAppt}
          open={!!rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Leave review dialog */}
      {reviewAppt && (
        <LeaveReviewDialog
          appointmentId={reviewAppt.id}
          doctorName={reviewAppt.doctor?.user?.name ?? ""}
          open={!!reviewAppt}
          onClose={() => setReviewAppt(null)}
          onSuccess={() => handleReviewSuccess(reviewAppt.id)}
        />
      )}
    </DashboardLayout>
  );
}
