import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { categories, makes, models } from "../db/schemas/taxonomy-schema";
import { NotFoundError, BadRequestError } from "../lib/errors";
import type {
	GetModelsQuery,
	CreateCategoryInput,
	UpdateCategoryInput,
	CreateMakeInput,
	UpdateMakeInput,
	CreateModelInput,
	UpdateModelInput,
} from "../schemas";

export const taxonomyService = {
	async getCategories() {
		return db
			.select({
				id: categories.id,
				slug: categories.slug,
				nameEn: categories.nameEn,
				nameAr: categories.nameAr,
				iconUrl: categories.iconUrl,
				displayOrder: categories.displayOrder,
				isActive: categories.isActive,
				createdAt: categories.createdAt,
				updatedAt: categories.updatedAt,
			})
			.from(categories)
			.where(eq(categories.isActive, true))
			.orderBy(asc(categories.displayOrder));
	},

	async getMakes() {
		return db
			.select({
				id: makes.id,
				slug: makes.slug,
				nameEn: makes.nameEn,
				nameAr: makes.nameAr,
				logoUrl: makes.logoUrl,
				isActive: makes.isActive,
				createdAt: makes.createdAt,
				updatedAt: makes.updatedAt,
			})
			.from(makes)
			.where(eq(makes.isActive, true))
			.orderBy(asc(makes.nameEn));
	},

	async getModelsByMake(makeId: string) {
		return db
			.select({
				id: models.id,
				makeId: models.makeId,
				nameEn: models.nameEn,
				nameAr: models.nameAr,
				slug: models.slug,
				vehicleType: models.vehicleType,
				isActive: models.isActive,
				createdAt: models.createdAt,
				updatedAt: models.updatedAt,
			})
			.from(models)
			.where(and(eq(models.makeId, makeId), eq(models.isActive, true)))
			.orderBy(asc(models.nameEn));
	},

	async getModels(query: GetModelsQuery) {
		const conditions = [eq(models.isActive, true)];
		if (query.makeId) {
			conditions.push(eq(models.makeId, query.makeId));
		}
		if (query.vehicleType) {
			conditions.push(eq(models.vehicleType, query.vehicleType));
		}

		return db
			.select({
				id: models.id,
				makeId: models.makeId,
				nameEn: models.nameEn,
				nameAr: models.nameAr,
				slug: models.slug,
				vehicleType: models.vehicleType,
				isActive: models.isActive,
				createdAt: models.createdAt,
				updatedAt: models.updatedAt,
			})
			.from(models)
			.where(and(...conditions))
			.orderBy(asc(models.nameEn));
	},

	// Admin Generic CRUD
	async createEntity(table: any, entityName: string, rawBody: any, userId?: string) {
		const body = { ...rawBody };
		if (body.slug) body.slug = body.slug.toLowerCase();

		// §1: Bilingual completeness policy — Arabic required for publish/activate
		if ((body.isActive ?? true) && !body.nameAr) {
			throw new BadRequestError(
				`Arabic name is required to publish a ${entityName.toLowerCase()}`,
				"INCOMPLETE_BILINGUAL_CONTENT",
			);
		}

		const [created] = await db
			.insert(table)
			.values({ ...body, isActive: body.isActive ?? true, updatedBy: userId })
			.returning();

		return created;
	},

	async updateEntity(table: any, entityName: string, id: string, rawBody: any, userId?: string) {
		const body = { ...rawBody };
		if (body.slug) body.slug = body.slug.toLowerCase();

		// §1: Bilingual completeness policy — Arabic required for publish/activate
		if (body.isActive === true) {
			const [existing] = await db.select().from(table).where(eq(table.id, id));
			if (!existing) {
				throw new NotFoundError(`${entityName} not found`, `${entityName.toUpperCase()}_NOT_FOUND`);
			}
			const effectiveNameAr = body.nameAr !== undefined ? body.nameAr : existing.nameAr;
			if (!effectiveNameAr) {
				throw new BadRequestError(
					`Cannot activate a ${entityName.toLowerCase()} without Arabic name`,
					"INCOMPLETE_BILINGUAL_CONTENT",
				);
			}
		}

		const [updated] = await db
			.update(table)
			.set({ ...body, updatedBy: userId, updatedAt: new Date() })
			.where(eq(table.id, id))
			.returning();

		if (!updated) {
			throw new NotFoundError(`${entityName} not found`, `${entityName.toUpperCase()}_NOT_FOUND`);
		}
		return updated;
	},

	async deleteEntity(table: any, entityName: string, id: string) {
		const [deleted] = await db.delete(table).where(eq(table.id, id)).returning();
		if (!deleted) {
			throw new NotFoundError(`${entityName} not found`, `${entityName.toUpperCase()}_NOT_FOUND`);
		}
		return { success: true, message: `${entityName} deleted successfully` };
	},
};
