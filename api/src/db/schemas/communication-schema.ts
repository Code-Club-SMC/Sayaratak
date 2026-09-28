import { pgTable, text, timestamp, boolean, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";
import { listings } from "./listing-schema";

// Deletion policy: Cascade-deleted when associated listing or user is deleted.
export const conversations = pgTable("conversations", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
	buyerId: text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
	unq_listing_buyer: unique().on(t.listingId, t.buyerId),
}));

// Deletion policy: Cascade-deleted when parent conversation or sender user is deleted.
export const messages = pgTable(
	"messages",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
		senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		// Client-supplied idempotency key: lets a retried send (same clientMessageId) be safely
		// re-submitted without creating a duplicate message. Null for older/legacy rows.
		clientMessageId: text("client_message_id"),
		isRead: boolean("is_read").default(false),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		uniqueConversationClientMessage: uniqueIndex(
			"messages_conversation_client_message_idx",
		)
			.on(t.conversationId, t.clientMessageId)
			.where(sql`${t.clientMessageId} IS NOT NULL`),
	}),
);

// Deletion policy: Hard delete upon logout / token invalidation; cascade-deleted on user removal.
export const deviceTokens = pgTable("device_tokens", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	fcmToken: text("fcm_token").notNull().unique(),
	deviceType: text("device_type").notNull(), // 'ios', 'android', 'web'
	lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deletion policy: Hard delete upon user dismissal; cascade-deleted on user removal.
export const notifications = pgTable("notifications", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	body: text("body").notNull(),
	type: text("type").notNull(), // 'chat', 'match', 'system'
	referenceId: text("reference_id"), // conversationId, searchId, etc
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
