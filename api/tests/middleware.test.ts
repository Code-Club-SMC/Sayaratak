import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

await import("../lib/auth");
const { requireRole, requireAccountType, requireAuth, requireAdmin, optionalAuth } = await import("../src/middleware/auth");

type MockContext = {
	req: { raw: { headers: Headers } };
	json: (data: unknown, status?: number) => Response;
	set: ReturnType<typeof mock>;
};

function mockContext(headers: Record<string, string> = {}): MockContext {
	const h = new Headers(headers);
	return {
		req: { raw: { headers: h } },
		json: (data: unknown, status?: number) => new Response(JSON.stringify(data), { status: status || 200 }),
		set: mock(),
	};
}

describe("requireRole", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("returns 401 when no session", async () => {
		getSession.mockResolvedValue(null);
		const middleware = requireRole("admin");
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(401);
	});

	test("returns 403 when banned", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: true, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("returns 403 when role not allowed", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next and sets user when authorized", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
		expect(c.set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1" }));
	});
});

describe("requireAccountType", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("returns 403 when accountType not allowed", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireAccountType("dealership");
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next when accountType matches", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "dealership" },
		});
		const middleware = requireAccountType("dealership", "workshop");
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
	});
});

describe("requireAuth", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("returns 401 when no session", async () => {
		getSession.mockResolvedValue(null);
		const middleware = requireAuth();
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(401);
	});

	test("returns 403 when user is banned", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: true, accountType: "user" },
		});
		const middleware = requireAuth();
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next and sets user when authorized", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireAuth();
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
		expect(c.set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1" }));
	});
});

describe("requireAdmin", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("returns 403 when no session (adminApp contract)", async () => {
		getSession.mockResolvedValue(null);
		const middleware = requireAdmin();
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("returns 403 when user is not admin", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireAdmin();
		const c = mockContext();
		const res = await middleware(c as never, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next and sets user when admin", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});
		const middleware = requireAdmin();
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
		expect(c.set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1" }));
	});
});

describe("optionalAuth", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("calls next without user when no session", async () => {
		getSession.mockResolvedValue(null);
		const middleware = optionalAuth();
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
		expect(c.set).not.toHaveBeenCalled();
	});

	test("sets user when session is valid", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = optionalAuth();
		const c = mockContext();
		const next = mock();
		await middleware(c as never, next as never);
		expect(next).toHaveBeenCalled();
		expect(c.set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1" }));
	});
});

