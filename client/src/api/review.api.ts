import client from "./client";
import type { ApiResponse, Review } from "../types";

interface DoctorReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
}

export const reviewApi = {
  createReview: async (data: {
    appointmentId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> => {
    const res = await client.post<ApiResponse<Review>>("/reviews", data);
    return res.data.data;
  },

  getDoctorReviews: async (
    doctorId: string,
    page = 1,
    limit = 10
  ): Promise<DoctorReviewsResponse> => {
    const res = await client.get<ApiResponse<DoctorReviewsResponse>>(
      `/reviews/doctor/${doctorId}`,
      { params: { page, limit } }
    );
    return res.data.data;
  },

  getMyReviews: async (): Promise<Review[]> => {
    const res = await client.get<ApiResponse<Review[]>>("/reviews/my");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  checkCanReview: async (appointmentId: string): Promise<CanReviewResponse> => {
    const res = await client.get<ApiResponse<CanReviewResponse>>(
      `/reviews/can-review/${appointmentId}`
    );
    return res.data.data;
  },
};
