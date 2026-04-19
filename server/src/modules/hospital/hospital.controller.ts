import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as hospitalService from "./hospital.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export const createHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, city, state, pincode, phone, email, website, description } = req.body;
    if (!name || !address || !city || !state || !pincode || !phone || !email) {
      return sendError(res, "name, address, city, state, pincode, phone and email are required", 400);
    }
    const hospital = await hospitalService.createHospital(req.user!.id, {
      name, address, city, state, pincode, phone, email, website, description,
    });
    return sendSuccess(res, hospital, "Hospital registered successfully", 201);
  } catch (err) { next(err); }
};

export const getMyHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospital = await hospitalService.getMyHospital(req.user!.id);
    return sendSuccess(res, hospital);
  } catch (err) { next(err); }
};

export const updateHospital = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospital = await hospitalService.updateHospital(req.user!.id, req.body);
    return sendSuccess(res, hospital, "Hospital updated");
  } catch (err) { next(err); }
};

export const listHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q;
    const query = typeof q === "string" ? q : undefined;
    const hospitals = await hospitalService.listHospitals(query);
    return sendSuccess(res, hospitals);
  } catch (err) { next(err); }
};

export const getHospitalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id as string);
    return sendSuccess(res, hospital);
  } catch (err) { next(err); }
};

export const getHospitalForStaff = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hospital = await hospitalService.getHospitalForStaff(req.user!.id);
    return sendSuccess(res, hospital);
  } catch (err) { next(err); }
};
