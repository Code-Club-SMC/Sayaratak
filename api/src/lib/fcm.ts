import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import { db } from "../db";
import { deviceTokens } from "../db/schemas/communication-schema";
import { eq, inArray } from "drizzle-orm";

// Initialize Firebase Admin silently if credentials are provided
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
	try {
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
		if (!getApps().length) {
			initializeApp({
				credential: cert(serviceAccount),
			});
		}
	} catch (e) {
		console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
	}
} else {
	console.warn("FIREBASE_SERVICE_ACCOUNT env variable not found. Push notifications will be skipped.");
}

/**
 * Dispatches a push notification to all of a user's active devices.
 */
export async function sendPushNotification(
	userId: string,
	title: string,
	body: string,
	data: Record<string, string> = {}
) {
	if (!getApps().length) return; // Silent fail if Firebase isn't configured for MVP

	try {
		// Fetch all tokens for the user
		const tokens = await db.select({ token: deviceTokens.fcmToken })
			.from(deviceTokens)
			.where(eq(deviceTokens.userId, userId));

		if (tokens.length === 0) return;

		const fcmTokens = tokens.map(t => t.token);

		const message: MulticastMessage = {
			notification: { title, body },
			data,
			tokens: fcmTokens,
		};

		const response = await getMessaging().sendEachForMulticast(message);
		
		// Clean up dead tokens (e.g. user uninstalled the app)
		const failedTokens: string[] = [];
		response.responses.forEach((resp, idx) => {
			if (!resp.success) {
				const errorCode = resp.error?.code;
				if (errorCode === 'messaging/invalid-registration-token' ||
					errorCode === 'messaging/registration-token-not-registered') {
					failedTokens.push(fcmTokens[idx]);
				}
			}
		});

		if (failedTokens.length > 0) {
			await db.delete(deviceTokens).where(inArray(deviceTokens.fcmToken, failedTokens));
		}
	} catch (e) {
		console.error("Error sending push notification:", e);
	}
}
