import { describe, test, expect, mock, beforeEach } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { user } from "../src/db/schemas/auth-schema";
import { savedSearches } from "../src/db/schemas/social-schema";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { savedSearchesApp } = await import("../src/routes/saved-searches");

describe("Saved Searches API", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	let userId = "";
	let searchId = "";

	test("Setup - ensure user exists", async () => {
		userId = crypto.randomUUID();
		await db.insert(user).values({
			id: userId,
			name: "Search User",
			email: `${userId}@example.com`,
			role: "user",
			accountType: "user"
		});
	});

	test("POST /api/saved-searches creates a search", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: userId, role: "user" },
		});

		const res = await savedSearchesApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Cheap Camry",
				filters: { makeId: "m1", maxPrice: 10000 },
			}),
		});

		expect(res.status).toBe(201);
		const data = await res.json() as any;
		expect(data.title).toBe("Cheap Camry");
		expect(data.filters.maxPrice).toBe(10000);
		expect(data.userId).toBe(userId);
		
		searchId = data.id;
	});

	test("GET /api/saved-searches returns user's searches", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: userId, role: "user" },
		});

		const res = await savedSearchesApp.request("/");
		expect(res.status).toBe(200);
		const data = await res.json() as any[];
		expect(data.length).toBeGreaterThan(0);
		expect(data.some(s => s.id === searchId)).toBe(true);
	});

	test("DELETE /api/saved-searches/:id removes search", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: userId, role: "user" },
		});

		const res = await savedSearchesApp.request(`/${searchId}`, {
			method: "DELETE",
		});
		
		expect(res.status).toBe(200);
		
		// Verify it's gone
		const [deleted] = await db.select().from(savedSearches).where(eq(savedSearches.id, searchId));
		expect(deleted).toBeUndefined();
	});
});
