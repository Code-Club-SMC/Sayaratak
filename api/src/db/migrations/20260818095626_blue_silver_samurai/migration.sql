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
	"workingHours" json,
	"isVerified" boolean DEFAULT false NOT NULL,
	"ratingAvg" integer DEFAULT 0 NOT NULL,
	"ratingCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "dealerships" ADD CONSTRAINT "dealerships_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_userId_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;