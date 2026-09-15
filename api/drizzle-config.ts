import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set. Check your .env file.");
}

export default defineConfig({
	schema: "./src/db/schemas/*-schema.ts",
	out: "./src/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	strict: true,
	verbose: true,
});
