import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import DoctorCard from "../../components/shared/DoctorCard";
import DoctorFilterPanel, {
  type DoctorFilters,
} from "../../components/shared/DoctorFilterPanel";
import Navbar from "../../components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DoctorProfile } from "../../types";

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
  const parseFiltersFromParams = (params: URLSearchParams): DoctorFilters => ({
    name: params.get("name") ?? "",
    specialization: params.get("specialization") ?? "",
    minFee: params.get("minFee") ? Number(params.get("minFee")) : "",
    maxFee: params.get("maxFee") ? Number(params.get("maxFee")) : "",
    minExperience: params.get("minExperience")
      ? Number(params.get("minExperience"))
      : "",
    minRating: params.get("minRating") ? Number(params.get("minRating")) : "",
    languages: params.get("languages")
      ? (params.get("languages") as string).split(",").filter(Boolean)
      : [],
    availableOn: params.get("availableOn") ?? "",
    sortBy:
      (params.get("sortBy") as DoctorFilters["sortBy"] | null) ?? "rating",
  });

  const countActiveFilters = (filters: DoctorFilters) =>
    [
      filters.name,
      filters.specialization,
      filters.minFee,
      filters.maxFee,
      filters.minExperience,
      filters.minRating,
      filters.languages.length ? "languages" : "",
      filters.availableOn,
      filters.sortBy !== "rating" ? filters.sortBy : "",
    ].filter(Boolean).length;

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<DoctorFilters>(
    parseFiltersFromParams(searchParams)
  );
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debouncing, setDebouncing] = useState(false);
  const [error, setError] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const syncUrl = (next: DoctorFilters) => {
    const params = new URLSearchParams();
    if (next.name) params.set("name", next.name);
    if (next.specialization) params.set("specialization", next.specialization);
    if (next.minFee !== "") params.set("minFee", String(next.minFee));
    if (next.maxFee !== "") params.set("maxFee", String(next.maxFee));
    if (next.minExperience !== "") params.set("minExperience", String(next.minExperience));
    if (next.minRating !== "") params.set("minRating", String(next.minRating));
    if (next.languages.length) params.set("languages", next.languages.join(","));
    if (next.availableOn) params.set("availableOn", next.availableOn);
    if (next.sortBy && next.sortBy !== "rating") params.set("sortBy", next.sortBy);
    setSearchParams(params);
  };

  const fetchDoctors = async (targetPage = 1, append = false) => {
    setLoading(true);
    setError(false);
    try {
      const data = await doctorApi.getAll({
        name: filters.name || undefined,
        specialization: filters.specialization || undefined,
        minFee: filters.minFee === "" ? undefined : filters.minFee,
        maxFee: filters.maxFee === "" ? undefined : filters.maxFee,
        minExperience:
          filters.minExperience === "" ? undefined : filters.minExperience,
        minRating: filters.minRating === "" ? undefined : filters.minRating,
        languages: filters.languages.length ? filters.languages : undefined,
        availableOn: filters.availableOn || undefined,
        sortBy: filters.sortBy,
        page: targetPage,
        limit: 12,
      });
      setDoctors((prev) =>
        append ? [...prev, ...(data.doctors ?? [])] : data.doctors ?? []
      );
      setTotal(data.total ?? 0);
      setPage(data.page ?? targetPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      if (!append) {
        setDoctors([]);
      }
      setError(true);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    setDebouncing(true);
    const timer = window.setTimeout(() => {
      setDebouncing(false);
      fetchDoctors(1, false);
    }, 400);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const clearFilters = () => {
    const resetFilters: DoctorFilters = {
      name: "",
      specialization: "",
      minFee: "",
      maxFee: "",
      minExperience: "",
      minRating: "",
      languages: [],
      availableOn: "",
      sortBy: "rating",
    };
    setFilters(resetFilters);
    syncUrl(resetFilters);
  };

  const hasFilters = countActiveFilters(filters) > 0;
  const activeFilterTags = (() => {
    const tags: Array<{ label: string; onRemove: () => void }> = [];
    if (filters.specialization) {
      tags.push({
        label: filters.specialization,
        onRemove: () => {
          const next = { ...filters, specialization: "" };
          setFilters(next);
          syncUrl(next);
        },
      });
    }
    if (filters.minExperience !== "") {
      tags.push({
        label: `${filters.minExperience}+ years`,
        onRemove: () => {
          const next = { ...filters, minExperience: "" };
          setFilters(next);
          syncUrl(next);
        },
      });
    }
    if (filters.minRating !== "") {
      tags.push({
        label: `${filters.minRating}★ & above`,
        onRemove: () => {
          const next = { ...filters, minRating: "" };
          setFilters(next);
          syncUrl(next);
        },
      });
    }
    if (filters.minFee !== "" || filters.maxFee !== "") {
      tags.push({
        label: `Fee: ${filters.minFee || 0}-${filters.maxFee || "Any"}`,
        onRemove: () => {
          const next = { ...filters, minFee: "", maxFee: "" };
          setFilters(next);
          syncUrl(next);
        },
      });
    }
    return tags;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-500 mt-1">Browse our verified doctors</p>
        </div>

        <div className="md:hidden flex items-center gap-2 mb-4">
          <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {hasFilters && (
                  <Badge className="ml-2 h-5 min-w-5 rounded-full px-1">
                    {countActiveFilters(filters)}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter doctors</DialogTitle>
              </DialogHeader>
              <DoctorFilterPanel
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  syncUrl(next);
                }}
                onReset={clearFilters}
                resultCount={total}
              />
            </DialogContent>
          </Dialog>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            syncUrl(filters);
            fetchDoctors(1, false);
          }}
          className="flex gap-2 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, qualification, bio..."
              className="pl-9"
              value={filters.name}
              onChange={(e) => {
                const next = { ...filters, name: e.target.value };
                setFilters(next);
                syncUrl(next);
              }}
            />
          </div>
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear all filters
            </Button>
          )}
        </form>

        <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-6">
          <aside className="hidden md:block">
            <div className="sticky top-20 rounded-xl border bg-white p-4">
              <DoctorFilterPanel
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  syncUrl(next);
                }}
                onReset={clearFilters}
                resultCount={total}
              />
            </div>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{total} doctors found</p>
              <div className="flex items-center gap-2">
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => {
                    const next = {
                      ...filters,
                      sortBy: value as DoctorFilters["sortBy"],
                    };
                    setFilters(next);
                    syncUrl(next);
                  }}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Best Rated</SelectItem>
                    <SelectItem value="fee_asc">Fee: Low to High</SelectItem>
                    <SelectItem value="fee_desc">Fee: High to Low</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>
                {debouncing && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating filters...
                  </p>
                )}
              </div>
            </div>
            {filters.name && (
              <p className="text-xs text-gray-500 mb-3">
                {total} results for "{filters.name}"
              </p>
            )}
            {activeFilterTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilterTags.map((tag) => (
                  <Badge key={tag.label} variant="secondary" className="cursor-pointer">
                    <span className="mr-1">{tag.label}</span>
                    <button type="button" onClick={tag.onRemove}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {loading && doctors.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <DoctorCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-medium">Could not load doctors</p>
                <p className="text-sm mt-1">Please try again</p>
                <Button className="mt-4" onClick={() => fetchDoctors(1, false)}>
                  Retry
                </Button>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-medium">No doctors match your filters</p>
                {hasFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Showing 1-{doctors.length} of {total} doctors
                </p>
                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchDoctors(page + 1, true)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
