import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Deletion policy: Hard delete with application-level Cloudinary asset cleanup (deleteCloudinaryResources); soft-deactivation via isActive flag.
export const banners = pgTable("banners", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	title: text("title").notNull(),
	imageUrl: text("image_url").notNull(),
	targetUrl: text("target_url"),
	placement: text("placement").notNull().default("home_top"), // home_top, search_inline
	startDate: timestamp("start_date").notNull().defaultNow(),
	endDate: timestamp("end_date").notNull(),
	isActive: boolean("is_active").default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CMS Pages Table
// Architectural Decision: Content is stored as sanitized HTML (Option B: sanitized on write via sanitize-html server-side, stripping script tags, malicious event handlers, and javascript: URLs).
// Pages require both English and Arabic content when active/published. Drafts (isActive = false) allow partial language content.
// Deletion policy: Protected legal pages ("privacy-policy", "terms-and-conditions") cannot be deleted; other pages are soft-deleted via isActive = false.
export const pages = pgTable("pages", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	slug: text("slug").unique().notNull(), // e.g. about-us, privacy-policy, terms-and-conditions, contact-us
	title: text("title").notNull(),
	titleAr: text("title_ar"),
	content: text("content").notNull(), // Sanitized HTML
	contentAr: text("content_ar"), // Sanitized HTML
	isActive: boolean("is_active").default(true),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

