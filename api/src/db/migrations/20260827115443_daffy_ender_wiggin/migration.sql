CREATE TABLE "banners" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"target_url" text,
	"placement" text DEFAULT 'home_top' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
