import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { i18nMiddleware } from "../src/middleware/i18n";
import {
	resolveLocale,
	localizeError,
	interpolate,
	localizeZodIssue,
	formatZodValidationErrors,
	ERROR_DICTIONARY,
} from "../src/lib/i18n";

// Test App with i18nMiddleware mounted
const testApp = new Hono();
testApp.use("/*", i18nMiddleware);

testApp.get("/test-unauthorized", (c) => {
	return c.json({ error: "Unauthorized" }, 401);
});

testApp.get("/test-not-found", (c) => {
	return c.json({ error: "Listing not found" }, 404);
});

testApp.get("/test-sold", (c) => {
	return c.json({ error: "Listing is no longer available" }, 410);
});

testApp.get("/test-forbidden-owner", (c) => {
	return c.json({ error: "Forbidden: You do not own this listing" }, 403);
});

testApp.get("/test-rate-limit", (c) => {
	return c.json({ error: "Too Many Requests" }, 429);
});

testApp.get("/test-custom-error", (c) => {
	return c.json({ error: "Custom unexpected payment failure" }, 400);
});

testApp.get("/test-interpolated-slug", (c) => {
	return c.json({ error: "A page with this slug 'about-us' already exists" }, 409);
});

testApp.get("/test-success", (c) => {
	return c.json({ success: true, message: "OK" });
});

// Zod-validated test endpoint
const sampleFormSchema = z.object({
	title: z.string().min(3),
	slug: z.string().regex(/^[a-z0-9-]+$/),
	email: z.string().email(),
	price: z.number().positive(),
});

testApp.post("/test-form", zValidator("json", sampleFormSchema), (c) => {
	const data = c.req.valid("json");
	return c.json({ success: true, data });
});

