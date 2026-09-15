CREATE TABLE "payments" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'SDG' NOT NULL,
	"method" text NOT NULL,
	"transactionId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"purpose" text NOT NULL,
	"referenceId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_packages" (
	"id" text PRIMARY KEY,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"roleTarget" text NOT NULL,
	"price" double precision NOT NULL,
	"currency" text DEFAULT 'SDG' NOT NULL,
	"durationDays" integer DEFAULT 30 NOT NULL,
	"listingLimit" integer DEFAULT 0 NOT NULL,
	"isFeaturedIncluded" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"packageId" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"listingId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY,
	"reporterId" text NOT NULL,
	"listingId" text,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"dealershipId" text,
	"workshopId" text,
	"mechanicId" text,
	"rating" integer NOT NULL,
	"comment" text,
	"reply" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "isFeatured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "userId_listingId_idx" ON "favorites" ("userId","listingId");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_packageId_subscription_packages_id_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listingId_listings_id_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_user_id_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listingId_listings_id_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dealershipId_dealerships_id_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_workshopId_workshops_id_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mechanicId_mechanics_id_fkey" FOREIGN KEY ("mechanicId") REFERENCES "mechanics"("id") ON DELETE CASCADE;