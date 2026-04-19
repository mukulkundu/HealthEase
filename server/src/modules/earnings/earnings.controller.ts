import type { Response, NextFunction } from "express";
import * as earningsService from "./earnings.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";

export const getSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await earningsService.getEarningsSummary(req.user!.id);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const history = await earningsService.getEarningsHistory(req.user!.id, month, year);
    return sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
};

export const getMonthlyChart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const chart = await earningsService.getMonthlyChart(req.user!.id);
    return sendSuccess(res, chart);
  } catch (err) {
    next(err);
  }
};
