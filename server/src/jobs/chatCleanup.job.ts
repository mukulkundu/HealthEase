import cron from "node-cron";
import db from "../config/db.js";

const CHAT_RETENTION_DAYS = 3;
const CHAT_RETENTION_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function startChatCleanupJob() {
  // Runs every day at midnight.
  cron.schedule("0 0 * * *", async () => {
    const cutoffDate = new Date(Date.now() - CHAT_RETENTION_MS);

    try {
      const result = await db.message.deleteMany({
        where: {
          appointment: {
            date: {
              lt: cutoffDate,
            },
          },
        },
      });

      console.log(`[chatCleanup.job] Deleted ${result.count} expired chat messages`);
      console.log("[chatCleanup.job] No hospital chat messages model found; skipped hospital cleanup");
    } catch (err) {
      console.error("[chatCleanup.job] Failed to cleanup expired chat messages:", err);
    }
  });

  console.log("[chatCleanup.job] Daily chat cleanup cron job registered (00:00)");
}
