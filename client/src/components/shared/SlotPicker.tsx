import { useEffect, useState } from "react";
import { scheduleApi } from "../../api/schedule.api";
import { hospitalScheduleApi } from "../../api/hospitalSchedule.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "../../types";
import { Loader2 } from "lucide-react";

interface Props {
  doctorId: string;
  onSlotSelect: (slot: TimeSlot, date: string) => void;
  selectedSlot?: TimeSlot | null;
  selectedDate?: string;
  /** When true, use hospital schedule slots (requires departmentId) */
  isHospital?: boolean;
  departmentId?: string;
}

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function slotGroup(t: string): "morning" | "afternoon" | "evening" {
  const [h] = t.split(":").map(Number);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const GROUP_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export default function SlotPicker({
  doctorId,
  onSlotSelect,
  selectedSlot,
  selectedDate,
  isHospital,
  departmentId,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(selectedDate || today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedDate) setDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!date || !doctorId) return;
    setLoading(true);
    setError("");
    const fetchSlots = isHospital && departmentId
      ? hospitalScheduleApi.getAvailableSlots(doctorId, departmentId, date)
      : scheduleApi.getAvailableSlots(doctorId, date);
    fetchSlots
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => {
        setError("Could not load slots for this date.");
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [doctorId, date, isHospital, departmentId]);

  const slotList = Array.isArray(slots) ? slots : [];
  const availableSlots = slotList.filter((s) => s?.available);

  const byGroup = {
    morning: availableSlots.filter((s) => slotGroup(s.startTime) === "morning"),
    afternoon: availableSlots.filter((s) => slotGroup(s.startTime) === "afternoon"),
    evening: availableSlots.filter((s) => slotGroup(s.startTime) === "evening"),
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="appt-date">Select Date</Label>
        <Input
          id="appt-date"
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      <div>
        <Label className="mb-2 block">Available Time Slots</Label>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading slots...
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && availableSlots.length === 0 && (
          <p className="text-sm text-gray-500 py-2">
            No slots available for this date. Doctor may not be available on this day.
          </p>
        )}

        {!loading && availableSlots.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {availableSlots.length} slot{availableSlots.length !== 1 ? "s" : ""} available
            </p>
            <div className="space-y-4">
              {(["morning", "afternoon", "evening"] as const).map(
                (group) =>
                  byGroup[group].length > 0 && (
                    <div key={group}>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {GROUP_LABELS[group]}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {byGroup[group].map((slot) => {
                          const isSelected =
                            selectedSlot?.startTime === slot.startTime &&
                            selectedDate === date;
                          return (
                            <Button
                              key={slot.startTime}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "text-xs h-9",
                                isSelected && "ring-2 ring-blue-500 ring-offset-1"
                              )}
                              onClick={() => onSlotSelect(slot, date)}
                            >
                              {to12h(slot.startTime)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
