// Crawler / Bot Detection (To prevent click/metric inflation from unfurls)
const CRAWLER_USER_AGENTS = [
	/facebookexternalhit/i,
	/Facebot/i,
	/WhatsApp/i,
	/TelegramBot/i,
	/Twitterbot/i,
	/LinkedInBot/i,
	/Discordbot/i,
	/Slackbot/i,
	/Pinterest/i,
	/Googlebot/i,
	/bingbot/i,
	/Applebot/i,
	/SkypeUriPreview/i,
];

export function isBotUserAgent(userAgent?: string | null): boolean {
	if (!userAgent) return false;
	return CRAWLER_USER_AGENTS.some((regex) => regex.test(userAgent));
}
