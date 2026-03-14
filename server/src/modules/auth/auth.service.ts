import db from "../../config/db.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../middleware/error.middleware.js";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: "PATIENT" | "DOCTOR";
}) => {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isVerified: true,
      createdAt: true,
    },
  });

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  // Store refresh token in DB
  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { user, accessToken, refreshToken };
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const user = await db.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
  return { user: userResponse, accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const stored = await db.refreshToken.findUnique({ where: { token } });
  if (!stored) throw new AppError("Invalid refresh token", 401);

  if (stored.expiresAt < new Date()) {
    await db.refreshToken.delete({ where: { token } });
    throw new AppError("Refresh token expired, please login again", 401);
  }

  const payload = verifyRefreshToken(token);

  const newAccessToken = signAccessToken({ id: payload.id, role: payload.role });
  const newRefreshToken = signRefreshToken({ id: payload.id, role: payload.role });

  // Rotate — delete old, store new
  await db.refreshToken.delete({ where: { token } });
  await db.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (token: string) => {
  await db.refreshToken.deleteMany({ where: { token } });
};

export const getMe = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};