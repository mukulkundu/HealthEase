import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import SlotPicker from "./SlotPicker";
import { appointmentApi } from "../../api/appointment.api";
import type { Appointment, TimeSlot } from "../../types";

interface Props {
  appointment: Appointment;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export default function RescheduleDialog({
  appointment,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const rescheduleCount = appointment.rescheduleCount ?? 0;
  const remaining = 2 - rescheduleCount;
  const maxReached = rescheduleCount >= 2;

  const doctorId = appointment.doctor?.id ?? "";

  const dateStr =
    typeof appointment.date === "string" ? appointment.date : String(appointment.date);
  const formattedCurrentDate = new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formatTime12h = (t: string) => {
    try {
      const [h, m] = t.split(":").map(Number);
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${period}`;
    } catch {
      return t;
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSlotSelect = (slot: TimeSlot, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      const updated = await appointmentApi.reschedule(appointment.id, {
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      toast.success("Appointment rescheduled successfully");
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("This slot is no longer available, please choose another");
      } else {
        toast.error(msg || "Failed to reschedule appointment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current appointment info */}
          <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
            <p className="font-medium text-gray-700">
              Dr. {appointment.doctor?.user?.name ?? "—"}
            </p>
            <p className="text-gray-500">
              {appointment.doctor?.specialization}
            </p>
            <p className="text-gray-500">
              {formattedCurrentDate} &bull;{" "}
              {formatTime12h(appointment.startTime)} – {formatTime12h(appointment.endTime)}
            </p>
          </div>

          {/* Reschedule limit notice */}
          {maxReached ? (
            <p className="text-sm text-red-600 font-medium">
              You have reached the maximum number of reschedules for this appointment.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              You can reschedule up to 2 times.{" "}
              <span className="font-medium text-gray-700">
                Remaining reschedules: {remaining}
              </span>
            </p>
          )}

          {/* Slot picker */}
          {!maxReached && doctorId && (
            <SlotPicker
              doctorId={doctorId}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
              selectedDate={selectedDate || minDate}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={maxReached || !selectedSlot || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
