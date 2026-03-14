import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import DoctorCard from "../../components/shared/DoctorCard";
import Navbar from "../../components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { DoctorProfile } from "../../types";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "General Medicine",
  "Gynecology",
  "Psychiatry",
];

function DoctorCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 flex-1 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 flex-1 bg-gray-100 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DoctorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nameSearch, setNameSearch] = useState(searchParams.get("name") ?? "");
  const [activeSpec, setActiveSpec] = useState(searchParams.get("specialization") ?? "");

  const fetchDoctors = async (opts?: { name?: string; spec?: string }) => {
    setLoading(true);
    setError(false);
    const name = opts?.name !== undefined ? opts.name : nameSearch;
    const spec = opts?.spec !== undefined ? opts.spec : activeSpec;
    try {
      const data = await doctorApi.getAll({
        specialization: spec || undefined,
        name: name || undefined,
      });
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
      setError(true);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [activeSpec]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(nameSearch ? { name: nameSearch } : {});
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
    fetchDoctors({ name: "", spec: "" });
  };

  const hasFilters = !!nameSearch || !!activeSpec;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-500 mt-1">Browse our verified doctors</p>
        </div>

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
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear all filters
            </Button>
          )}
        </form>

        <div className="flex flex-wrap gap-2 mb-6">
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

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">Could not load doctors</p>
            <p className="text-sm mt-1">Please try again</p>
            <Button className="mt-4" onClick={() => fetchDoctors()}>
              Retry
            </Button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">
              {hasFilters
                ? "No doctors match your search. Try different filters."
                : "No doctors available yet."}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
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
