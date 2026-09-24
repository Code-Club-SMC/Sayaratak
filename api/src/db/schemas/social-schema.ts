import { pgTable, text, integer, timestamp, uniqueIndex, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { listings } from "./listing-schema";
import { dealerships, workshops, mechanics } from "./profile-schema";

// Deletion policy: Hard delete upon user removal/un-favorite; cascade-deleted on user or listing removal.
export const favorites = pgTable(
	"favorites",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		listingId: text("listingId")
			.notNull()
			.references(() => listings.id, { onDelete: "cascade" }),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => {
		return {
			userIdListingIdIdx: uniqueIndex("userId_listingId_idx").on(table.userId, table.listingId),
		};
	}
);

// Deletion policy: Hard delete by admin or author; cascade-deleted on user or target profile removal.
export const reviews = pgTable("reviews", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("userId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	// Target can be dealership, workshop, or mechanic
	dealershipId: text("dealershipId").references(() => dealerships.id, { onDelete: "cascade" }),
	workshopId: text("workshopId").references(() => workshops.id, { onDelete: "cascade" }),
	mechanicId: text("mechanicId").references(() => mechanics.id, { onDelete: "cascade" }),
	rating: integer("rating").notNull(), // 1 to 5
	comment: text("comment"),
	reply: text("reply"), // Business owner's reply
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Retained for moderation history; status managed ("pending" | "reviewed" | "resolved" | "dismissed"); cascade deleted on user or listing removal.
export const reports = pgTable("reports", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	reporterId: text("reporterId")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	listingId: text("listingId").references(() => listings.id, { onDelete: "cascade" }),
	reason: text("reason").notNull(),
	description: text("description"),
	status: text("status").notNull().default("pending"), // pending, reviewed, resolved, dismissed
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Deletion policy: Hard delete upon user delete request; cascade-deleted on user removal.
export const savedSearches = pgTable(
	"saved_searches",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		filters: jsonb("filters").$type<Record<string, any>>().notNull(), // MakeId, minPrice, maxPrice, year, etc.
		lastNotifiedAt: timestamp("lastNotifiedAt"),
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => ({
		savedSearchesUserIdIdx: index("saved_searches_userId_idx").on(table.userId),
	}),
);

// Deletion policy: Retained for analytics continuity; userId set to null if creator user is deleted.
export const shareLinks = pgTable(
	"share_links",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		code: text("code").notNull().unique(), // unique 8-character code
		targetType: text("targetType").notNull(), // "listing" | "dealership" | "workshop" | "mechanic" | "page"
		targetId: text("targetId").notNull(),
		targetUrl: text("targetUrl").notNull(),
		platform: text("platform").notNull().default("general"), // "whatsapp" | "facebook" | "telegram" | "tiktok" | "twitter" | "copy_link" | "general"
		userId: text("userId").references(() => user.id, { onDelete: "set null" }),
		clicks: integer("clicks").notNull().default(0), // human click-throughs
		impressions: integer("impressions").notNull().default(0), // crawler / bot preview unfurls
		createdAt: timestamp("createdAt").notNull().defaultNow(),
		updatedAt: timestamp("updatedAt").notNull().defaultNow(),
	},
	(table) => ({
		shareLinksTargetPlatformUserIdx: index("share_links_target_platform_user_idx").on(
			table.targetType,
			table.targetId,
			table.platform,
			table.userId,
		),
	}),
);
