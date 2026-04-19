import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { departmentApi } from "../../api/department.api";
import { hospitalScheduleApi } from "../../api/hospitalSchedule.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { DepartmentDoctor, HospitalSchedule, DayOfWeek } from "../../types";

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function MyHospitalsPage() {
  const navigate = useNavigate();
  const [myDepts, setMyDepts] = useState<DepartmentDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, HospitalSchedule[]>>({});
  const [loadingSchedules, setLoadingSchedules] = useState<Record<string, boolean>>({});
  const [scheduleForm, setScheduleForm] = useState<Record<string, {
    dayOfWeek: DayOfWeek; startTime: string; endTime: string; slotDuration: string; bufferTime: string;
  }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    departmentApi
      .getMyDepartments()
      .then(setMyDepts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSchedules = (departmentId: string) => {
    if (schedules[departmentId]) return;
    setLoadingSchedules((p) => ({ ...p, [departmentId]: true }));
    hospitalScheduleApi
      .getMySchedules(departmentId)
      .then((s) => setSchedules((p) => ({ ...p, [departmentId]: s })))
      .catch(() => {})
      .finally(() => setLoadingSchedules((p) => ({ ...p, [departmentId]: false })));
  };

  const toggleDept = (deptId: string) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
      loadSchedules(deptId);
    }
  };

  const handleSaveSchedule = async (deptId: string) => {
    const form = scheduleForm[deptId];
    if (!form?.dayOfWeek || !form.startTime || !form.endTime || !form.slotDuration) {
      toast.error("Please fill all schedule fields");
      return;
    }
    setSaving((p) => ({ ...p, [deptId]: true }));
    try {
      await hospitalScheduleApi.upsert({
        departmentId: deptId,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: Number(form.slotDuration),
        bufferTime: Number(form.bufferTime ?? 0),
      });
      const updated = await hospitalScheduleApi.getMySchedules(deptId);
      setSchedules((p) => ({ ...p, [deptId]: updated }));
      setScheduleForm((p) => ({ ...p, [deptId]: { dayOfWeek: "MONDAY", startTime: "", endTime: "", slotDuration: "", bufferTime: "" } }));
      toast.success("Schedule saved");
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save schedule");
    } finally {
      setSaving((p) => ({ ...p, [deptId]: false }));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Hospitals</h1>
          <p className="text-gray-500 mt-1">Departments you're assigned to and your hospital schedules</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : myDepts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">You are not assigned to any hospital departments yet.</p>
              <p className="text-xs text-gray-400 mt-1">A hospital admin must add you to a department first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myDepts.map((dd) => (
              <Card key={dd.id} className="overflow-hidden">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleDept(dd.departmentId)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <h3 className="font-medium text-gray-900">
                        {dd.department?.hospital?.name ?? "Hospital"}
                      </h3>
                    </div>
                    <p className="text-sm text-blue-600 mt-0.5 pl-6">{dd.department?.name}</p>
                    <Badge variant="outline" className="mt-1 ml-6 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      ₹{dd.consultationFee}
                    </Badge>
                  </div>
                  {expandedDept === dd.departmentId
                    ? <ChevronUp className="h-4 w-4 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {expandedDept === dd.departmentId && (
                  <div className="border-t px-5 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> Schedule
                      </h4>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/doctor/hospital-appointments`)}>
                        View Appointments
                      </Button>
                    </div>

                    {loadingSchedules[dd.departmentId] ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <>
                        {Array.isArray(schedules[dd.departmentId]) && schedules[dd.departmentId].length > 0 && (
                          <div className="space-y-1.5">
                            {schedules[dd.departmentId].map((s) => (
                              <div key={s.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                                <span className="font-medium text-gray-700">{s.dayOfWeek}</span>
                                <span className="text-gray-500">{s.startTime} – {s.endTime}</span>
                                <span className="text-gray-400 text-xs">{s.slotDuration}min slots</span>
                                <Badge variant="outline" className={`text-[10px] ${s.isActive ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                                  {s.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
                          <p className="text-xs font-medium text-gray-600">Add / Update Schedule</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Day</Label>
                              <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={scheduleForm[dd.departmentId]?.dayOfWeek ?? "MONDAY"}
                                onChange={(e) => setScheduleForm((p) => ({
                                  ...p,
                                  [dd.departmentId]: { ...p[dd.departmentId], dayOfWeek: e.target.value as DayOfWeek }
                                }))}
                              >
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Slot Duration (min)</Label>
                              <Input
                                type="number"
                                placeholder="30"
                                value={scheduleForm[dd.departmentId]?.slotDuration ?? ""}
                                onChange={(e) => setScheduleForm((p) => ({
                                  ...p,
                                  [dd.departmentId]: { ...p[dd.departmentId], slotDuration: e.target.value }
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                value={scheduleForm[dd.departmentId]?.startTime ?? ""}
                                onChange={(e) => setScheduleForm((p) => ({
                                  ...p,
                                  [dd.departmentId]: { ...p[dd.departmentId], startTime: e.target.value }
                                }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                value={scheduleForm[dd.departmentId]?.endTime ?? ""}
                                onChange={(e) => setScheduleForm((p) => ({
                                  ...p,
                                  [dd.departmentId]: { ...p[dd.departmentId], endTime: e.target.value }
                                }))}
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={saving[dd.departmentId]}
                            onClick={() => handleSaveSchedule(dd.departmentId)}
                          >
                            {saving[dd.departmentId] && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                            Save Schedule
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
