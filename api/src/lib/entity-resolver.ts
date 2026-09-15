import { eq } from "drizzle-orm";
import { db } from "../db";
import { listings } from "../db/schemas/listing-schema";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";
import { categories, makes } from "../db/schemas/taxonomy-schema";
import { pages } from "../db/schemas/content-schema";

/**
 * Shared Entity Resolution Convention (AGENTS.md §5)
 * - Slug-keyed: page, category, make
 * - ID-keyed: listing, dealership, workshop, mechanic
 */

export const SLUG_KEYED_ENTITY_TYPES = ["page", "category", "make"] as const;
export const ID_KEYED_ENTITY_TYPES = [
	"listing",
	"vehicle",
	"dealership",
	"dealer",
	"workshop",
	"mechanic",
] as const;

export type SlugKeyedEntityType = (typeof SLUG_KEYED_ENTITY_TYPES)[number];
export type IdKeyedEntityType = (typeof ID_KEYED_ENTITY_TYPES)[number];
export type ResolvableEntityType = SlugKeyedEntityType | IdKeyedEntityType;

export function isSlugKeyedEntity(type: string): type is SlugKeyedEntityType {
	return SLUG_KEYED_ENTITY_TYPES.includes(type.toLowerCase() as SlugKeyedEntityType);
}

export function isIdKeyedEntity(type: string): type is IdKeyedEntityType {
	return ID_KEYED_ENTITY_TYPES.includes(type.toLowerCase() as IdKeyedEntityType);
}

export type ResolvedEntityResult = {
	type: ResolvableEntityType;
	identifier: string;
	entity: any;
	isAvailable: boolean;
};

/**
 * Shared entity lookup helper that branches according to the slug vs ID convention.
 */
export async function resolveEntity(
	type: ResolvableEntityType,
	identifier: string
): Promise<ResolvedEntityResult | null> {
	const normalizedType = type.toLowerCase() as ResolvableEntityType;

	switch (normalizedType) {
		case "listing":
		case "vehicle": {
			const [listing] = await db.select().from(listings).where(eq(listings.id, identifier));
			if (!listing) return null;
			return {
				type: "listing",
				identifier: listing.id,
				entity: listing,
				isAvailable: listing.status === "available",
			};
		}
		case "dealership":
		case "dealer": {
			const [dealer] = await db.select().from(dealerships).where(eq(dealerships.id, identifier));
			if (!dealer) return null;
			return {
				type: "dealership",
				identifier: dealer.id,
				entity: dealer,
				isAvailable: true,
			};
		}
		case "workshop": {
			const [ws] = await db.select().from(workshops).where(eq(workshops.id, identifier));
			if (!ws) return null;
			return {
				type: "workshop",
				identifier: ws.id,
				entity: ws,
				isAvailable: true,
			};
		}
		case "mechanic": {
			const [mech] = await db.select().from(mechanics).where(eq(mechanics.id, identifier));
			if (!mech) return null;
			return {
				type: "mechanic",
				identifier: mech.id,
				entity: mech,
				isAvailable: true,
			};
		}
		case "category": {
			const [cat] = await db.select().from(categories).where(eq(categories.slug, identifier));
			if (!cat) return null;
			return {
				type: "category",
				identifier: cat.slug,
				entity: cat,
				isAvailable: cat.isActive,
			};
		}
		case "make": {
			const [mk] = await db.select().from(makes).where(eq(makes.slug, identifier));
			if (!mk) return null;
			return {
				type: "make",
				identifier: mk.slug,
				entity: mk,
				isAvailable: mk.isActive,
			};
		}
		case "page": {
			const [pg] = await db.select().from(pages).where(eq(pages.slug, identifier));
			if (!pg) return null;
			return {
				type: "page",
				identifier: pg.slug,
				entity: pg,
				isAvailable: pg.isActive,
			};
		}
		default:
			return null;
	}
}
