import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as deptService from "./department.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

export const createDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    if (!name) return sendError(res, "name is required", 400);
    const dept = await deptService.createDepartment(req.user!.id, name);
    return sendSuccess(res, dept, "Department created", 201);
  } catch (err) { next(err); }
};

export const listDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await deptService.listDepartments(req.params.hospitalId as string);
    return sendSuccess(res, departments);
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deptService.deleteDepartment(req.user!.id, req.params.id as string);
    return sendSuccess(res, null, "Department deleted");
  } catch (err) { next(err); }
};

export const addDoctorToDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, consultationFee } = req.body;
    if (!doctorId || consultationFee == null) {
      return sendError(res, "doctorId and consultationFee are required", 400);
    }
    const result = await deptService.addDoctorToDepartment(
      req.user!.id,
      req.params.departmentId as string,
      doctorId,
      Number(consultationFee)
    );
    return sendSuccess(res, result, "Doctor added to department");
  } catch (err) { next(err); }
};

export const removeDoctorFromDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deptService.removeDoctorFromDepartment(
      req.user!.id,
      req.params.departmentId as string,
      req.params.doctorId as string
    );
    return sendSuccess(res, null, "Doctor removed from department");
  } catch (err) { next(err); }
};

export const getMyDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const departments = await deptService.getMyDepartments(req.user!.id);
    return sendSuccess(res, departments);
  } catch (err) { next(err); }
};
