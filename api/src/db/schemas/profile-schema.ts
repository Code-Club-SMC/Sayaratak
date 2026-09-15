import {
	pgTable,
	text,
	integer,
	doublePrecision,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Deletion policy: Cascade-deleted when associated user record is removed.
export const dealerships = pgTable("dealerships", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	logoUrl: text("logoUrl"),
	coverUrl: text("coverUrl"),
	description: text("description"),
	phone: text("phone"),
	cityId: text("cityId"),
	districtId: text("districtId"),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Cascade-deleted when associated user record is removed.
export const workshops = pgTable("workshops", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	logoUrl: text("logoUrl"),
	cityId: text("cityId"),
	districtId: text("districtId"),
	address: text("address"),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	phone: text("phone"),
	workingHours: jsonb("workingHours"),
	images: jsonb("images").$type<string[]>().default([]),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Cascade-deleted when associated user record is removed.
export const mechanics = pgTable("mechanics", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	profilePicUrl: text("profilePicUrl"),
	phone: text("phone"),
	whatsapp: text("whatsapp"),
	cityId: text("cityId"),
	yearsExperience: integer("yearsExperience"),
	specialization: text("specialization"),
	bio: text("bio"),
	portfolioImages: jsonb("portfolioImages").$type<string[]>().default([]),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
