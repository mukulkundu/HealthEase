import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hospitalApi } from "../../api/hospital.api";
import Navbar from "../../components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Search, Loader2 } from "lucide-react";
import type { Hospital } from "../../types";

export default function HospitalListPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchHospitals = (q?: string) => {
    setLoading(true);
    hospitalApi
      .listHospitals(q)
      .then(setHospitals)
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHospitals(query.trim() || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
          <p className="text-gray-500 mt-2">Browse hospitals and book specialist appointments</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or city..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading hospitals...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>No hospitals found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {hospitals.map((h) => (
              <Link key={h.id} to={`/hospitals/${h.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base">{h.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{h.address}, {h.city}, {h.state}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {h.phone}
                        </div>
                        {Array.isArray(h.departments) && h.departments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {h.departments.slice(0, 4).map((d) => (
                              <Badge key={d.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {d.name}
                              </Badge>
                            ))}
                            {h.departments.length > 4 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{h.departments.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
