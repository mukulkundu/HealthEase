import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { hospitalApi } from "../../api/hospital.api";
import HospitalFilterPanel, {
  type HospitalFilters,
} from "../../components/shared/HospitalFilterPanel";
import Navbar from "../../components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, MapPin, Phone, Loader2, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import type { Hospital } from "../../types";

export default function HospitalListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parseFilters = (params: URLSearchParams): HospitalFilters => ({
    name: params.get("name") ?? params.get("q") ?? "",
    city: params.get("city") ?? "",
    state: params.get("state") ?? "",
    department: params.get("department") ?? "",
  });

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HospitalFilters>(parseFilters(searchParams));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [debouncing, setDebouncing] = useState(false);

  const syncUrl = (next: HospitalFilters) => {
    const params = new URLSearchParams();
    if (next.name) params.set("name", next.name);
    if (next.city) params.set("city", next.city);
    if (next.state) params.set("state", next.state);
    if (next.department) params.set("department", next.department);
    setSearchParams(params);
  };

  const fetchHospitals = (targetPage = 1, append = false) => {
    setLoading(true);
    hospitalApi
      .listHospitals({
        name: filters.name || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        department: filters.department || undefined,
        page: targetPage,
        limit: 12,
      })
      .then((res) => {
        setHospitals((prev) =>
          append ? [...prev, ...(res.hospitals ?? [])] : res.hospitals ?? []
        );
        setTotal(res.total ?? 0);
        setPage(res.page ?? targetPage);
        setHasMore(Boolean(res.hasMore));
      })
      .catch(() => {
        toast.error("Failed to load hospitals");
        if (!append) {
          setHospitals([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setFilters(parseFilters(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    setDebouncing(true);
    const timer = window.setTimeout(() => {
      setDebouncing(false);
      fetchHospitals(1, false);
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const activeFilterTags = useMemo(
    () =>
      [
        filters.name,
        filters.city,
        filters.state,
        filters.department ? `Dept: ${filters.department}` : "",
      ].filter(Boolean),
    [filters]
  );

  const clearAll = () => {
    const reset = { name: "", city: "", state: "", department: "" };
    setFilters(reset);
    syncUrl(reset);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
          <p className="text-gray-500 mt-2">Browse hospitals and book specialist appointments</p>
        </div>

        <div className="md:hidden flex items-center justify-between mb-4">
          <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter hospitals</DialogTitle>
              </DialogHeader>
              <HospitalFilterPanel
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  syncUrl(next);
                }}
                onReset={clearAll}
                resultCount={total}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-6">
          <aside className="hidden md:block">
            <div className="sticky top-20 rounded-xl border bg-white p-4">
              <HospitalFilterPanel
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  syncUrl(next);
                }}
                onReset={clearAll}
                resultCount={total}
              />
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{total} hospitals found</p>
              {debouncing && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating filters...
                </p>
              )}
            </div>

            {activeFilterTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilterTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
            )}

            {loading && hospitals.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading hospitals...
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No hospitals found</p>
                <Button variant="outline" className="mt-3" onClick={clearAll}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
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
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => fetchHospitals(page + 1, true)} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
