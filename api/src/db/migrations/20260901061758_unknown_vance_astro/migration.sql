CREATE TABLE IF NOT EXISTS "pages" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
