import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalApi } from "../../api/hospital.api";
import { hospitalPaymentApi } from "../../api/hospitalPayment.api";
import { hospitalScheduleApi } from "../../api/hospitalSchedule.api";
import SlotPicker from "../../components/shared/SlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, IndianRupee, ArrowLeft, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { openRazorpayCheckout } from "../../utils/razorpay";
import type { Hospital, Department, TimeSlot } from "../../types";

export default function HospitalBookingPage() {
  const { hospitalId, doctorId, departmentId } = useParams<{
    hospitalId: string;
    doctorId: string;
    departmentId: string;
  }>();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [consultationFee, setConsultationFee] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!hospitalId || !departmentId || !doctorId) return;
    hospitalApi
      .getById(hospitalId)
      .then((h) => {
        setHospital(h);
        const dept = h.departments?.find((d) => d.id === departmentId);
        if (dept) {
          setDepartment(dept);
          const dd = dept.departmentDoctors?.find((d) => d.doctorId === doctorId);
          if (dd) {
            setDoctorName(dd.doctor?.user?.name ?? "");
            setConsultationFee(dd.consultationFee);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId, departmentId, doctorId]);

  const handleBook = async () => {
    if (!doctorId || !departmentId || !selectedSlot || !selectedDate) {
      toast.error("Please select a date and time slot");
      return;
    }
    setBooking(true);
    try {
      const order = await hospitalPaymentApi.createOrder({
        doctorId,
        departmentId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes.trim() || undefined,
      });

      openRazorpayCheckout(
        {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "mock_key",
          amount: order.amount as number,
          currency: order.currency,
          name: hospital?.name ?? "Hospital",
          description: `${department?.name} consultation`,
          orderId: order.orderId,
        },
        async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
          try {
            await hospitalPaymentApi.verifyPayment({
              doctorId,
              departmentId,
              date: selectedDate,
              startTime: selectedSlot.startTime,
              endTime: selectedSlot.endTime,
              notes: notes.trim() || undefined,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              amount: order.amount as number,
              currency: order.currency,
            });
            toast.success("Appointment booked successfully!");
            navigate("/hospital-appointments");
          } catch (err) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || "Payment verification failed");
          } finally {
            setBooking(false);
          }
        },
        () => {
          toast.error("Payment cancelled");
          setBooking(false);
        }
      );
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to create order");
      setBooking(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Book Hospital Appointment</h1>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : !hospital ? (
          <p className="text-gray-500">Hospital not found</p>
        ) : (
          <div className="space-y-4">
            {/* Info card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">{hospital.name}</h2>
                    <p className="text-sm text-blue-600">{department?.name}</p>
                    {doctorName && <p className="text-sm text-gray-500">Dr. {doctorName}</p>}
                  </div>
                  {consultationFee > 0 && (
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <IndianRupee className="h-4 w-4" />
                      {consultationFee}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slot picker */}
            {doctorId && departmentId && (
              <SlotPicker
                doctorId={doctorId}
                departmentId={departmentId}
                onSlotSelect={(slot, date) => { setSelectedSlot(slot); setSelectedDate(date); }}
                selectedSlot={selectedSlot}
                isHospital
              />
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Reason for visit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
              />
              <p className="text-xs text-gray-400 text-right">{notes.length}/300</p>
            </div>

            {selectedSlot && selectedDate && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 flex items-center gap-2 text-sm text-blue-800">
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              disabled={!selectedSlot || !selectedDate || booking}
              onClick={handleBook}
            >
              {booking
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                : `Pay ₹${consultationFee} & Book`
              }
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
