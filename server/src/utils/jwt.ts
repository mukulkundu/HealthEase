import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  id: string;
  role: string;
}

function ensureSecret(name: string, value: string): void {
  if (!value || value.trim() === "") {
    throw new Error(`JWT ${name} must not be empty. Set it in server/.env`);
  }
}

export const signAccessToken = (payload: JwtPayload): string => {
  ensureSecret("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  ensureSecret("JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET);
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  ensureSecret("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  ensureSecret("JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET);
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};