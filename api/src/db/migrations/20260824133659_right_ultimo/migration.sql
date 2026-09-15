CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"iconUrl" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY,
	"countryId" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" text PRIMARY KEY,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"code" text NOT NULL UNIQUE,
	"currencyCode" text DEFAULT 'SDG' NOT NULL,
	"phoneCode" text DEFAULT '+249' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" text PRIMARY KEY,
	"cityId" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "makes" (
	"id" text PRIMARY KEY,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logoUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY,
	"makeId" text NOT NULL,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"slug" text NOT NULL,
	"vehicleType" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryId_countries_id_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_cityId_cities_id_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_makeId_makes_id_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE CASCADE;