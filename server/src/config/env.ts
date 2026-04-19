import dotenv from "dotenv";
dotenv.config();

function getEnv(key: string, fallback = ""): string {
  const value = process.env[key] ?? fallback;
  return value;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    console.error(`\n❌ Required env var missing or empty: ${key}`);
    console.error("   Set it in server/.env and restart the server.\n");
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

export const env = {
  PORT: getEnv("PORT", "5000"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  FRONTEND_URL: getEnv("FRONTEND_URL", "http://localhost:5173"),
  RESEND_API_KEY: getEnv("RESEND_API_KEY", ""),
  EMAIL_FROM: getEnv("EMAIL_FROM", "HealthEase <onboarding@resend.dev>"),
};