import "dotenv/config";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
	console.error("❌ DATABASE_URL is not set");
	process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

try {
	console.log("🧭 Ensuring PostGIS extension is installed...");
	await client`CREATE EXTENSION IF NOT EXISTS postgis;`;
	console.log("✅ PostGIS extension is ready!");
} catch (err) {
	console.error("❌ Error enabling PostGIS extension:", err);
	process.exit(1);
} finally {
	await client.end();
}
