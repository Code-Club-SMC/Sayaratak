import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { defineRelations } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schemas/index";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set. Check your .env file.");
}

export const queryClient = postgres(process.env.DATABASE_URL, {
	max: 20,
	idle_timeout: 10,
	connect_timeout: 10,
});

const relations = defineRelations(schema);

export const db = drizzle({ client: queryClient, relations });
export { schema };
