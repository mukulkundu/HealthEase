import type { Response, NextFunction } from "express";
import * as patientService from "./patient.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";

export const getPatientHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { patientId } = req.params;
    const history = await patientService.getPatientHistory(req.user!.id, patientId);
    return sendSuccess(res, history);
  } catch (err) {
    next(err);
  }
};
