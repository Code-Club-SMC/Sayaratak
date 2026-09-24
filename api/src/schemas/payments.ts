import { z } from "zod";

export const getPackagesQuerySchema = z.object({
	roleTarget: z.enum(["dealership", "workshop", "mechanic", "user"]).optional(),
});

export const checkoutSchema = z.object({
	purpose: z.enum(["subscription", "featured_listing"]),
	packageId: z.string().optional(),
	listingId: z.string().optional(),
});

export const submitPaymentSchema = z.object({
	transactionId: z.string().min(1, "transactionId is required"),
});

export type GetPackagesQuery = z.infer<typeof getPackagesQuerySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
