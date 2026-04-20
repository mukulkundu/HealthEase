import type { Request, Response, NextFunction } from "express";
import * as doctorService from "./doctor.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";

export const getAllDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      specialization,
      name,
      minFee,
      maxFee,
      minExperience,
      maxExperience,
      minRating,
      availableOn,
      sortBy,
      page,
      limit,
      languages,
    } = req.query as {
      specialization?: string;
      name?: string;
      minFee?: string;
      maxFee?: string;
      minExperience?: string;
      maxExperience?: string;
      minRating?: string;
      availableOn?: string;
      sortBy?: "rating" | "fee_asc" | "fee_desc" | "experience";
      page?: string;
      limit?: string;
      languages?: string | string[];
    };

    const parsedLanguages =
      typeof languages === "string"
        ? languages
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : Array.isArray(languages)
        ? languages.filter(Boolean)
        : undefined;

    const doctors = await doctorService.getAllDoctors({
      specialization,
      name,
      minFee: minFee ? Number(minFee) : undefined,
      maxFee: maxFee ? Number(maxFee) : undefined,
      minExperience: minExperience ? Number(minExperience) : undefined,
      maxExperience: maxExperience ? Number(maxExperience) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      availableOn: availableOn?.toUpperCase(),
      sortBy,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      languages: parsedLanguages,
    });
    return sendSuccess(res, doctors);
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id as string);
    return sendSuccess(res, doctor);
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await doctorService.getMyProfile(req.user!.id);
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
};

export const createProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      specialization,
      experience,
      qualifications,
      languages,
      consultationFee,
      bio,
      avatarUrl,
    } = req.body;

    if (!specialization || !experience || !qualifications || !languages || !consultationFee) {
      return sendError(
        res,
        "specialization, experience, qualifications, languages and consultationFee are required",
        400
      );
    }

    if (!Array.isArray(qualifications) || !Array.isArray(languages)) {
      return sendError(res, "qualifications and languages must be arrays", 400);
    }

    const profile = await doctorService.createProfile(req.user!.id, {
      specialization,
      experience: Number(experience),
      qualifications,
      languages,
      consultationFee: Number(consultationFee),
      bio,
      avatarUrl,
    });

    return sendSuccess(res, profile, "Profile created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      specialization,
      experience,
      qualifications,
      languages,
      consultationFee,
      bio,
      avatarUrl,
    } = req.body;

    if (qualifications && !Array.isArray(qualifications)) {
      return sendError(res, "qualifications must be an array", 400);
    }

    if (languages && !Array.isArray(languages)) {
      return sendError(res, "languages must be an array", 400);
    }

    const profile = await doctorService.updateProfile(req.user!.id, {
      ...(specialization && { specialization }),
      ...(experience && { experience: Number(experience) }),
      ...(qualifications && { qualifications }),
      ...(languages && { languages }),
      ...(consultationFee && { consultationFee: Number(consultationFee) }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    });

    return sendSuccess(res, profile, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
};