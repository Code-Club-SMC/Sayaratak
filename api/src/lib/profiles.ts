import { db } from "../db";
import { dealerships, workshops, mechanics } from "../db/schemas";
import { enrollInFreePlan } from "./monetization";
import { eq } from "drizzle-orm";

export type AccountType = "user" | "dealership" | "workshop" | "mechanic";

// Lookup map eliminates repeated if/else chains across profile-related routes
export const profileTableMap = {
	dealership: dealerships,
	workshop: workshops,
	mechanic: mechanics,
} as const;

export type ProfileType = keyof typeof profileTableMap;

export function isValidAccountType(value: string): value is AccountType {
	return (
		value === "user" ||
		value === "dealership" ||
		value === "workshop" ||
		value === "mechanic"
	);
}

export async function createProfileForUser(
	userId: string,
	accountType: AccountType,
) {
	// Regular users just get the free plan, no profile table entry
	if (accountType === "user") {
		await enrollInFreePlan(userId, accountType);
		return;
	}

	const table = profileTableMap[accountType as ProfileType];
	if (!table) return;

	const [existing] = await db
		.select({ id: table.id })
		.from(table as any)
		.where(eq(table.userId, userId))
		.limit(1);

	if (!existing) {
		await db.insert(table as any).values({ userId });
	}

	await enrollInFreePlan(userId, accountType);
}
