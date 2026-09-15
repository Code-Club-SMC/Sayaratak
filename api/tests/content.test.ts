import { describe, test, expect, mock, beforeEach, beforeAll, afterAll } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { contentApp } = await import("../src/routes/content");
const { adminApp } = await import("../src/routes/admin");
import { db } from "../src/db";
import { pages } from "../src/db/schemas/content-schema";
import { user } from "../src/db/schemas/auth-schema";
import { eq } from "drizzle-orm";

const testAdminId = "admin_cms_test_" + crypto.randomUUID().slice(0, 8);
const nextAdminId = "admin_cms_next_" + crypto.randomUUID().slice(0, 8);

beforeAll(async () => {
	await db.insert(user).values([
		{
			id: testAdminId,
			name: "CMS Admin",
			email: `${testAdminId}@sayaratak.com`,
			role: "admin",
			accountType: "user",
		},
		{
			id: nextAdminId,
			name: "CMS Next Admin",
			email: `${nextAdminId}@sayaratak.com`,
			role: "admin",
			accountType: "user",
		},
	]);
});

afterAll(async () => {
	await db.delete(user).where(eq(user.id, testAdminId));
	await db.delete(user).where(eq(user.id, nextAdminId));
});

describe("Public Content & CMS Endpoints", () => {
	test("GET /pages returns list of active pages", async () => {
		const res = await contentApp.request("/pages");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Array<{
			id: string;
			slug: string;
			title: string;
			titleAr: string | null;
		}>;
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThanOrEqual(1);

		const aboutUs = data.find((p) => p.slug === "about-us");
		expect(aboutUs).toBeDefined();
		expect(aboutUs?.title).toBe("About Sayaratak");
		expect(aboutUs?.titleAr).toBe("عن سياراتك");
	});

	test("GET /pages/:slug returns 200 with full content for existing page", async () => {
		const res = await contentApp.request("/pages/about-us");
		expect(res.status).toBe(200);
		const data = (await res.json()) as {
			id: string;
			slug: string;
			title: string;
			titleAr: string | null;
			content: string;
			contentAr: string | null;
			isActive: boolean;
		};
		expect(data.slug).toBe("about-us");
		expect(data.title).toBe("About Sayaratak");
		expect(data.content).toContain("Sayaratak is Sudan's premier digital automotive marketplace");
		expect(data.contentAr).toContain("سياراتك هي المنصة الرقمية الرائدة في السودان");
		expect(data.isActive).toBe(true);
	});

	test("GET /pages/:slug returns 404 for non-existent page", async () => {
		const res = await contentApp.request("/pages/non-existent-slug-9999");
		expect(res.status).toBe(404);
		const data = (await res.json()) as { error: string };
		expect(data.error).toBe("Page not found");
	});

	test("GET /pages/:slug returns 404 for inactive page", async () => {
		const uniqueSlug = `inactive-page-${crypto.randomUUID()}`;
		const [created] = await db
			.insert(pages)
			.values({
				slug: uniqueSlug,
				title: "Hidden Page",
				content: "Secret content",
				isActive: false,
			})
			.returning();

		const res = await contentApp.request(`/pages/${uniqueSlug}`);
		expect(res.status).toBe(404);

		// Clean up
		await db.delete(pages).where(eq(pages.id, created.id));
	});
});

