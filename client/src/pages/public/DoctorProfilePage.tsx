import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import { scheduleApi } from "../../api/schedule.api";
import Navbar from "../../components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star, Clock, IndianRupee, Languages,
  GraduationCap, Loader2, CalendarCheck,
} from "lucide-react";
import type { DoctorProfile, Schedule } from "../../types";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([doctorApi.getById(id), scheduleApi.getByDoctor(id)])
      .then(([doc, sch]) => {
        setDoctor(doc ?? null);
        setSchedules(Array.isArray(sch) ? sch.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)) : []);
      })
      .catch(() => {
        setDoctor(null);
        setSchedules([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-500">Doctor not found.</div>
      </div>
    );
  }

  const initials = doctor.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Profile header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={doctor.avatarUrl} alt={doctor.user?.name ?? "Doctor"} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dr. {doctor.user?.name ?? "Doctor"}
                  </h1>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {doctor.rating > 0 ? `${doctor.rating.toFixed(1)} (${doctor.totalReviews} reviews)` : "No reviews yet"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {doctor.experience} year{doctor.experience !== 1 ? "s" : ""} experience
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                    ₹{doctor.consultationFee} per visit
                  </span>
                </div>

                {/* Qualifications */}
                <div className="flex items-center gap-2 flex-wrap">
                  <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                  {doctor.qualifications.map((q) => (
                    <Badge key={q} variant="secondary">{q}</Badge>
                  ))}
                </div>

                {/* Languages */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Languages className="h-4 w-4 text-gray-400 shrink-0" />
                  {doctor.languages.map((l) => (
                    <Badge key={l} variant="outline">{l}</Badge>
                  ))}
                </div>
              </div>

              {/* Book button */}
              <div className="sm:self-start shrink-0">
                <Button size="lg" asChild>
                  <Link to={`/book/${doctor.id}`}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
              </div>
            </div>

            {/* Bio */}
            {doctor.bio && (
              <div className="mt-5 pt-5 border-t">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Weekly Availability</h2>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500">No schedule set yet.</p>
            ) : (
              <div className="space-y-2">
                {schedules.filter((s) => s.isActive).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-700 w-28 capitalize">
                      {s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {s.startTime} – {s.endTime}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.slotDuration} min slots
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}