CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"filters" jsonb NOT NULL,
	"lastNotifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "mileage" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "transmission" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "fuelType" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "condition" text;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;