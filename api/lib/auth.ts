import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin, bearer } from "better-auth/plugins";
import { db } from "../src/db";
import * as schema from "../src/db/schemas/index";
import {
	sendResetPasswordEmail,
	sendVerificationEmail,
} from "../src/lib/mailer";
import { createProfileForUser, isValidAccountType } from "../src/lib/profiles";
export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8000",
	basePath: "/api/auth",
	trustedOrigins: [
		process.env.CLIENT_URL || "http://localhost:3000",
		process.env.BETTER_AUTH_URL || "http://localhost:8000",
		"http://localhost:8000",
	],
	advanced: {
		disableCSRFCheck: true,
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		resetPasswordTokenExpiresIn: 3600, // Token expires in 1 hour
		sendResetPassword: async ({ user, url, token }) => {
			await sendResetPasswordEmail({ email: user.email, url, token });
		},
		customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
			...coreFields,
			role: "user",
			banned: false,
			banReason: null,
			banExpires: null,
			...additionalFields,
			id,
		}),
	},
	emailVerification: {
		sendOnSignUp: true,
		expiresIn: 3600, // Token expires in 1 hour (3600 seconds)
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }) => {
			await sendVerificationEmail({ email: user.email, url, token });
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
		facebook: {
			clientId: process.env.FACEBOOK_CLIENT_ID!,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
		},
	},
	plugins: [admin({ defaultRole: "user" }), bearer()],
	user: {
		additionalFields: {
			accountType: {
				type: ["user", "dealership", "workshop", "mechanic"],
				required: false,
				defaultValue: "user",
				input: true,
			},
			phone: {
				type: "string",
				required: false,
				input: true,
			},
			country: {
				type: "string",
				required: false,
				input: true,
			},
			cityId: {
				type: "string",
				required: false,
				input: true,
			},
			preferredLanguage: {
				type: "string",
				required: false,
				defaultValue: "en",
				input: true,
			},

			preferredCurrency: {
				type: "string",
				required: false,
				defaultValue: "SDG",
				input: true,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const accountType = (user as { accountType?: unknown })
						.accountType as string;
					if (isValidAccountType(accountType)) {
						await createProfileForUser(user.id, accountType);
					}
				},
			},
		},
	},
});
