import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as staffService from "./staff.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export const inviteStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "email is required", 400);
    const staff = await staffService.inviteStaff(req.user!.id, email);
    return sendSuccess(res, staff, "Staff member added", 201);
  } catch (err) { next(err); }
};

export const removeStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await staffService.removeStaff(req.user!.id, req.params.userId as string);
    return sendSuccess(res, null, "Staff member removed");
  } catch (err) { next(err); }
};

export const listStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const staff = await staffService.listStaff(req.user!.id);
    return sendSuccess(res, staff);
  } catch (err) { next(err); }
};
