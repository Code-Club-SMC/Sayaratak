import z from "zod";

export const registerFormSchema = z
	.object({
		accountType: z.enum(["user", "dealership", "workshop", "mechanic"]),
		fullName: z
			.string()
			.min(5, "Full name must be at least 5 characters.")
			.max(32, "Full name must be at most 32 characters."),
		email: z.email("Enter a valid email"),
		password: z.string().min(8, "Password must be at least 8 characters."),
		confirmPassword: z
			.string()
			.min(8, "Confirm password must be at least 8 characters."),
		country: z.string().min(1, "Country must be selected."),
		city: z.string().min(1, "City must be selected."),
		acceptTerms: z.boolean().refine((value) => value === true, {
			message: "You must accept the terms.",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
