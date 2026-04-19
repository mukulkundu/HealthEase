import type { Response, NextFunction, Request } from "express";
import * as reviewService from "./review.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || rating === undefined) {
      return sendError(res, "appointmentId and rating are required", 400);
    }

    const review = await reviewService.createReview(req.user!.id, {
      appointmentId,
      rating: Number(rating),
      comment,
    });

    return sendSuccess(res, review, "Review submitted successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getDoctorReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doctorId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await reviewService.getDoctorReviews(doctorId, page, limit);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getMyReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user!.id);
    return sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
};

export const checkCanReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId } = req.params;
    const result = await reviewService.checkCanReview(req.user!.id, appointmentId);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
