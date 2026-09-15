ALTER TABLE "subscription_packages" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "districts" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "makes" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "subscription_packages" ADD CONSTRAINT "subscription_packages_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "makes" ADD CONSTRAINT "makes_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;