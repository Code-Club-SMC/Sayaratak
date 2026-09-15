import { describe, test, expect, mock, beforeEach } from "bun:test";

const getSession = mock();

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession,
		},
	},
}));

const { locationsApp } = await import("../src/routes/locations");
const { taxonomyApp } = await import("../src/routes/taxonomy");

// Concrete TypeScript Types
type Country = {
	id: string;
	nameEn: string;
	nameAr: string;
	code: string;
	currencyCode: string;
	phoneCode: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type City = {
	id: string;
	countryId: string;
	nameEn: string;
	nameAr: string;
	lat: number | null;
	lng: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type District = {
	id: string;
	cityId: string;
	nameEn: string;
	nameAr: string;
	lat: number | null;
	lng: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type Category = {
	id: string;
	slug: string;
	nameEn: string;
	nameAr: string;
	iconUrl: string | null;
	displayOrder: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type Make = {
	id: string;
	nameEn: string;
	nameAr: string;
	slug: string;
	logoUrl: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type Model = {
	id: string;
	makeId: string;
	nameEn: string;
	nameAr: string;
	slug: string;
	vehicleType: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

type ApiSuccessMessage = {
	success: boolean;
	message: string;
};

type ApiError = {
	error: string;
};

describe("1. Public Locations Endpoints", () => {
	test("GET /countries returns 200 array of Country", async () => {
		const res = await locationsApp.request("/countries");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Country[];
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data[0].code).toBeDefined();
	});

	test("GET /cities returns 200 array of City and supports ?countryId", async () => {
		const resAll = await locationsApp.request("/cities");
		expect(resAll.status).toBe(200);
		const allCities = (await resAll.json()) as City[];
		expect(allCities.length).toBeGreaterThan(0);

		const countryId = allCities[0].countryId;
		const resFiltered = await locationsApp.request(`/cities?countryId=${countryId}`);
		expect(resFiltered.status).toBe(200);
		const filtered = (await resFiltered.json()) as City[];
		expect(filtered.every((c) => c.countryId === countryId)).toBe(true);
	});

	test("GET /districts returns 200 array of District and supports ?cityId", async () => {
		const resAll = await locationsApp.request("/districts");
		expect(resAll.status).toBe(200);
		const allDistricts = (await resAll.json()) as District[];
		expect(Array.isArray(allDistricts)).toBe(true);

		if (allDistricts.length > 0) {
			const cityId = allDistricts[0].cityId;
			const resFiltered = await locationsApp.request(`/districts?cityId=${cityId}`);
			expect(resFiltered.status).toBe(200);
			const filtered = (await resFiltered.json()) as District[];
			expect(filtered.every((d) => d.cityId === cityId)).toBe(true);
		}
	});
});

describe("2. Public Taxonomy Endpoints", () => {
	test("GET /categories returns 200 array of Category", async () => {
		const res = await taxonomyApp.request("/categories");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Category[];
		expect(Array.isArray(data)).toBe(true);
		expect(data.some((c) => c.slug === "cars-for-sale")).toBe(true);
	});

	test("GET /makes returns 200 array of Make", async () => {
		const res = await taxonomyApp.request("/makes");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Make[];
		expect(Array.isArray(data)).toBe(true);
		expect(data.some((m) => m.slug === "toyota")).toBe(true);
	});

	test("GET /makes/:makeId/models returns 200 models for make", async () => {
		const makesRes = await taxonomyApp.request("/makes");
		const makesList = (await makesRes.json()) as Make[];
		const toyota = makesList.find((m) => m.slug === "toyota");
		expect(toyota).toBeDefined();

		if (toyota) {
			const modelsRes = await taxonomyApp.request(`/makes/${toyota.id}/models`);
			expect(modelsRes.status).toBe(200);
			const modelsList = (await modelsRes.json()) as Model[];
			expect(modelsList.every((m) => m.makeId === toyota.id)).toBe(true);
		}
	});

	test("GET /models returns 200 array and supports ?vehicleType", async () => {
		const res = await taxonomyApp.request("/models?vehicleType=truck");
		expect(res.status).toBe(200);
		const data = (await res.json()) as Model[];
		expect(Array.isArray(data)).toBe(true);
		expect(data.every((m) => m.vehicleType === "truck")).toBe(true);
	});
});

describe("3. Admin Locations CRUD Endpoints (SCR-083)", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	// Countries Admin
	test("POST /admin/countries guards: 401 unauth, 403 non-admin, 400 validation, 201 success", async () => {
		// 401 unauth
		getSession.mockResolvedValue(null);
		const res401 = await locationsApp.request("/admin/countries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameEn: "Egypt", nameAr: "مصر", code: "EG" }),
		});
		expect(res401.status).toBe(401);

		// 403 non-admin
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const res403 = await locationsApp.request("/admin/countries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameEn: "Egypt", nameAr: "مصر", code: "EG" }),
		});
		expect(res403.status).toBe(403);

		// 400 validation
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});
		const res400 = await locationsApp.request("/admin/countries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameEn: "Egypt" }), // missing nameAr and code
		});
		expect(res400.status).toBe(400);

		// 201 success
		const uniqueCode = `T${Date.now().toString().slice(-3)}`;
		const res201 = await locationsApp.request("/admin/countries", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				nameEn: "Test Country",
				nameAr: "دولة تجريبية",
				code: uniqueCode,
				currencyCode: "TST",
				phoneCode: "+999",
			}),
		});
		expect(res201.status).toBe(201);
		const createdCountry = (await res201.json()) as Country;
		expect(createdCountry.code).toBe(uniqueCode);

		// PATCH success
		const patchRes = await locationsApp.request(`/admin/countries/${createdCountry.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameEn: "Updated Country Name" }),
		});
		expect(patchRes.status).toBe(200);
		const updatedCountry = (await patchRes.json()) as Country;
		expect(updatedCountry.nameEn).toBe("Updated Country Name");

		// DELETE success
		const delRes = await locationsApp.request(`/admin/countries/${createdCountry.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
		const delMsg = (await delRes.json()) as ApiSuccessMessage;
		expect(delMsg.success).toBe(true);

		// DELETE 404
		const del404 = await locationsApp.request(`/admin/countries/${createdCountry.id}`, {
			method: "DELETE",
		});
		expect(del404.status).toBe(404);
	});

	// Cities Admin
	test("POST, PATCH, DELETE /admin/cities full lifecycle", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});

		const countriesRes = await locationsApp.request("/countries");
		const countryList = (await countriesRes.json()) as Country[];
		const countryId = countryList[0].id;

		// 400 validation
		const res400 = await locationsApp.request("/admin/cities", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ countryId }), // missing nameEn & nameAr
		});
		expect(res400.status).toBe(400);

		// 201 success
		const res201 = await locationsApp.request("/admin/cities", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				countryId,
				nameEn: `Test City ${Date.now()}`,
				nameAr: "مدينة تجريبية",
				lat: 15.123,
				lng: 32.456,
			}),
		});
		expect(res201.status).toBe(201);
		const createdCity = (await res201.json()) as City;

		// PATCH
		const patchRes = await locationsApp.request(`/admin/cities/${createdCity.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameAr: "اسم محدث" }),
		});
		expect(patchRes.status).toBe(200);

		// DELETE
		const delRes = await locationsApp.request(`/admin/cities/${createdCity.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
	});

	// Districts Admin
	test("POST, PATCH, DELETE /admin/districts full lifecycle", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});

		const citiesRes = await locationsApp.request("/cities");
		const cityList = (await citiesRes.json()) as City[];
		const cityId = cityList[0].id;

		// 201 create district
		const res201 = await locationsApp.request("/admin/districts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				cityId,
				nameEn: `District ${Date.now()}`,
				nameAr: "حي تجريبي",
			}),
		});
		expect(res201.status).toBe(201);
		const createdDistrict = (await res201.json()) as District;

		// PATCH
		const patchRes = await locationsApp.request(`/admin/districts/${createdDistrict.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nameEn: "Updated District" }),
		});
		expect(patchRes.status).toBe(200);

		// DELETE
		const delRes = await locationsApp.request(`/admin/districts/${createdDistrict.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
	});
});

