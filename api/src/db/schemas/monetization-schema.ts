import { pgTable, text, integer, doublePrecision, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Deletion policy: Soft delete via isActive flag; hard delete restricted if userSubscriptions exist.
// Bilingual policy: Both nameEn and nameAr are required (enforced by NOT NULL constraint).
export const subscriptionPackages = pgTable("subscription_packages", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	nameEn: text("nameEn").notNull(),
	nameAr: text("nameAr").notNull(),
	roleTarget: text("roleTarget").notNull(), // "dealership", "workshop", "mechanic", "user"
	price: doublePrecision("price").notNull(),
	currency: text("currency").notNull().default("SDG"),
	durationDays: integer("durationDays").notNull().default(30),
	listingLimit: integer("listingLimit").notNull().default(0), // 0 means unlimited or n/a
	isFeaturedIncluded: boolean("isFeaturedIncluded").notNull().default(false),
	isActive: boolean("isActive").notNull().default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Retained for subscription history; status managed ("active" | "expired" | "cancelled"); cascade deleted on user removal.
export const userSubscriptions = pgTable(
	"user_subscriptions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		packageId: text("packageId")
			.notNull()
			.references(() => subscriptionPackages.id, { onDelete: "restrict" }),
		status: text("status").notNull().default("active"), // active, expired, cancelled
		startDate: timestamp("startDate").notNull().defaultNow(),
		endDate: timestamp("endDate").notNull(),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => ({
		userSubscriptionsUserIdIdx: index("user_subscriptions_userId_idx").on(table.userId),
	}),
);

// Deletion policy: Financial transaction records retained for audit; status managed ("pending" | "completed" | "failed"); cascade deleted on user removal.
export const payments = pgTable(
	"payments",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		amount: doublePrecision("amount").notNull(),
		currency: text("currency").notNull().default("SDG"),
		method: text("method").notNull(), // "bankak", "cash", etc.
		transactionId: text("transactionId"), // External ref
		status: text("status").notNull().default("pending"), // pending, completed, failed
		purpose: text("purpose").notNull(), // "subscription", "featured_listing"
		referenceId: text("referenceId"), // ID of subscription or listing
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => ({
		paymentsUserStatusIdx: index("payments_userId_status_idx").on(table.userId, table.status),
	}),
);
