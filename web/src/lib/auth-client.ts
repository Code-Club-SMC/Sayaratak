import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "../../../api/lib/auth";

export const authClient = createAuthClient({
	baseURL:
		typeof process !== "undefined" && process.env.VITE_AUTH_URL
			? process.env.VITE_AUTH_URL
			: "http://localhost:8000",
	basePath: "/api/auth",
	plugins: [adminClient(), inferAdditionalFields<typeof auth>()],
});

export const {
	signUp,
	signIn,
	signOut,
	useSession,
	requestPasswordReset,
	resetPassword,
} = authClient;
