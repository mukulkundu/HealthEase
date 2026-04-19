import { Resend } from "resend";
import { env } from "./env.js";

// Use a placeholder when no key is set — emails will fail gracefully (fire-and-forget)
const resend = new Resend(env.RESEND_API_KEY || "re_placeholder_key_not_set");

export default resend;