describe("Multi-Language / i18n Error Handling & Zod Validation", () => {
	// 1. Default (English) when no header provided
	test("1. Default fallback is English with code attachment", async () => {
		const res = await testApp.request("/test-unauthorized");
		expect(res.status).toBe(401);
		expect(res.headers.get("Content-Language")).toBe("en");
		expect(res.headers.get("Vary")).toContain("Accept-Language");

		const json = await res.json();
		expect(json.error).toBe("Unauthorized");
		expect(json.code).toBe("UNAUTHORIZED");
	});

	// 2. Arabic translation when Accept-Language: ar is sent
	test("2. Accept-Language: ar translates error to Arabic", async () => {
		const res = await testApp.request("/test-unauthorized", {
			headers: { "Accept-Language": "ar" },
		});

		expect(res.status).toBe(401);
		expect(res.headers.get("Content-Language")).toBe("ar");

		const json = await res.json();
		expect(json.error).toBe(ERROR_DICTIONARY.UNAUTHORIZED.ar);
		expect(json.error).toBe("غير مصرح لك بالوصول");
		expect(json.code).toBe("UNAUTHORIZED");
	});

	// 3. Regional Arabic tags (ar-SD, ar-EG, ar-SA)
	test("3. Regional Arabic tags (ar-SD, ar-EG) resolve to Arabic", async () => {
		const resSD = await testApp.request("/test-not-found", {
			headers: { "Accept-Language": "ar-SD,ar;q=0.9,en;q=0.8" },
		});
		expect(resSD.status).toBe(404);
		const jsonSD = await resSD.json();
		expect(jsonSD.error).toBe("الإعلان غير موجود");
		expect(jsonSD.code).toBe("LISTING_NOT_FOUND");

		const resEG = await testApp.request("/test-sold", {
			headers: { "Accept-Language": "ar-EG" },
		});
		expect(resEG.status).toBe(410);
		const jsonEG = await resEG.json();
		expect(jsonEG.error).toBe("هذا الإعلان لم يعد متاحاً");
		expect(jsonEG.code).toBe("LISTING_UNAVAILABLE");
	});

	// 4. Q-factor quality weights in Accept-Language
	test("4. Q-factor parsing respects highest quality language weight", async () => {
		const resAr = await testApp.request("/test-forbidden-owner", {
			headers: { "Accept-Language": "en;q=0.5, ar;q=0.9" },
		});
		const jsonAr = await resAr.json();
		expect(jsonAr.error).toBe("تم رفض الوصول: لست صاحب هذا الإعلان");
		expect(jsonAr.code).toBe("FORBIDDEN_LISTING_OWNER");

		const resEn = await testApp.request("/test-forbidden-owner", {
			headers: { "Accept-Language": "ar;q=0.3, en;q=0.9" },
		});
		const jsonEn = await resEn.json();
		expect(jsonEn.error).toBe("Forbidden: You do not own this listing");
		expect(jsonEn.code).toBe("FORBIDDEN_LISTING_OWNER");
	});

	// 5. Query Parameter Override (?lang=ar and ?locale=ar)
	test("5. Query param (?lang=ar) overrides Accept-Language: en header", async () => {
		const res = await testApp.request("/test-rate-limit?lang=ar", {
			headers: { "Accept-Language": "en-US,en;q=0.9" },
		});

		expect(res.status).toBe(429);
		expect(res.headers.get("Content-Language")).toBe("ar");
		const json = await res.json();
		expect(json.error).toBe("طلبات كثيرة جداً، يرجى المحاولة لاحقاً");
		expect(json.code).toBe("TOO_MANY_REQUESTS");
	});

	// 6. Dynamic Message Interpolation
	test("6. Dynamic error message interpolation (slug, params)", async () => {
		const res = await testApp.request("/test-interpolated-slug", {
			headers: { "Accept-Language": "ar" },
		});

		expect(res.status).toBe(409);
		const json = await res.json();
		expect(json.error).toBe("يوجد صفحة أخرى تستخدم الرابط 'about-us' بالفعل");
		expect(json.code).toBe("SLUG_ALREADY_EXISTS");

		// Interpolation helper function test
		const interpolated = interpolate("Maximum {max} photos allowed in {time}s", { max: 10, time: 30 });
		expect(interpolated).toBe("Maximum 10 photos allowed in 30s");
	});

	// 7. Zod Validation Error Localization in Arabic
	test("7. Zod validation errors are localized into Arabic with translated field names", async () => {
		const res = await testApp.request("/test-form", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Language": "ar",
			},
			body: JSON.stringify({
				title: "ab", // too short (min 3)
				slug: "INVALID SLUG!", // invalid regex
				email: "not-an-email", // invalid email
				price: -50, // not positive
			}),
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Content-Language")).toBe("ar");

		const json = await res.json();
		expect(json.code).toBe("VALIDATION_ERROR");
		expect(json.error).toContain("خطأ في التحقق من صحة البيانات");
		expect(Array.isArray(json.details)).toBe(true);

		// Check localized details
		const titleIssue = json.details.find((d: any) => d.field === "title");
		expect(titleIssue.message).toContain("العنوان");
		expect(titleIssue.message).toContain("3 أحرف على الأقل");

		const emailIssue = json.details.find((d: any) => d.field === "email");
		expect(emailIssue.message).toBe("صيغة البريد الإلكتروني غير صالحة");

		const slugIssue = json.details.find((d: any) => d.field === "slug");
		expect(slugIssue.message).toContain("أحرف إنجليزية صغيرة وأرقام");
	});

	// 8. Zod Validation Error Localization in English
	test("8. Zod validation errors in English retain structured details", async () => {
		const res = await testApp.request("/test-form", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Accept-Language": "en",
			},
			body: JSON.stringify({
				title: "ab",
				slug: "bad slug",
				email: "invalid",
				price: -1,
			}),
		});

		expect(res.status).toBe(400);
		expect(res.headers.get("Content-Language")).toBe("en");

		const json = await res.json();
		expect(json.code).toBe("VALIDATION_ERROR");
		expect(json.error).toContain("Validation error");
		expect(Array.isArray(json.details)).toBe(true);

		const titleIssue = json.details.find((d: any) => d.field === "title");
		expect(titleIssue.message).toContain("Field 'Title' must contain at least 3 character(s)");
	});

	// 9. Success responses pass through untouched
	test("9. Success responses pass through untouched with language header", async () => {
		const res = await testApp.request("/test-success", {
			headers: { "Accept-Language": "ar" },
		});

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Language")).toBe("ar");
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.message).toBe("OK");
	});

	// 10. Unmapped custom error generates formatted code without crashing
	test("10. Unmapped custom error generates formatted code without crashing", async () => {
		const res = await testApp.request("/test-custom-error");
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error).toBe("Custom unexpected payment failure");
		expect(json.code).toBe("CUSTOM_UNEXPECTED_PAYMENT_FAILURE");
	});
});
