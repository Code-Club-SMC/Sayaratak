import {
	pgTable,
	text,
	doublePrecision,
	timestamp,
	jsonb,
	boolean,
	integer,
	customType,
	index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";
import {
	categories,
	makes,
	models,
	countries,
	cities,
	districts,
} from "./taxonomy-schema";

// Deletion policy: Hard delete with application-level Cloudinary asset cascade delete (deleteCloudinaryFolder); lifecycle state managed via status column ("draft" | "available" | "reserved" | "sold" | "rented" | "banned").
export const listings = pgTable(
	"listings",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		categoryId: text("categoryId")
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		makeId: text("makeId").references(() => makes.id, { onDelete: "set null" }),
		modelId: text("modelId").references(() => models.id, { onDelete: "set null" }),
		countryId: text("countryId")
			.notNull()
			.references(() => countries.id, { onDelete: "restrict" }),
		cityId: text("cityId")
			.notNull()
			.references(() => cities.id, { onDelete: "restrict" }),
		districtId: text("districtId").references(() => districts.id, { onDelete: "set null" }),

		title: text("title").notNull(),
		description: text("description").notNull(),
		price: doublePrecision("price").notNull(),
		currency: text("currency").notNull().default("SDG"),

		// For rental listings: "daily" | "weekly" | "monthly"
		rentalPeriod: text("rentalPeriod"),

		// Enums enforced at application level via Zod for simplicity
		status: text("status").notNull().default("draft"), // "draft" | "available" | "reserved" | "sold" | "rented" | "pending" | "rejected" | "banned"

		// Geolocation
		lat: doublePrecision("lat"),
		lng: doublePrecision("lng"),

		// Features & Promotion
		isFeatured: boolean("isFeatured").notNull().default(false),

		// Extracted High-Traffic Fields for Advanced Filtering
		year: integer("year"),
		mileage: integer("mileage"),
		transmission: text("transmission"), // e.g. "Automatic", "Manual"
		fuelType: text("fuelType"), // e.g. "Petrol", "Diesel", "Electric"
		condition: text("condition"), // e.g. "New", "Used"

		// Analytics
		viewCount: integer("viewCount").notNull().default(0),
		phoneClickCount: integer("phoneClickCount").notNull().default(0),
		whatsappClickCount: integer("whatsappClickCount").notNull().default(0),
		favoriteCount: integer("favoriteCount").notNull().default(0),
		shareCount: integer("shareCount").notNull().default(0), // share intents created
		shareClickCount: integer("shareClickCount").notNull().default(0), // human click-throughs via shared links

		// Location (PostGIS)
		geom: customType<{ data: any; driverData: string }>({
			dataType() {
				return "geometry(Point, 4326)";
			},
		})("geom"),

		// Metadata
		specs: jsonb("specs").$type<Record<string, any>>().notNull().default({}),
		media: jsonb("media").$type<Array<{ url: string; isPrimary: boolean }>>().default([]),

		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => ({
		listingsGeomIdx: index("listings_geom_idx")
			.using("gist", table.geom)
			.where(sql`${table.geom} IS NOT NULL`),
		listingsStatusCreatedAtIdx: index("listings_status_createdAt_idx").on(table.status, table.createdAt),
		listingsFilterIdx: index("listings_filter_idx").on(
			table.status,
			table.categoryId,
			table.makeId,
			table.modelId,
			table.cityId,
		),
		listingsUserStatusIdx: index("listings_userId_status_idx").on(table.userId, table.status),
	}),
);
