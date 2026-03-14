import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../../types";

interface Props {
  appointment: Appointment;
  role: "PATIENT" | "DOCTOR";
  onCancel?: (id: string) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function AppointmentCard({
  appointment,
  role,
  onCancel,
  onStatusChange,
}: Props) {
  const isCancellable =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  const displayName =
    role === "PATIENT"
      ? `Dr. ${appointment.doctor?.user?.name ?? "—"}`
      : appointment.patient?.name ?? "—";

  const dateStr = typeof appointment.date === "string" ? appointment.date : String(appointment.date);
  const formattedDate = new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900 text-sm">
                {displayName}
              </span>
            </div>
            {role === "PATIENT" && appointment.doctor && (
              <p className="text-xs text-blue-600 pl-6">
                {appointment.doctor.specialization}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {appointment.startTime} – {appointment.endTime}
            </div>
            {appointment.notes && (
              <p className="text-xs text-gray-500 italic pl-6 line-clamp-2">
                "{appointment.notes}"
              </p>
            )}
          </div>

          {/* Right: status + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant="outline"
              className={`text-xs ${statusStyles[appointment.status]}`}
            >
              {appointment.status}
            </Badge>

            {/* Patient actions */}
            {role === "PATIENT" && isCancellable && onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                onClick={() => onCancel(appointment.id)}
              >
                Cancel
              </Button>
            )}

            {/* Doctor actions */}
            {role === "DOCTOR" && onStatusChange && (
              <div className="flex flex-col gap-1">
                {appointment.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onStatusChange(appointment.id, "CONFIRMED")}
                  >
                    Confirm
                  </Button>
                )}
                {appointment.status === "CONFIRMED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => onStatusChange(appointment.id, "COMPLETED")}
                  >
                    Mark Done
                  </Button>
                )}
                {isCancellable && onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 text-xs h-7"
                    onClick={() => onCancel(appointment.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}