import { createMiddleware } from "hono/factory";
import { auth } from "../../lib/auth";

type SessionUser = {
	id: string;
	email: string;
	role: string;
	accountType: string;
	banned: boolean;
	[key: string]: unknown;
};

export const requireRole = (...roles: string[]) =>
	createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
		}
		if (session.user.banned) {
			return c.json({ error: "Forbidden: Account is banned", code: "ACCOUNT_BANNED" }, 403);
		}
		if (!roles.includes(session.user.role ?? "user")) {
			return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
		}
		c.set("user", session.user as SessionUser);
		await next();
	});

export const requireAccountType = (...types: string[]) =>
	createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
		}
		if (session.user.banned) {
			return c.json({ error: "Forbidden: Account is banned", code: "ACCOUNT_BANNED" }, 403);
		}
		if (!types.includes((session.user as SessionUser).accountType ?? "user")) {
			return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
		}
		c.set("user", session.user as SessionUser);
		await next();
	});
