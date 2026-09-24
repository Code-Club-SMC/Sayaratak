import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_auth/login")({
	validateSearch: z.object({
		redirect: z.string().optional(),
	}),
	component: LoginPage,
});

function LoginPage() {
	const { t, locale } = useTranslation();
	const { redirect: redirectTo } = Route.useSearch();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [socialLoading, setSocialLoading] = useState<
		"google" | "facebook" | null
	>(null);

	async function handleEmailLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const result = await authClient.signIn.email({ email, password });
		setLoading(false);

		if (result.error) {
			setError(result.error.message ?? "Unable to sign in.");
			return;
		}

		// Redirect to the original page or dashboard
		window.location.href = redirectTo ?? `/${locale}/dashboard`;
	}

	async function handleSocial(provider: "google" | "facebook") {
		setSocialLoading(provider);
		await authClient.signIn.social({
			provider,
			callbackURL: `/${locale}/oauth-callback`,
		});
	}

	return (
		<Card className="w-full max-w-md p-8 shadow-sm">
			<div className="space-y-1.5 text-center">
				<h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
					{t.auth.welcomeBack}
				</h1>
				<p className="text-sm text-muted-foreground">{t.auth.signInSubtitle}</p>
			</div>

			<form onSubmit={handleEmailLogin} className="space-y-4 pt-6">
				<div className="space-y-2">
					<Label htmlFor="email">{t.auth.email}</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">{t.auth.password}</Label>
						<Link
							to="/$locale/forgot-password"
							params={{ locale }}
							className="text-xs font-medium text-primary underline-offset-4 hover:underline"
						>
							{t.auth.forgotPassword}
						</Link>
					</div>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && (
					<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{error}
					</p>
				)}
				<Button type="submit" className="w-full" size="lg" disabled={loading}>
					{loading ? t.auth.signingIn : t.auth.signIn}
				</Button>
			</form>

			<div className="relative my-6">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t" />
				</div>
				<div className="relative flex justify-center text-xs uppercase">
					<span className="bg-card px-2 text-muted-foreground">
						{t.auth.orContinueWith}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<Button
					variant="outline"
					onClick={() => handleSocial("google")}
					disabled={socialLoading !== null}
				>
					{socialLoading === "google" ? (
						<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<svg viewBox="0 0 24 24" className="size-4" role="img">
							<title>Google</title>
							<path
								fill="#4285F4"
								d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-2 3.2-4.9 3.2-7.8z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.1v2.8A11 11 0 0 0 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.9 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.1a11 11 0 0 0 0 9.8l3.8-2.8z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.1 7.3l3.8 2.8C6.8 7.3 9.2 5.4 12 5.4z"
							/>
						</svg>
					)}
					Google
				</Button>
				<Button
					variant="outline"
					onClick={() => handleSocial("facebook")}
					disabled={socialLoading !== null}
				>
					{socialLoading === "facebook" ? (
						<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
					) : (
						<svg
							viewBox="0 0 24 24"
							className="size-4"
							fill="#1877F2"
							role="img"
						>
							<title>Facebook</title>
							<path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
						</svg>
					)}
					Facebook
				</Button>
			</div>

			<p className="pt-6 text-center text-sm text-muted-foreground">
				{t.auth.noAccount}{" "}
				<Link
					to="/$locale/register"
					params={{ locale }}
					className="font-medium text-primary underline-offset-4 hover:underline"
				>
					{t.auth.createOne}
				</Link>
			</p>
		</Card>
	);
}