describe("Admin CMS Management Endpoints - Hardening & Edge Cases", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	test("Admin endpoints return 403 when session is missing or not admin", async () => {
		getSession.mockResolvedValue(null);

		const getRes = await adminApp.request("/pages");
		expect(getRes.status).toBe(403);

		const postRes = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug: "test", title: "Test", content: "Content" }),
		});
		expect(postRes.status).toBe(403);

		// Non-admin role
		getSession.mockResolvedValue({
			user: { id: "u_normal", role: "user" },
		});
		const normalUserRes = await adminApp.request("/pages");
		expect(normalUserRes.status).toBe(403);
	});

	test("1. Bilingual completeness enforcement on publish vs draft", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		// POST with isActive: true but missing Arabic -> 400
		const badPublishRes = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: `bilingual-fail-${crypto.randomUUID().slice(0, 8)}`,
				title: "English Only",
				content: "<p>English body</p>",
				isActive: true,
			}),
		});
		expect(badPublishRes.status).toBe(400);

		// POST with isActive: false (draft) and missing Arabic -> 201 succeeds
		const draftSlug = `draft-page-${crypto.randomUUID().slice(0, 8)}`;
		const draftRes = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: draftSlug,
				title: "Draft English Only",
				content: "<p>Draft body</p>",
				isActive: false,
			}),
		});
		expect(draftRes.status).toBe(201);
		const draftPage = (await draftRes.json()) as typeof pages.$inferSelect;

		// PUT attempting to activate draft without adding Arabic -> 400
		const activateFailRes = await adminApp.request(`/pages/${draftPage.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				isActive: true,
			}),
		});
		expect(activateFailRes.status).toBe(400);

		// Clean up draft
		await db.delete(pages).where(eq(pages.id, draftPage.id));
	});

	test("2. Content sanitization (XSS protection)", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		const xssSlug = `xss-test-${crypto.randomUUID().slice(0, 8)}`;
		const res = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: xssSlug,
				title: "XSS Test",
				titleAr: "اختبار الأمان",
				content: '<script>alert(1)</script><p>Clean paragraph</p><a href="javascript:steal()">Link</a>',
				contentAr: '<img src="x" onerror="alert(2)" /><p>فقرة نظيفة</p>',
				isActive: true,
			}),
		});
		expect(res.status).toBe(201);
		const created = (await res.json()) as typeof pages.$inferSelect;

		// Verify dangerous script, onerror, and javascript: links are stripped
		expect(created.content).not.toContain("<script>");
		expect(created.content).not.toContain("javascript:");
		expect(created.content).toContain("<p>Clean paragraph</p>");
		expect(created.contentAr).not.toContain("onerror");
		expect(created.contentAr).toContain("<p>فقرة نظيفة</p>");

		// Clean up
		await db.delete(pages).where(eq(pages.id, created.id));
	});

	test("3. Block hard delete on protected legal pages and soft-delete other pages", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		// 1. DELETE on privacy-policy -> 403 Forbidden
		const [privacyPage] = await db.select().from(pages).where(eq(pages.slug, "privacy-policy"));
		if (privacyPage) {
			const delPrivacyRes = await adminApp.request(`/pages/${privacyPage.id}`, {
				method: "DELETE",
			});
			expect(delPrivacyRes.status).toBe(403);
			const errJson = (await delPrivacyRes.json()) as { error: string };
			expect(errJson.error).toContain("This page cannot be deleted");

			// Confirm row still active in DB
			const [checkPrivacy] = await db.select().from(pages).where(eq(pages.id, privacyPage.id));
			expect(checkPrivacy.isActive).toBe(true);
		}

		// 2. DELETE on terms-and-conditions -> 403 Forbidden
		const [termsPage] = await db.select().from(pages).where(eq(pages.slug, "terms-and-conditions"));
		if (termsPage) {
			const delTermsRes = await adminApp.request(`/pages/${termsPage.id}`, {
				method: "DELETE",
			});
			expect(delTermsRes.status).toBe(403);
		}

		// 3. DELETE on standard page -> soft delete (isActive: false, row preserved)
		const softDelSlug = `soft-del-${crypto.randomUUID().slice(0, 8)}`;
		const [normalPage] = await db
			.insert(pages)
			.values({
				slug: softDelSlug,
				title: "Temp Promo",
				titleAr: "عرض مؤقت",
				content: "<p>Promo</p>",
				contentAr: "<p>عرض</p>",
				isActive: true,
			})
			.returning();

		const delRes = await adminApp.request(`/pages/${normalPage.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);

		// Assert row remains in DB with isActive = false
		const [afterDel] = await db.select().from(pages).where(eq(pages.id, normalPage.id));
		expect(afterDel).toBeDefined();
		expect(afterDel.isActive).toBe(false);
		expect(afterDel.updatedBy).toBe(testAdminId);

		// Clean up
		await db.delete(pages).where(eq(pages.id, normalPage.id));
	});

	test("4. Slug format validation", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		const invalidSlugs = ["About Us", "about_us", "AboutUs!", "-about-us", "about-us-"];
		for (const badSlug of invalidSlugs) {
			const res = await adminApp.request("/pages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slug: badSlug,
					title: "Invalid Slug Page",
					titleAr: "صفحة",
					content: "<p>Text</p>",
					contentAr: "<p>نص</p>",
					isActive: true,
				}),
			});
			expect(res.status).toBe(400);
		}

		// Valid slug with hyphens and numbers
		const validSlug = `valid-slug-2026-${crypto.randomUUID().slice(0, 4)}`;
		const validRes = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: validSlug,
				title: "Valid Slug Page",
				titleAr: "صفحة صالحة",
				content: "<p>Text</p>",
				contentAr: "<p>نص</p>",
				isActive: true,
			}),
		});
		expect(validRes.status).toBe(201);
		const created = (await validRes.json()) as typeof pages.$inferSelect;
		await db.delete(pages).where(eq(pages.id, created.id));
	});

	test("5. Re-check slug uniqueness on update", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		const slugA = `slug-a-${crypto.randomUUID().slice(0, 6)}`;
		const slugB = `slug-b-${crypto.randomUUID().slice(0, 6)}`;

		const [pageA] = await db
			.insert(pages)
			.values({
				slug: slugA,
				title: "Page A",
				titleAr: "صفحة أ",
				content: "<p>A</p>",
				contentAr: "<p>أ</p>",
				isActive: true,
			})
			.returning();

		const [pageB] = await db
			.insert(pages)
			.values({
				slug: slugB,
				title: "Page B",
				titleAr: "صفحة ب",
				content: "<p>B</p>",
				contentAr: "<p>ب</p>",
				isActive: true,
			})
			.returning();

		// PUT page A keeping same slugA -> succeeds
		const keepRes = await adminApp.request(`/pages/${pageA.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: slugA,
				title: "Page A Updated",
			}),
		});
		expect(keepRes.status).toBe(200);

		// PUT page A changing slug to slugB (already taken) -> 409
		const conflictRes = await adminApp.request(`/pages/${pageA.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: slugB,
			}),
		});
		expect(conflictRes.status).toBe(409);

		// Clean up
		await db.delete(pages).where(eq(pages.id, pageA.id));
		await db.delete(pages).where(eq(pages.id, pageB.id));
	});

	test("6. Accountability field (updatedBy recorded on create & update)", async () => {
		getSession.mockResolvedValue({
			user: { id: testAdminId, role: "admin" },
		});

		const auditSlug = `audit-test-${crypto.randomUUID().slice(0, 6)}`;
		const createRes = await adminApp.request("/pages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				slug: auditSlug,
				title: "Audit Test Page",
				titleAr: "صفحة التدقيق",
				content: "<p>Initial</p>",
				contentAr: "<p>أولي</p>",
				isActive: true,
			}),
		});
		expect(createRes.status).toBe(201);
		const created = (await createRes.json()) as typeof pages.$inferSelect;
		expect(created.updatedBy).toBe(testAdminId);

		// Update with different admin
		getSession.mockResolvedValue({
			user: { id: nextAdminId, role: "admin" },
		});

		const updateRes = await adminApp.request(`/pages/${created.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: "Audit Test Page Modified",
			}),
		});
		expect(updateRes.status).toBe(200);
		const updated = (await updateRes.json()) as typeof pages.$inferSelect;
		expect(updated.updatedBy).toBe(nextAdminId);

		// Clean up
		await db.delete(pages).where(eq(pages.id, created.id));
	});
});
