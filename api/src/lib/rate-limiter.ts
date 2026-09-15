/**
 * §6: Reusable per-user/per-key in-memory sliding-window rate limiter.
 * Used for cost-triggering endpoints (external APIs, FCM push, payments, signature generation).
 */
export function createUserRateLimiter(limit: number, windowMs: number = 60 * 1000) {
	const map = new Map<string, { count: number; resetAt: number }>();

	return {
		check(key: string): boolean {
			const now = Date.now();
			let record = map.get(key);

			if (!record || record.resetAt < now) {
				record = { count: 0, resetAt: now + windowMs };
			}

			record.count++;
			map.set(key, record);

			return record.count <= limit;
		},
		reset() {
			map.clear();
		},
	};
}
