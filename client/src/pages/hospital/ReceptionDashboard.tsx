import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalApi } from "../../api/hospital.api";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CalendarCheck, Clock, Loader2 } from "lucide-react";
import type { Hospital, HospitalAppointment } from "../../types";

function to12h(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  } catch { return t; }
}

export default function ReceptionDashboard() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalApi
      .getHospitalForStaff()
      .then((h) => {
        setHospital(h);
        return hospitalAppointmentApi.getReceptionistAppointments();
      })
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = appointments.filter((a) => {
    const d = new Date(a.date);
    return d.toDateString() === new Date().toDateString();
  });
  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reception Desk</h1>
          <p className="text-gray-500 mt-1">
            {hospital ? hospital.name : "Loading hospital..."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            {hospital && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{hospital.name}</p>
                    <p className="text-xs text-gray-500">{hospital.city}, {hospital.state}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Today's Appointments</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{today.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{pending}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{confirmed}</p>
                </CardContent>
              </Card>
            </div>

            {today.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Today's Schedule</h2>
                <div className="space-y-2">
                  {today.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.patient?.name}</p>
                        <p className="text-xs text-gray-500">{a.department?.name} — Dr. {a.doctor?.user?.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {to12h(a.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button asChild className="w-full">
              <Link to="/hospital/reception/appointments">
                <CalendarCheck className="h-4 w-4 mr-2" />
                View All Appointments
              </Link>
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
