CREATE TABLE "conversations" (
	"id" text PRIMARY KEY,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "conversations_listing_id_buyer_id_unique" UNIQUE("listing_id","buyer_id")
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"fcm_token" text NOT NULL UNIQUE,
	"device_type" text NOT NULL,
	"last_used_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
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
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_user_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_user_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;