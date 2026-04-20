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

export interface HospitalFilters {
  name: string;
  city: string;
  state: string;
  department: string;
}

interface Props {
  filters: HospitalFilters;
  onChange: (filters: HospitalFilters) => void;
  onReset: () => void;
  resultCount: number;
}

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];

const STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
];

export default function HospitalFilterPanel({ filters, onChange, onReset, resultCount }: Props) {
  const hasActiveFilters =
    !!filters.name || !!filters.city || !!filters.state || !!filters.department;

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
        <p className="text-sm font-medium">Search by name</p>
        <Input
          placeholder="Hospital name"
          value={filters.name}
          onChange={(e) => onChange({ ...filters, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">City</p>
        <Input
          placeholder="Type city"
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <Badge
              key={city}
              variant={filters.city === city ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                onChange({ ...filters, city: filters.city === city ? "" : city })
              }
            >
              {city}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">State</p>
        <Select
          value={filters.state || "ALL"}
          onValueChange={(value) =>
            onChange({ ...filters, state: value === "ALL" ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any</SelectItem>
            {STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Department</p>
        <Input
          placeholder="e.g. cardio"
          value={filters.department}
          onChange={(e) => onChange({ ...filters, department: e.target.value })}
        />
      </div>
    </div>
  );
}
