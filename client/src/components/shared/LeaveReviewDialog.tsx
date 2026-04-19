import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import StarRating from "./StarRating";
import { reviewApi } from "../../api/review.api";

interface Props {
  appointmentId: string;
  doctorName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMENT_MAX = 500;

export default function LeaveReviewDialog({
  appointmentId,
  doctorName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewApi.createReview({
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Dr. {doctorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">How was your consultation?</p>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700">Rating *</p>
            <StarRating readonly={false} value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-700">
              Comment <span className="font-normal text-gray-400">(optional)</span>
            </p>
            <textarea
              className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              maxLength={COMMENT_MAX}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <p className="text-xs text-gray-400 text-right">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
