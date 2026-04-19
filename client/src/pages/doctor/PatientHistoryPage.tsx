import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { patientApi } from "../../api/patient.api";
import type { PatientHistory } from "../../api/patient.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "../../components/shared/StarRating";
import {
  ArrowLeft,
  Loader2,
  Phone,
  User,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { AppointmentStatus } from "../../types";

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function to12h(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  } catch {
    return t;
  }
}

export default function PatientHistoryPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    patientApi
      .getPatientHistory(patientId)
      .then(setHistory)
      .catch((err) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || "Failed to load patient history");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
          </div>
        ) : !history ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>Could not load patient history.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Patient info card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {history.patient.name}
                    </h2>
                    {history.patient.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {history.patient.phone}
                      </p>
                    )}
                    <div className="flex gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <CalendarCheck className="h-4 w-4 text-gray-400" />
                        <span>
                          <strong>{history.totalAppointments}</strong> total appointments
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>
                          <strong>{history.completedAppointments}</strong> completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* History with this doctor */}
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4">History with You</h2>
                {history.historyWithThisDoctor.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No previous appointments with this patient.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.historyWithThisDoctor.map((appt) => (
                      <div
                        key={appt.id}
                        className="rounded-lg border bg-gray-50 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-700">
                            {formatDate(appt.date)} &bull; {to12h(appt.startTime)} – {to12h(appt.endTime)}
                          </p>
                          <div className="flex gap-1.5 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${statusStyles[appt.status]}`}
                            >
                              {appt.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                appt.isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {appt.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                        </div>
                        {appt.notes && (
                          <p className="text-xs text-gray-500 italic">"{appt.notes}"</p>
                        )}
                        {appt.review && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <StarRating readonly rating={appt.review.rating} size="sm" />
                            {appt.review.comment && (
                              <p className="text-xs text-gray-500 truncate">
                                {appt.review.comment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* General medical history */}
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-gray-900 mb-1">
                  General Medical History
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Showing recent consultations (doctor names are private)
                </p>
                {history.recentHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No medical history available.</p>
                ) : (
                  <div className="space-y-3">
                    {history.recentHistory.map((appt) => (
                      <div
                        key={appt.id}
                        className="rounded-lg border bg-gray-50 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-700">
                              {formatDate(appt.date)} &bull; {to12h(appt.startTime)}
                            </p>
                            <p className="text-xs text-blue-600 mt-0.5">
                              {appt.doctorSpecialization}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${statusStyles[appt.status]}`}
                          >
                            {appt.status}
                          </Badge>
                        </div>
                        {appt.notes && (
                          <p className="text-xs text-gray-500 italic">"{appt.notes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
