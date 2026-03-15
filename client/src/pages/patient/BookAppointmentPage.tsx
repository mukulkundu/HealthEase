import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import { paymentApi } from "../../api/payment.api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SlotPicker from "../../components/shared/SlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee, Clock, CalendarCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { DoctorProfile, TimeSlot } from "../../types";

const NOTES_MAX = 300;

export default function BookAppointmentPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    doctorApi
      .getById(doctorId)
      .then(setDoctor)
      .catch(() => setDoctor(null))
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
      const order = await paymentApi.createOrder({
        doctorId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes.trim() || undefined,
      });

      // Mock mode: key is optional; use dummy so mock confirm dialog runs
      const key = (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) || "mock_key";

      const amount = order.amount;

      const { openRazorpayCheckout } = await import("../../utils/razorpay");

      openRazorpayCheckout(
        {
          key,
          amount,
          currency: order.currency,
          name: "HealthEase",
          description: "Consultation fee",
          orderId: order.orderId,
        },
        async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
          try {
            await paymentApi.verify({
              doctorId,
              date: selectedDate,
              startTime: selectedSlot.startTime,
              endTime: selectedSlot.endTime,
              notes: notes.trim() || undefined,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              amount,
              currency: order.currency,
            });
            toast.success("Payment successful! Appointment booked.");
            navigate("/appointments");
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            if (status === 409) {
              toast.error("This slot was just taken. Please choose another.");
              setStep(1);
            } else {
              toast.error(msg || "Payment verification failed. You have not been charged.");
            }
          } finally {
            setBooking(false);
          }
        },
        () => {
          toast.error("Payment cancelled. Your appointment was not booked.");
          setBooking(false);
        }
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("This slot was just taken. Please choose another.");
        setStep(1);
      } else {
        toast.error(msg || "Could not start payment. Please try again.");
      }
      setBooking(false);
    }
  };

  if (loadingDoctor) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-2 text-gray-500 py-10">
          <Loader2 className="h-6 w-6 animate-spin" /> Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Doctor not found.</p>
          <Button variant="outline" asChild>
            <Link to="/doctors">Back to doctors</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const name = doctor.user?.name ?? "Doctor";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const formatTime12h = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className={step === 1 ? "font-medium text-blue-600" : ""}>
            Step 1: Select Date & Time
          </span>
          <span>→</span>
          <span className={step === 2 ? "font-medium text-blue-600" : ""}>
            Step 2: Confirm Booking
          </span>
        </div>

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
              <p className="text-gray-500 mt-1">Select a date and available time slot</p>
            </div>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={doctor.avatarUrl} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Dr. {name}</p>
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

            <Button
              size="lg"
              className="w-full"
              disabled={!selectedSlot || !selectedDate}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </>
        )}

        {step === 2 && selectedSlot && selectedDate && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Confirm Booking</h1>
              <p className="text-gray-500 mt-1">Review and confirm your appointment</p>
            </div>

            <Card className="border-blue-100 bg-blue-50/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium text-blue-800">Booking Summary</p>
                <p className="text-sm text-gray-900">Dr. {name}</p>
                <p className="text-sm text-blue-700">{doctor.specialization}</p>
                <p className="text-sm text-gray-700">
                  Date:{" "}
                  {new Date(selectedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-700">
                  Time: {formatTime12h(selectedSlot.startTime)} – {formatTime12h(selectedSlot.endTime)}
                </p>
                <p className="text-sm text-gray-700">Fee: ₹{doctor.consultationFee}</p>
              </CardContent>
            </Card>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes for doctor (optional)</Label>
              <textarea
                id="notes"
                rows={3}
                maxLength={NOTES_MAX}
                placeholder="Describe your symptoms or reason for visit"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-gray-500">{notes.length}/{NOTES_MAX}</p>
            </div>

            {import.meta.env.DEV && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-gray-800 mb-1">
                    Razorpay Test Card (Sandbox only)
                  </p>
                  <p className="text-xs text-gray-600 mb-1">
                    Card: 4111 1111 1111 1111
                  </p>
                  <p className="text-xs text-gray-600 mb-1">
                    Expiry: Any future date &nbsp;|&nbsp; CVV: 123
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Use only in development with Razorpay test keys.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing payment...</>
                ) : (
                  <>
                    <CalendarCheck className="mr-2 h-4 w-4" /> Pay ₹{doctor.consultationFee} and Book
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
