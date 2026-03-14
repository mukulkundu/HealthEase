import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, IndianRupee } from "lucide-react";
import type { DoctorProfile } from "../../types";

interface Props {
  doctor: DoctorProfile;
}

export default function DoctorCard({ doctor }: Props) {
  const name = doctor.user?.name ?? "Doctor";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={doctor.avatarUrl} alt={name} />
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  Dr. {name}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {doctor.specialization}
                </p>
              </div>
              {/* Rating */}
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {doctor.rating != null && doctor.rating > 0 ? doctor.rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>

            {/* Details row */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {doctor.experience} yr{doctor.experience !== 1 ? "s" : ""} exp
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                {doctor.consultationFee} / visit
              </span>
            </div>

            {/* Languages */}
            <div className="mt-2 flex flex-wrap gap-1">
              {doctor.languages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/doctors/${doctor.id}`}>View Profile</Link>
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <Link to={`/book/${doctor.id}`}>Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}