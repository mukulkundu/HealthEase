import type { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { verifyAccessToken } from "../../utils/jwt.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 15 * 60 * 1000, // 15 min for access token
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  path: "/api/auth/refresh",
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, "name, email, password and role are required", 400);
    }

    if (!["PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "RECEPTIONIST"].includes(role)) {
      return sendError(res, "Invalid role", 400);
    }

    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters", 400);
    }

    const result = await authService.registerUser({ name, email, password, role });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, { user: result.user }, "Account created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const result = await authService.loginUser({ email, password });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return sendSuccess(res, { user: result.user }, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return sendError(res, "Refresh token is required", 400);
    }

    const result = await authService.refreshTokens(refreshToken);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    const payload = verifyAccessToken(result.accessToken);
    const user = await authService.getMe(payload.id);
    return sendSuccess(res, { user }, "Tokens refreshed");
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logoutUser(refreshToken);
    }
  res.clearCookie("accessToken", { path: "/", httpOnly: true, sameSite: "lax" });
  res.clearCookie("refreshToken", { path: "/api/auth/refresh", httpOnly: true, sameSite: "lax" });
    return sendSuccess(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

export const me = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
};