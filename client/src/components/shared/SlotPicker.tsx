import { useEffect, useState } from "react";
import { scheduleApi } from "../../api/schedule.api";
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
}

export default function SlotPicker({
  doctorId,
  onSlotSelect,
  selectedSlot,
  selectedDate,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(selectedDate || today);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!date) return;
    fetchSlots(date);
  }, [date]);

  const fetchSlots = async (d: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await scheduleApi.getAvailableSlots(doctorId, d);
      setSlots(data);
    } catch {
      setError("Could not load slots for this date.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="space-y-4">
      {/* Date picker */}
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

      {/* Slots grid */}
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
            No available slots for this date.
          </p>
        )}

        {!loading && availableSlots.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableSlots.map((slot) => {
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
                  {slot.startTime}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}