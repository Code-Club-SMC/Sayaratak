CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"issuer" text,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"impersonatedBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" text,
	"banExpires" timestamp,
	"accountType" text DEFAULT 'user' NOT NULL,
	"phone" text,
	"cityId" text,
	"preferredLanguage" text DEFAULT 'en' NOT NULL,
	"preferredCurrency" text DEFAULT 'SDG' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_listing_id_buyer_id_unique" UNIQUE("listing_id","buyer_id")
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"fcm_token" text NOT NULL UNIQUE,
	"device_type" text NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"reference_id" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"target_url" text,
	"placement" text DEFAULT 'home_top' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"title_ar" text,
	"content" text NOT NULL,
	"content_ar" text,
	"is_active" boolean DEFAULT true,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"rentalPeriod" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"year" integer,
	"mileage" integer,
	"transmission" text,
	"fuelType" text,
	"condition" text,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"phoneClickCount" integer DEFAULT 0 NOT NULL,
	"whatsappClickCount" integer DEFAULT 0 NOT NULL,
	"favoriteCount" integer DEFAULT 0 NOT NULL,
	"shareCount" integer DEFAULT 0 NOT NULL,
	"shareClickCount" integer DEFAULT 0 NOT NULL,
	"geom" geometry(Point,4326),
	"specs" jsonb DEFAULT '{}' NOT NULL,
	"media" jsonb DEFAULT '[]',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"updated_by" text,
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
CREATE TABLE "dealerships" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL UNIQUE,
	"name" text,
	"logoUrl" text,
	"coverUrl" text,
	"description" text,
	"phone" text,
	"cityId" text,
	"districtId" text,
	"lat" double precision,
	"lng" double precision,
	"isVerified" boolean DEFAULT false NOT NULL,
	"ratingAvg" integer DEFAULT 0 NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mechanics" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL UNIQUE,
	"name" text,
	"profilePicUrl" text,
	"phone" text,
	"whatsapp" text,
	"cityId" text,
	"yearsExperience" integer,
	"specialization" text,
	"bio" text,
	"portfolioImages" jsonb DEFAULT '[]',
	"isVerified" boolean DEFAULT false NOT NULL,
	"ratingAvg" integer DEFAULT 0 NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL UNIQUE,
	"name" text,
	"logoUrl" text,
	"cityId" text,
	"districtId" text,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"phone" text,
	"workingHours" jsonb,
	"images" jsonb DEFAULT '[]',
	"isVerified" boolean DEFAULT false NOT NULL,
	"ratingAvg" integer DEFAULT 0 NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"listingId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "share_links" (
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
CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"nameEn" text NOT NULL,
	"nameAr" text NOT NULL,
	"iconUrl" text,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"updated_by" text,
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
	"updated_by" text,
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
	"updated_by" text,
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
	"updated_by" text,
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
	"updated_by" text,
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
	"updated_by" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "listings_geom_idx" ON "listings" USING gist ("geom") WHERE "geom" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "listings_status_createdAt_idx" ON "listings" ("status","createdAt");--> statement-breakpoint
CREATE INDEX "listings_filter_idx" ON "listings" ("status","categoryId","makeId","modelId","cityId");--> statement-breakpoint
CREATE INDEX "listings_userId_status_idx" ON "listings" ("userId","status");--> statement-breakpoint
CREATE INDEX "payments_userId_status_idx" ON "payments" ("userId","status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "userId_listingId_idx" ON "favorites" ("userId","listingId");--> statement-breakpoint
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches" ("userId");--> statement-breakpoint
CREATE INDEX "share_links_target_platform_user_idx" ON "share_links" ("targetType","targetId","platform","userId");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_user_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_user_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_categoryId_categories_id_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_makeId_makes_id_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_modelId_models_id_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_countryId_countries_id_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_cityId_cities_id_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_districtId_districts_id_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_packages" ADD CONSTRAINT "subscription_packages_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_packageId_subscription_packages_id_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "dealerships" ADD CONSTRAINT "dealerships_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listingId_listings_id_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_user_id_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listingId_listings_id_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dealershipId_dealerships_id_fkey" FOREIGN KEY ("dealershipId") REFERENCES "dealerships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_workshopId_workshops_id_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mechanicId_mechanics_id_fkey" FOREIGN KEY ("mechanicId") REFERENCES "mechanics"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryId_countries_id_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_cityId_cities_id_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "makes" ADD CONSTRAINT "makes_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_makeId_makes_id_fkey" FOREIGN KEY ("makeId") REFERENCES "makes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;