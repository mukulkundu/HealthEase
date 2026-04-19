import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doctorApi } from "../../api/doctor.api";
import { scheduleApi } from "../../api/schedule.api";
import { reviewApi } from "../../api/review.api";
import { useAuthStore } from "../../store/authStore";
import Navbar from "../../components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReviewCard from "../../components/shared/ReviewCard";
import StarRating from "../../components/shared/StarRating";
import {
  Star,
  Clock,
  IndianRupee,
  Languages,
  GraduationCap,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import type { DoctorProfile, Schedule, Review } from "../../types";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([doctorApi.getById(id), scheduleApi.getByDoctor(id)])
      .then(([doc, sch]) => {
        setDoctor(doc ?? null);
        setSchedules(
          Array.isArray(sch)
            ? sch.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
            : []
        );
      })
      .catch(() => {
        setDoctor(null);
        setSchedules([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const loadReviews = (page: number) => {
    if (!id) return;
    setReviewsLoading(true);
    reviewApi
      .getDoctorReviews(id, page)
      .then((res) => {
        if (page === 1) {
          setReviews(Array.isArray(res.reviews) ? res.reviews : []);
        } else {
          setReviews((prev) => [
            ...prev,
            ...(Array.isArray(res.reviews) ? res.reviews : []),
          ]);
        }
        setReviewsTotal(res.total);
        setReviewsPage(res.page);
        setReviewsTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    if (!loading && id) loadReviews(1);
  }, [loading, id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium">Doctor not found</p>
        </div>
      </div>
    );
  }

  const name = doctor.user?.name ?? "Doctor";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
  const canBook = isAuthenticated && user?.role === "PATIENT";
  const bookHref = canBook ? `/book/${doctor.id}` : `/login?redirect=${encodeURIComponent(`/book/${doctor.id}`)}`;

  const scheduleByDay = new Map(schedules.filter((s) => s.isActive).map((s) => [s.dayOfWeek, s]));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={doctor.avatarUrl} alt={name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">Dr. {name}</h1>
                <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {doctor.rating > 0
                      ? `${doctor.rating.toFixed(1)} (${doctor.totalReviews} reviews)`
                      : "No reviews yet"}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                  {doctor.qualifications?.map((q) => (
                    <Badge key={q} variant="secondary">
                      {q}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Languages className="h-4 w-4 text-gray-400 shrink-0" />
                  {doctor.languages?.map((l) => (
                    <Badge key={l} variant="outline">
                      {l}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="sm:self-start shrink-0">
                <Button size="lg" asChild>
                  <Link to={bookHref}>
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {canBook ? "Book Appointment" : "Sign in to Book"}
                  </Link>
                </Button>
              </div>
            </div>

            {doctor.bio && (
              <div className="mt-5 pt-5 border-t">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="space-y-2">
              {DAY_ORDER.map((day) => {
                const s = scheduleByDay.get(day);
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-700 w-28 capitalize">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </span>
                    {s ? (
                      <>
                        <span className="text-sm text-gray-600">
                          {s.startTime} – {s.endTime}
                        </span>
                        <span className="text-xs text-gray-400">{s.slotDuration} min slots</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Not available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Patient Reviews</h2>

            {doctor.totalReviews > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-4xl font-bold text-gray-900">
                  {doctor.rating.toFixed(1)}
                </span>
                <div className="space-y-0.5">
                  <StarRating readonly rating={doctor.rating} size="md" />
                  <p className="text-sm text-gray-500">{reviewsTotal} review{reviewsTotal !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}

            {reviewsLoading && reviews.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                {reviewsPage < reviewsTotalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => loadReviews(reviewsPage + 1)}
                    disabled={reviewsLoading}
                  >
                    {reviewsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
