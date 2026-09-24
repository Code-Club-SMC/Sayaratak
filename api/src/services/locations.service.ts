import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { countries, cities, districts } from "../db/schemas/taxonomy-schema";
import { NotFoundError } from "../lib/errors";
import type {
	CreateCountryInput,
	UpdateCountryInput,
	CreateCityInput,
	UpdateCityInput,
	CreateDistrictInput,
	UpdateDistrictInput,
} from "../schemas";

export const locationsService = {
	async getCountries() {
		return db
			.select({
				id: countries.id,
				nameEn: countries.nameEn,
				nameAr: countries.nameAr,
				code: countries.code,
				currencyCode: countries.currencyCode,
				phoneCode: countries.phoneCode,
				isActive: countries.isActive,
				createdAt: countries.createdAt,
				updatedAt: countries.updatedAt,
			})
			.from(countries)
			.where(eq(countries.isActive, true))
			.orderBy(asc(countries.nameEn));
	},

	async getCities(countryId?: string) {
		const conditions = [eq(cities.isActive, true)];
		if (countryId) {
			conditions.push(eq(cities.countryId, countryId));
		}

		return db
			.select({
				id: cities.id,
				countryId: cities.countryId,
				nameEn: cities.nameEn,
				nameAr: cities.nameAr,
				lat: cities.lat,
				lng: cities.lng,
				isActive: cities.isActive,
				createdAt: cities.createdAt,
				updatedAt: cities.updatedAt,
			})
			.from(cities)
			.where(and(...conditions))
			.orderBy(asc(cities.nameEn));
	},

	async getDistricts(cityId?: string) {
		const conditions = [eq(districts.isActive, true)];
		if (cityId) {
			conditions.push(eq(districts.cityId, cityId));
		}

		return db
			.select({
				id: districts.id,
				cityId: districts.cityId,
				nameEn: districts.nameEn,
				nameAr: districts.nameAr,
				lat: districts.lat,
				lng: districts.lng,
				isActive: districts.isActive,
				createdAt: districts.createdAt,
				updatedAt: districts.updatedAt,
			})
			.from(districts)
			.where(and(...conditions))
			.orderBy(asc(districts.nameEn));
	},

	// Admin Countries
	async createCountry(body: CreateCountryInput, userId?: string) {
		const [created] = await db
			.insert(countries)
			.values({
				nameEn: body.nameEn,
				nameAr: body.nameAr,
				code: body.code.toUpperCase(),
				currencyCode: body.currencyCode || "SDG",
				phoneCode: body.phoneCode || "+249",
				isActive: body.isActive ?? true,
				updatedBy: userId,
			})
			.returning();

		return created;
	},

	async updateCountry(id: string, body: UpdateCountryInput, userId?: string) {
		const [updated] = await db
			.update(countries)
			.set({
				...body,
				code: body.code ? body.code.toUpperCase() : undefined,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(countries.id, id))
			.returning();

		if (!updated) {
			throw new NotFoundError("Country not found", "COUNTRY_NOT_FOUND");
		}
		return updated;
	},

	async deleteCountry(id: string) {
		const [deleted] = await db
			.delete(countries)
			.where(eq(countries.id, id))
			.returning();

		if (!deleted) {
			throw new NotFoundError("Country not found", "COUNTRY_NOT_FOUND");
		}
		return { success: true, message: "Country deleted successfully" };
	},

	// Admin Cities
	async createCity(body: CreateCityInput, userId?: string) {
		const [created] = await db
			.insert(cities)
			.values({
				countryId: body.countryId,
				nameEn: body.nameEn,
				nameAr: body.nameAr,
				lat: body.lat ? Number(body.lat) : null,
				lng: body.lng ? Number(body.lng) : null,
				isActive: body.isActive ?? true,
				updatedBy: userId,
			})
			.returning();

		return created;
	},

	async updateCity(id: string, body: UpdateCityInput, userId?: string) {
		const [updated] = await db
			.update(cities)
			.set({
				...body,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(cities.id, id))
			.returning();

		if (!updated) {
			throw new NotFoundError("City not found", "CITY_NOT_FOUND");
		}
		return updated;
	},

	async deleteCity(id: string) {
		const [deleted] = await db
			.delete(cities)
			.where(eq(cities.id, id))
			.returning();

		if (!deleted) {
			throw new NotFoundError("City not found", "CITY_NOT_FOUND");
		}
		return { success: true, message: "City deleted successfully" };
	},

	// Admin Districts
	async createDistrict(body: CreateDistrictInput, userId?: string) {
		const [created] = await db
			.insert(districts)
			.values({
				cityId: body.cityId,
				nameEn: body.nameEn,
				nameAr: body.nameAr,
				lat: body.lat ? Number(body.lat) : null,
				lng: body.lng ? Number(body.lng) : null,
				isActive: body.isActive ?? true,
				updatedBy: userId,
			})
			.returning();

		return created;
	},

	async updateDistrict(id: string, body: UpdateDistrictInput, userId?: string) {
		const [updated] = await db
			.update(districts)
			.set({
				...body,
				updatedBy: userId,
				updatedAt: new Date(),
			})
			.where(eq(districts.id, id))
			.returning();

		if (!updated) {
			throw new NotFoundError("District not found", "DISTRICT_NOT_FOUND");
		}
		return updated;
	},

	async deleteDistrict(id: string) {
		const [deleted] = await db
			.delete(districts)
			.where(eq(districts.id, id))
			.returning();

		if (!deleted) {
			throw new NotFoundError("District not found", "DISTRICT_NOT_FOUND");
		}
		return { success: true, message: "District deleted successfully" };
	},
};
