import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Mic, TriangleAlert } from "lucide-react";
import type { Appointment, HospitalAppointment } from "../../types";
import { getAppointmentStart } from "../../utils/video";

interface Props {
  appointment: Appointment | HospitalAppointment;
  type: "independent" | "hospital";
  onJoin: () => void;
  onCancel: () => void;
}

export default function PreCallScreen({ appointment, onJoin, onCancel }: Props) {
  const [statusText, setStatusText] = useState("Preparing your call...");

  useEffect(() => {
    const updateText = () => {
      const start = getAppointmentStart(appointment.date, appointment.startTime);
      const diffMin = Math.round((start.getTime() - new Date().getTime()) / (60 * 1000));
      if (diffMin > 0) {
        setStatusText(`Your appointment starts in ${diffMin} minutes`);
      } else if (diffMin === 0) {
        setStatusText("Your appointment starts now");
      } else {
        setStatusText(`Your appointment started ${Math.abs(diffMin)} minutes ago`);
      }
    };

    updateText();
    const timer = window.setInterval(updateText, 30000);
    return () => window.clearInterval(timer);
  }, [appointment.date, appointment.startTime]);

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Video Consultation</h1>
          <p className="text-gray-300 mt-2">{statusText}</p>
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Date: {new Date(appointment.date).toLocaleDateString()}</Badge>
              <Badge variant="secondary">
                Time: {appointment.startTime} - {appointment.endTime}
              </Badge>
            </div>

            <div className="rounded-lg bg-black/60 border border-gray-800 h-52 flex items-center justify-center text-gray-300">
              Camera preview will appear once you join
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-800 p-3 flex items-center gap-2">
                <Camera className="h-4 w-4 text-green-400" /> Camera: Ready
              </div>
              <div className="rounded-md border border-gray-800 p-3 flex items-center gap-2">
                <Mic className="h-4 w-4 text-green-400" /> Microphone: Ready
              </div>
            </div>

            <div className="rounded-md border border-amber-700/40 bg-amber-900/20 p-3 text-sm text-amber-100">
              <p className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" />
                Ensure you are in a quiet, well-lit location with stable internet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onJoin}>
                Join Call
              </Button>
              <Button size="lg" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

