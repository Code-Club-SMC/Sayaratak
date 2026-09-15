CREATE TABLE IF NOT EXISTS "share_links" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL UNIQUE,
	"targetType" text NOT NULL,
	"targetId" text NOT NULL,
	"targetUrl" text NOT NULL,
	"platform" text DEFAULT 'general' NOT NULL,
	"userId" text,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "updated_by" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "title_ar" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "content_ar" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "updated_by" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "shareCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "shareClickCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banners" ADD CONSTRAINT "banners_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "share_links" ADD CONSTRAINT "share_links_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;