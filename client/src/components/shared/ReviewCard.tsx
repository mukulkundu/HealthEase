import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarRating from "./StarRating";
import type { Review } from "../../types";

interface Props {
  review: Review;
}

export default function ReviewCard({ review }: Props) {
  const name = review.patient?.name ?? "Patient";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(review.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{name}</p>
              <StarRating readonly rating={review.rating} size="sm" />
            </div>
          </div>
          <p className="text-xs text-gray-400 shrink-0">{formattedDate}</p>
        </div>
        {review.comment && (
          <p className="text-sm text-gray-600 pl-11">{review.comment}</p>
        )}
      </CardContent>
    </Card>
  );
}
