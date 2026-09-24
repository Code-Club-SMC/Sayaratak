import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { reports } from "../db/schemas/social-schema";
import { listings } from "../db/schemas/listing-schema";
import { user } from "../db/schemas/auth-schema";
import { NotFoundError } from "../lib/errors";
import type { CreateReportInput, GetReportsQuery, PatchReportInput } from "../schemas";

export const reportsService = {
	async createReport(reporterId: string, body: CreateReportInput) {
		const { listingId, reason, description } = body;

		if (listingId) {
			const [listing] = await db
				.select({ id: listings.id })
				.from(listings)
				.where(eq(listings.id, listingId));
			if (!listing) {
				throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
			}
		}

		const [report] = await db
			.insert(reports)
			.values({
				reporterId,
				listingId,
				reason,
				description,
			})
			.returning();

		return {
			id: report.id,
			reporterId: report.reporterId,
			listingId: report.listingId,
			reason: report.reason,
			description: report.description,
			status: report.status,
			createdAt: report.createdAt,
			updatedAt: report.updatedAt,
		};
	},

	async listReports(query: GetReportsQuery) {
		const limit = query.limit;

		let baseQuery = db
			.select({
				report: {
					id: reports.id,
					reporterId: reports.reporterId,
					listingId: reports.listingId,
					reason: reports.reason,
					description: reports.description,
					status: reports.status,
					createdAt: reports.createdAt,
					updatedAt: reports.updatedAt,
				},
				reporter: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
				listing: {
					id: listings.id,
					title: listings.title,
					price: listings.price,
					currency: listings.currency,
					status: listings.status,
					userId: listings.userId,
				},
			})
			.from(reports)
			.innerJoin(user, eq(reports.reporterId, user.id))
			.leftJoin(listings, eq(reports.listingId, listings.id))
			.$dynamic();

		if (query.status) {
			baseQuery = baseQuery.where(eq(reports.status, query.status));
		}

		return baseQuery.orderBy(sql`${reports.createdAt} DESC`).limit(limit);
	},

	async resolveReport(id: string, body: PatchReportInput) {
		const [updated] = await db
			.update(reports)
			.set({ status: body.status, updatedAt: new Date() })
			.where(eq(reports.id, id))
			.returning();

		if (!updated) {
			throw new NotFoundError("Report not found", "REPORT_NOT_FOUND");
		}

		return {
			id: updated.id,
			reporterId: updated.reporterId,
			listingId: updated.listingId,
			reason: updated.reason,
			description: updated.description,
			status: updated.status,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		};
	},
};
