import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import DoctorCard from "../../components/shared/DoctorCard";
import Navbar from "../../components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X } from "lucide-react";
import type { DoctorProfile } from "../../types";

const SPECIALIZATIONS = [
  "Cardiology", "Dermatology", "Pediatrics",
  "Orthopedics", "Neurology", "General Medicine",
  "Gynecology", "Psychiatry",
];

export default function DoctorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState(searchParams.get("name") || "");
  const [activeSpec, setActiveSpec] = useState(searchParams.get("specialization") || "");

  useEffect(() => {
    fetchDoctors();
  }, [activeSpec]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorApi.getAll({
        specialization: activeSpec || undefined,
        name: nameSearch || undefined,
      });
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleSpecClick = (spec: string) => {
    const next = activeSpec === spec ? "" : spec;
    setActiveSpec(next);
    setSearchParams(next ? { specialization: next } : {});
  };

  const clearFilters = () => {
    setActiveSpec("");
    setNameSearch("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-500 mt-1">
            Browse our verified independent doctors
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name..."
              className="pl-9"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
          {(nameSearch || activeSpec) && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </form>

        {/* Specialization filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SPECIALIZATIONS.map((spec) => (
            <Badge
              key={spec}
              variant={activeSpec === spec ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => handleSpecClick(spec)}
            >
              {spec}
            </Badge>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No doctors found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}