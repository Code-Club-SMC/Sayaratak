import {
	pgTable,
	text,
	integer,
	doublePrecision,
	boolean,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// 1. Countries
// Deletion policy: Soft delete via isActive flag; hard delete only when no associated cities/listings exist.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const countries = pgTable("countries", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	code: text("code").notNull().unique(), // e.g. "SD"
	currencyCode: text("currencyCode").notNull().default("SDG"),
	phoneCode: text("phoneCode").notNull().default("+249"),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 2. Cities
// Deletion policy: Soft delete via isActive flag; hard delete cascades to districts (restricted if active listings exist).
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const cities = pgTable("cities", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	countryId: text("countryId")
		.notNull()
		.references(() => countries.id, { onDelete: "cascade" }),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 3. Districts / Neighbourhoods
// Deletion policy: Soft delete via isActive flag; hard delete sets districtId to null on associated listings.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const districts = pgTable("districts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	cityId: text("cityId")
		.notNull()
		.references(() => cities.id, { onDelete: "cascade" }),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 4. Marketplace Categories
// Deletion policy: Soft delete via isActive flag; hard delete blocked if listings reference this category.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const categories = pgTable("categories", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").notNull().unique(),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	iconUrl: text("iconUrl"),
	displayOrder: integer("displayOrder").notNull().default(0),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 5. Vehicle Makes / Brands
// Deletion policy: Soft delete via isActive flag; hard delete cascades to models.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const makes = pgTable("makes", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	slug: text("slug").notNull().unique(),
	logoUrl: text("logoUrl"),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 6. Vehicle Models
// Deletion policy: Soft delete via isActive flag; hard delete cascades with parent make.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const models = pgTable("models", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	makeId: text("makeId")
		.notNull()
		.references(() => makes.id, { onDelete: "cascade" }),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	slug: text("slug").notNull(),
	vehicleType: text("vehicleType"), // e.g. "car", "truck", "motorcycle", "tuk-tuk"
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

