import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Deletion policy: Soft-deactivated via banned flag / banExpires for moderation; hard delete cascades to sessions, accounts, and user data.
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull().default(false),
	image: text("image"),
	role: text("role").notNull().default("user"),
	banned: boolean("banned").notNull().default(false),
	banReason: text("banReason"),
	banExpires: timestamp("banExpires"),
	accountType: text("accountType").notNull().default("user"),
	phone: text("phone"),
	cityId: text("cityId"),
	preferredLanguage: text("preferredLanguage").notNull().default("en"),
	preferredCurrency: text("preferredCurrency").notNull().default("SDG"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Hard delete upon session expiry, logout, or cascade delete on user removal.
export const session = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expiresAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	impersonatedBy: text("impersonatedBy"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Hard delete upon OAuth account unlinking or cascade delete on user removal.
export const account = pgTable("account", {
	id: text("id").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	issuer: text("issuer"),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	idToken: text("idToken"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Hard delete upon verification token consumption or expiry cleanup.
export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
