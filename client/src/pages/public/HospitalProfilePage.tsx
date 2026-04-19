import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hospitalApi } from "../../api/hospital.api";
import { useAuthStore } from "../../store/authStore";
import Navbar from "../../components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, Globe, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { Hospital, Department } from "../../types";

export default function HospitalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    hospitalApi
      .getById(id)
      .then(setHospital)
      .catch(() => setHospital(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = (dept: Department, doctorId: string) => {
    if (!user) {
      navigate(`/login`);
      return;
    }
    navigate(`/hospitals/${id}/book/${doctorId}/${dept.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : !hospital ? (
          <div className="text-center py-20 text-gray-500">Hospital not found</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
                    <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{hospital.phone}</span>
                      {hospital.website && (
                        <a href={hospital.website} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Globe className="h-3.5 w-3.5" />Website
                        </a>
                      )}
                    </div>
                    {hospital.description && (
                      <p className="text-sm text-gray-600 mt-3">{hospital.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Departments */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Departments & Doctors</h2>
              {!Array.isArray(hospital.departments) || hospital.departments.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-gray-500">
                    No departments listed yet
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {hospital.departments.map((dept) => (
                    <Card key={dept.id} className="overflow-hidden">
                      <button
                        type="button"
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-500">
                            {Array.isArray(dept.departmentDoctors) ? dept.departmentDoctors.length : 0} doctor(s)
                          </p>
                        </div>
                        {expandedDept === dept.id
                          ? <ChevronUp className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />}
                      </button>

                      {expandedDept === dept.id && (
                        <div className="border-t px-5 py-3 space-y-3">
                          {!Array.isArray(dept.departmentDoctors) || dept.departmentDoctors.length === 0 ? (
                            <p className="text-sm text-gray-500">No doctors in this department</p>
                          ) : (
                            dept.departmentDoctors.map((dd) => (
                              <div key={dd.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    Dr. {dd.doctor?.user?.name ?? "—"}
                                  </p>
                                  <p className="text-xs text-gray-500">{dd.doctor?.specialization}</p>
                                  <Badge variant="outline" className="mt-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                    ₹{dd.consultationFee}
                                  </Badge>
                                </div>
                                {user?.role === "PATIENT" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBook(dept, dd.doctorId)}
                                  >
                                    Book
                                  </Button>
                                )}
                                {!user && (
                                  <Button size="sm" onClick={() => navigate("/login")}>
                                    Book
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
