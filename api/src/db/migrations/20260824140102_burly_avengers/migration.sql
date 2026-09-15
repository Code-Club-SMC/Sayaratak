CREATE TABLE "listings" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"categoryId" text NOT NULL,
	"makeId" text,
	"modelId" text,
	"countryId" text NOT NULL,
	"cityId" text NOT NULL,
	"districtId" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" double precision NOT NULL,
	"currency" text DEFAULT 'SDG' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"specs" jsonb DEFAULT '{}',
	"media" jsonb DEFAULT '[]',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_categoryId_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_makeId_makes_id_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_modelId_models_id_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_countryId_countries_id_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_cityId_cities_id_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_districtId_districts_id_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL;