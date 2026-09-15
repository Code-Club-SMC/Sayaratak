ALTER TABLE "device_tokens" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "rentalPeriod" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "favoriteCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mechanics" ADD COLUMN "portfolioImages" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "images" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "last_message_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device_tokens" ALTER COLUMN "last_used_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device_tokens" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workshops" ALTER COLUMN "workingHours" SET DATA TYPE jsonb USING "workingHours"::jsonb;