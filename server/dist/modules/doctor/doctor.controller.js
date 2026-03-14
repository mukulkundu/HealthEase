import * as doctorService from "./doctor.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
export const getAllDoctors = async (req, res, next) => {
    try {
        const { specialization, name } = req.query;
        const doctors = await doctorService.getAllDoctors({ specialization, name });
        return sendSuccess(res, doctors);
    }
    catch (err) {
        next(err);
    }
};
export const getDoctorById = async (req, res, next) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        return sendSuccess(res, doctor);
    }
    catch (err) {
        next(err);
    }
};
export const getMyProfile = async (req, res, next) => {
    try {
        const profile = await doctorService.getMyProfile(req.user.id);
        return sendSuccess(res, profile);
    }
    catch (err) {
        next(err);
    }
};
export const createProfile = async (req, res, next) => {
    try {
        const { specialization, experience, qualifications, languages, consultationFee, bio, avatarUrl, } = req.body;
        if (!specialization || !experience || !qualifications || !languages || !consultationFee) {
            return sendError(res, "specialization, experience, qualifications, languages and consultationFee are required", 400);
        }
        if (!Array.isArray(qualifications) || !Array.isArray(languages)) {
            return sendError(res, "qualifications and languages must be arrays", 400);
        }
        const profile = await doctorService.createProfile(req.user.id, {
            specialization,
            experience: Number(experience),
            qualifications,
            languages,
            consultationFee: Number(consultationFee),
            bio,
            avatarUrl,
        });
        return sendSuccess(res, profile, "Profile created successfully", 201);
    }
    catch (err) {
        next(err);
    }
};
export const updateProfile = async (req, res, next) => {
    try {
        const { specialization, experience, qualifications, languages, consultationFee, bio, avatarUrl, } = req.body;
        if (qualifications && !Array.isArray(qualifications)) {
            return sendError(res, "qualifications must be an array", 400);
        }
        if (languages && !Array.isArray(languages)) {
            return sendError(res, "languages must be an array", 400);
        }
        const profile = await doctorService.updateProfile(req.user.id, {
            ...(specialization && { specialization }),
            ...(experience && { experience: Number(experience) }),
            ...(qualifications && { qualifications }),
            ...(languages && { languages }),
            ...(consultationFee && { consultationFee: Number(consultationFee) }),
            ...(bio !== undefined && { bio }),
            ...(avatarUrl !== undefined && { avatarUrl }),
        });
        return sendSuccess(res, profile, "Profile updated successfully");
    }
    catch (err) {
        next(err);
    }
};
