import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DoctorFilters {
  name: string;
  specialization: string;
  minFee: number | "";
  maxFee: number | "";
  minExperience: number | "";
  minRating: number | "";
  languages: string[];
  availableOn: string;
  sortBy: "rating" | "fee_asc" | "fee_desc" | "experience";
}

interface Props {
  filters: DoctorFilters;
  onChange: (filters: DoctorFilters) => void;
  onReset: () => void;
  resultCount: number;
}

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "General Medicine",
  "Gynecology",
  "Psychiatry",
  "Dentistry",
  "Ophthalmology",
  "ENT",
  "Radiology",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
];

const DAYS = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
  { label: "Sun", value: "SUNDAY" },
];

export default function DoctorFilterPanel({ filters, onChange, onReset, resultCount }: Props) {
  const hasActiveFilters =
    !!filters.name ||
    !!filters.specialization ||
    filters.minFee !== "" ||
    filters.maxFee !== "" ||
    filters.minExperience !== "" ||
    filters.minRating !== "" ||
    filters.languages.length > 0 ||
    !!filters.availableOn ||
    filters.sortBy !== "rating";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Filters</h3>
          <p className="text-xs text-gray-500">{resultCount} results</p>
        </div>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={onReset}>
            Reset all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Sort By</p>
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onChange({ ...filters, sortBy: value as DoctorFilters["sortBy"] })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Best Rated</SelectItem>
            <SelectItem value="fee_asc">Fee: Low to High</SelectItem>
            <SelectItem value="fee_desc">Fee: High to Low</SelectItem>
            <SelectItem value="experience">Most Experienced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Specialization</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <Badge
              key={spec}
              variant={filters.specialization === spec ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                onChange({
                  ...filters,
                  specialization: filters.specialization === spec ? "" : spec,
                })
              }
            >
              {spec}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Consultation Fee</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min Fee (Rs)"
            value={filters.minFee}
            onChange={(e) =>
              onChange({
                ...filters,
                minFee: e.target.value ? Number(e.target.value) : "",
              })
            }
          />
          <Input
            type="number"
            placeholder="Max Fee (Rs)"
            value={filters.maxFee}
            onChange={(e) =>
              onChange({
                ...filters,
                maxFee: e.target.value ? Number(e.target.value) : "",
              })
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onChange({ ...filters, minFee: "", maxFee: 500 })}>
            Under Rs500
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange({ ...filters, minFee: 500, maxFee: 1000 })}>
            Rs500-Rs1000
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange({ ...filters, minFee: 1000, maxFee: 2000 })}>
            Rs1000-Rs2000
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange({ ...filters, minFee: 2000, maxFee: "" })}>
            Rs2000+
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Experience</p>
        <div className="flex flex-wrap gap-2">
          {[0, 2, 5, 10, 15].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filters.minExperience === (value || "") ? "default" : "outline"}
              onClick={() => onChange({ ...filters, minExperience: value === 0 ? "" : value })}
            >
              {value === 0 ? "Any" : `${value}+ years`}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Rating</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              size="sm"
              variant={filters.minRating === star ? "default" : "outline"}
              onClick={() =>
                onChange({ ...filters, minRating: filters.minRating === star ? "" : star })
              }
            >
              {`${star}★ & above`}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Languages</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((language) => (
            <label key={language} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.languages.includes(language)}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    languages: e.target.checked
                      ? [...filters.languages, language]
                      : filters.languages.filter((item) => item !== language),
                  })
                }
              />
              {language}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Available On</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <Button
              key={day.value}
              size="sm"
              variant={filters.availableOn === day.value ? "default" : "outline"}
              onClick={() =>
                onChange({
                  ...filters,
                  availableOn: filters.availableOn === day.value ? "" : day.value,
                })
              }
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
