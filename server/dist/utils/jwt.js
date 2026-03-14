import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
function ensureSecret(name, value) {
    if (!value || value.trim() === "") {
        throw new Error(`JWT ${name} must not be empty. Set it in server/.env`);
    }
}
export const signAccessToken = (payload) => {
    ensureSecret("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });
};
export const signRefreshToken = (payload) => {
    ensureSecret("JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET);
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
};
export const verifyAccessToken = (token) => {
    ensureSecret("JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET);
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
};
export const verifyRefreshToken = (token) => {
    ensureSecret("JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET);
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
