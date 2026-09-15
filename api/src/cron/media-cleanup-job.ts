import { cleanupStalePendingAssets } from "../lib/cloudinary";
import { withAdvisoryLock } from "./advisory-lock";

export function startMediaCleanupJob() {
	// Run once daily at 3:00 AM (0 3 * * *)
	Bun.cron("0 3 * * *", async () => {
		await withAdvisoryLock(1002, "media-cleanup", async () => {
			console.log("[Cron] Running daily Cloudinary orphaned media cleanup job...");
			try {
				const deletedCount = await cleanupStalePendingAssets(24);
				console.log(`[Cron] Stale pending media cleanup complete. Deleted ${deletedCount} orphaned assets.`);
			} catch (error) {
				console.error("[Cron] Cloudinary media cleanup job failed:", error);
			}
		});
	});
}
