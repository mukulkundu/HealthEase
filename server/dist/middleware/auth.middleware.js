import { verifyAccessToken } from "../utils/jwt.js";
import { sendError } from "../utils/apiResponse.js";
export const authenticate = (req, res, next) => {
    try {
        const token = req.cookies?.accessToken ||
            (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : undefined);
        if (!token) {
            return sendError(res, "No token provided", 401);
        }
        const payload = verifyAccessToken(token);
        req.user = { id: payload.id, role: payload.role };
        next();
    }
    catch {
        return sendError(res, "Invalid or expired token", 401);
    }
};
