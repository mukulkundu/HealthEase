import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import { appointmentApi } from "../../api/appointment.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SlotPicker from "../../components/shared/SlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee, Clock, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import type { DoctorProfile, TimeSlot } from "../../types";

export default function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    doctorApi.getById(doctorId)
      .then(setDoctor)
      .finally(() => setLoadingDoctor(false));
  }, [doctorId]);

  const handleSlotSelect = (slot: TimeSlot, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
  };

  const handleBook = async () => {
    if (!doctorId || !selectedSlot || !selectedDate) {
      toast.error("Please select a date and time slot");
      return;
    }
    setBooking(true);
    try {
      await appointmentApi.book({
        doctorId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes.trim() || undefined,
      });
      toast.success("Appointment booked successfully!");
      navigate("/appointments");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("This slot was just taken. Please choose another.");
      } else {
        toast.error(msg || "Booking failed. Please try again.");
      }
    } finally {
      setBooking(false);
    }
  };

  if (loadingDoctor) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-2 text-gray-500 py-10">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <p className="text-gray-500">Doctor not found.</p>
      </DashboardLayout>
    );
  }

  const initials = doctor.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "?";

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-500 mt-1">Select a date and available time slot</p>
        </div>

        {/* Doctor summary */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={doctor.avatarUrl} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Dr. {doctor.user?.name ?? "Doctor"}</p>
              <p className="text-sm text-blue-600">{doctor.specialization}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {doctor.experience} yrs exp
                </span>
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> ₹{doctor.consultationFee}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slot picker */}
        <Card>
          <CardContent className="p-5">
            <SlotPicker
              doctorId={doctor.id}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes for Doctor (optional)</Label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Describe your symptoms or reason for visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Booking summary + confirm */}
        {selectedSlot && selectedDate && (
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Booking Summary</p>
              <div className="text-sm text-blue-700 space-y-0.5">
                <p>Date: {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <p>Time: {selectedSlot.startTime} – {selectedSlot.endTime}</p>
                <p>Fee: ₹{doctor.consultationFee}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleBook}
          disabled={!selectedSlot || !selectedDate || booking}
        >
          {booking ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</>
          ) : (
            <><CalendarCheck className="mr-2 h-4 w-4" /> Confirm Appointment</>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}