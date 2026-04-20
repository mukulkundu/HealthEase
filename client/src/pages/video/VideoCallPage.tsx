import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { appointmentApi } from "../../api/appointment.api";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import PreCallScreen from "../../components/video/PreCallScreen";
import VideoCallRoom from "../../components/video/VideoCallRoom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Appointment, HospitalAppointment } from "../../types";

type CallStage = "pre-call" | "in-call" | "ended";
type VideoType = "independent" | "hospital";

export default function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stage, setStage] = useState<CallStage>("pre-call");
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | HospitalAppointment | null>(null);

  const type = (params.get("type") as VideoType) || "independent";
  const isDoctor = user?.role === "DOCTOR";

  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      try {
        if (type === "hospital") {
          const list = isDoctor
            ? await hospitalAppointmentApi.getDoctorAppointments()
            : await hospitalAppointmentApi.getMyAppointments();
          setAppointment(list.find((item) => item.id === appointmentId) ?? null);
        } else {
          const list = isDoctor
            ? await appointmentApi.getDoctorAppointments()
            : await appointmentApi.getMyAppointments();
          setAppointment(list.find((item) => item.id === appointmentId) ?? null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId, isDoctor, type]);

  const otherPersonName = useMemo(() => {
    if (!appointment) return "Participant";
    if (isDoctor) return appointment.patient?.name ?? "Patient";
    return appointment.doctor?.user?.name ?? "Doctor";
  }, [appointment, isDoctor]);

  const otherPersonId = useMemo(() => {
    if (!appointment) return "";
    if (isDoctor) return appointment.patient?.id ?? "";
    return appointment.doctor?.user?.id ?? "";
  }, [appointment, isDoctor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!appointment || !appointmentId) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col gap-3 items-center justify-center">
        <p>Appointment not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  if (stage === "pre-call") {
    return (
      <PreCallScreen
        appointment={appointment}
        type={type}
        onJoin={() => setStage("in-call")}
        onCancel={() => navigate(-1)}
      />
    );
  }

  if (stage === "in-call") {
    return (
      <VideoCallRoom
        appointmentId={appointmentId}
        type={type}
        onCallEnd={() => setStage("ended")}
        otherPersonName={otherPersonName}
        otherPersonId={otherPersonId}
        isDoctor={isDoctor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Call Ended</h1>
        <p className="text-gray-300">
          {isDoctor ? "Appointment marked as completed." : "You can now continue in app."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={isDoctor ? "/doctor/appointments" : "/appointments"}>Back to Appointments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/chat/${appointmentId}`}>View Chat</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

