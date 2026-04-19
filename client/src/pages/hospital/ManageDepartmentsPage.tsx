import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hospitalApi } from "../../api/hospital.api";
import { departmentApi } from "../../api/department.api";
import { doctorApi } from "../../api/doctor.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Hospital, Department } from "../../types";

interface DoctorOption { id: string; name: string; specialization: string; }

export default function ManageDepartmentsPage() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState("");
  const [addingDept, setAddingDept] = useState(false);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [addDoctorDeptId, setAddDoctorDeptId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorFee, setDoctorFee] = useState("");
  const [addingDoctor, setAddingDoctor] = useState(false);

  useEffect(() => {
    hospitalApi
      .getMyHospital()
      .then((h) => {
        setHospital(h);
        return departmentApi.listForHospital(h.id);
      })
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoading(false));

    doctorApi
      .getAll()
      .then((list) => setDoctors(
        list.map((d) => ({ id: d.id, name: d.user?.name ?? "—", specialization: d.specialization }))
      ))
      .catch(() => {});
  }, []);

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    try {
      const dept = await departmentApi.create(newDeptName.trim());
      setDepartments((p) => [...p, dept]);
      setNewDeptName("");
      toast.success("Department created");
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to create department");
    } finally {
      setAddingDept(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      await departmentApi.delete(id);
      setDepartments((p) => p.filter((d) => d.id !== id));
      toast.success("Department deleted");
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const handleAddDoctor = async () => {
    if (!addDoctorDeptId || !selectedDoctorId || !doctorFee) return;
    setAddingDoctor(true);
    try {
      await departmentApi.addDoctor(addDoctorDeptId, selectedDoctorId, Number(doctorFee));
      const updated = await departmentApi.listForHospital(hospital!.id);
      setDepartments(updated);
      setAddDoctorDeptId(null);
      setSelectedDoctorId("");
      setDoctorFee("");
      toast.success("Doctor added to department");
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to add doctor");
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleRemoveDoctor = async (deptId: string, doctorId: string) => {
    try {
      await departmentApi.removeDoctor(deptId, doctorId);
      const updated = await departmentApi.listForHospital(hospital!.id);
      setDepartments(updated);
      toast.success("Doctor removed");
    } catch {
      toast.error("Failed to remove doctor");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Manage departments and assign doctors</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : !hospital ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500 text-sm">
              Register your hospital first before managing departments.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Add department */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Cardiology"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDept()}
                  />
                  <Button onClick={handleAddDept} disabled={addingDept || !newDeptName.trim()}>
                    {addingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Departments list */}
            {departments.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-gray-500 text-sm">
                  No departments yet. Add your first department above.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {departments.map((dept) => (
                  <Card key={dept.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{dept.name}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => setAddDoctorDeptId(addDoctorDeptId === dept.id ? null : dept.id)}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Add Doctor
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDept(dept.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Add doctor form */}
                      {addDoctorDeptId === dept.id && (
                        <div className="rounded-lg border bg-gray-50 p-3 mb-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Doctor</Label>
                              <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                              >
                                <option value="">Select doctor...</option>
                                {doctors.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    Dr. {d.name} ({d.specialization})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Consultation Fee (₹)</Label>
                              <Input
                                type="number"
                                placeholder="500"
                                value={doctorFee}
                                onChange={(e) => setDoctorFee(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={addingDoctor || !selectedDoctorId || !doctorFee}
                            onClick={handleAddDoctor}
                          >
                            {addingDoctor ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            Add to Department
                          </Button>
                        </div>
                      )}

                      {/* Doctors in department */}
                      {Array.isArray(dept.departmentDoctors) && dept.departmentDoctors.length > 0 ? (
                        <div className="space-y-2">
                          {dept.departmentDoctors.filter((dd) => dd.isActive).map((dd) => (
                            <div key={dd.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  Dr. {dd.doctor?.user?.name ?? "—"}
                                </p>
                                <p className="text-xs text-gray-500">{dd.doctor?.specialization}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                  ₹{dd.consultationFee}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 h-7 w-7 p-0"
                                  onClick={() => handleRemoveDoctor(dept.id, dd.doctorId)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No doctors assigned yet</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