describe("4. Admin Taxonomy CRUD Endpoints (SCR-082)", () => {
	beforeEach(() => {
		getSession.mockReset();
	});

	// Categories Admin
	test("POST, PATCH, DELETE /admin/categories full lifecycle", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});

		// 201 create category
		const slug = `cat-${Date.now()}`;
		const res201 = await taxonomyApp.request("/admin/categories", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				nameEn: "Special Machinery",
				nameAr: "آليات خاصة",
				slug,
				displayOrder: 10,
			}),
		});
		expect(res201.status).toBe(201);
		const createdCat = (await res201.json()) as Category;
		expect(createdCat.slug).toBe(slug);

		// PATCH
		const patchRes = await taxonomyApp.request(`/admin/categories/${createdCat.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ displayOrder: 12 }),
		});
		expect(patchRes.status).toBe(200);
		const updatedCat = (await patchRes.json()) as Category;
		expect(updatedCat.displayOrder).toBe(12);

		// DELETE
		const delRes = await taxonomyApp.request(`/admin/categories/${createdCat.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
	});

	// Makes Admin
	test("POST, PATCH, DELETE /admin/makes full lifecycle", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});

		// 201 create make
		const slug = `make-${Date.now()}`;
		const res201 = await taxonomyApp.request("/admin/makes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				nameEn: "Audi",
				nameAr: "أودي",
				slug,
			}),
		});
		expect(res201.status).toBe(201);
		const createdMake = (await res201.json()) as Make;

		// PATCH
		const patchRes = await taxonomyApp.request(`/admin/makes/${createdMake.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ logoUrl: "https://example.com/audi.png" }),
		});
		expect(patchRes.status).toBe(200);

		// DELETE
		const delRes = await taxonomyApp.request(`/admin/makes/${createdMake.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
	});

	// Models Admin
	test("POST, PATCH, DELETE /admin/models full lifecycle", async () => {
		getSession.mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});

		const makesRes = await taxonomyApp.request("/makes");
		const makesList = (await makesRes.json()) as Make[];
		const makeId = makesList[0].id;

		// 201 create model
		const slug = `model-${Date.now()}`;
		const res201 = await taxonomyApp.request("/admin/models", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				makeId,
				nameEn: "A6 Quattro",
				nameAr: "A6 كواترو",
				slug,
				vehicleType: "car",
			}),
		});
		expect(res201.status).toBe(201);
		const createdModel = (await res201.json()) as Model;

		// PATCH
		const patchRes = await taxonomyApp.request(`/admin/models/${createdModel.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ vehicleType: "sedan" }),
		});
		expect(patchRes.status).toBe(200);

		// DELETE
		const delRes = await taxonomyApp.request(`/admin/models/${createdModel.id}`, {
			method: "DELETE",
		});
		expect(delRes.status).toBe(200);
	});
});
