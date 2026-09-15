import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * §3: Runs a cron task guarded by a PostgreSQL session-level advisory lock.
 * Ensures that if multiple API replicas/instances are running, only a single
 * instance executes the cron task at any given interval.
 */
export async function withAdvisoryLock<T>(
	lockId: number,
	taskName: string,
	fn: () => Promise<T>
): Promise<T | null> {
	try {
		const result = await db.execute<{ pg_try_advisory_lock: boolean }>(
			sql`SELECT pg_try_advisory_lock(${lockId})`
		);

		const acquired = result[0]?.pg_try_advisory_lock;
		if (!acquired) {
			console.log(`[Cron] Advisory lock ${lockId} for "${taskName}" is held by another replica. Skipping on this instance.`);
			return null;
		}

		try {
			return await fn();
		} finally {
			await db.execute(sql`SELECT pg_advisory_unlock(${lockId})`).catch((err) => {
				console.error(`[Cron] Failed to release advisory lock ${lockId} for "${taskName}":`, err);
			});
		}
	} catch (err) {
		console.error(`[Cron] Advisory lock error for "${taskName}":`, err);
		return null;
	}
}
