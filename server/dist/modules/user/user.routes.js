import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import db from "../../config/db.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
const router = Router();
// PATCH /api/users/profile — update basic user info (name, phone)
router.patch("/profile", authenticate, async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        if (!name && !phone) {
            return sendError(res, "Provide at least one field to update", 400);
        }
        const user = await db.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
            },
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
        return sendSuccess(res, user, "Profile updated");
    }
    catch (err) {
        next(err);
    }
});
export default router;
