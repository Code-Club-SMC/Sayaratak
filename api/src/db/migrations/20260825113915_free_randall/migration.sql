ALTER TABLE "listings" ADD COLUMN "geom" geometry(Point,4326);--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "specs" SET NOT NULL;