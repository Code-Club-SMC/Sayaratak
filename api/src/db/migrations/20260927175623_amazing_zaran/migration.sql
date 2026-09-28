ALTER TABLE "listings" ADD COLUMN "contactPhone" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contactPhoneEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contactWhatsapp" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "contactWhatsappEnabled" boolean DEFAULT false NOT NULL;