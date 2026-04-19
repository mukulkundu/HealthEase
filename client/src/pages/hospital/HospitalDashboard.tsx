import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalApi } from "../../api/hospital.api";
import { hospitalAppointmentApi } from "../../api/hospitalAppointment.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, CalendarCheck, Users, ClipboardList, Loader2, AlertCircle } from "lucide-react";
import type { Hospital, HospitalAppointment } from "../../types";

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [noHospital, setNoHospital] = useState(false);

  useEffect(() => {
    hospitalApi
      .getMyHospital()
      .then((h) => {
        setHospital(h);
        return hospitalAppointmentApi.getHospitalAppointments();
      })
      .then(setAppointments)
      .catch((err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNoHospital(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const today = appointments.filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your hospital operations</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : noHospital ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-10 w-10 text-orange-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No hospital registered yet</h2>
              <p className="text-sm text-gray-500 mb-5">Set up your hospital profile to get started</p>
              <Button asChild>
                <Link to="/hospital/setup">Register Hospital</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hospital info */}
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{hospital?.name}</h2>
                    <Badge variant="outline" className={hospital?.status === "APPROVED"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
                      {hospital?.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {hospital?.address}, {hospital?.city}, {hospital?.state}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/hospital/setup">Edit</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Departments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Array.isArray(hospital?.departments) ? hospital.departments.length : 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{appointments.length}</p>
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
                  <p className="text-xs text-gray-500">Today</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{today}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Departments", href: "/hospital/departments", icon: <ClipboardList className="h-5 w-5" /> },
                { label: "Staff", href: "/hospital/staff", icon: <Users className="h-5 w-5" /> },
                { label: "Appointments", href: "/hospital/appointments", icon: <CalendarCheck className="h-5 w-5" /> },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-3 rounded-lg border bg-white p-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-blue-600">{item.icon}</span>
                  <span className="font-medium text-sm text-gray-900">{item.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
