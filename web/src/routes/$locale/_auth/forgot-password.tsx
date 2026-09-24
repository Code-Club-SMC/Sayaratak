import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_auth/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { t, locale } = useTranslation();
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		const result = await authClient.requestPasswordReset({
			email,
			redirectTo: `/${locale}/reset-password`,
		});

		setLoading(false);

		if (result.error) {
			setError(result.error.message ?? "Failed to request password reset.");
			return;
		}

		setSubmitted(true);
	}

	return (
		<Card className="w-full max-w-md p-8 shadow-sm">
			<div className="space-y-1.5 text-center">
				<h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
					{t.auth.resetPassword}
				</h1>
				<p className="text-sm text-muted-foreground">
					{submitted ? t.auth.resetPasswordSent : t.auth.signInSubtitle}
				</p>
			</div>

			{submitted ? (
				<div className="space-y-4 pt-6 text-center">
					<p className="text-sm text-muted-foreground">
						{t.auth.resetPasswordSent}
					</p>
					<Button asChild className="w-full">
						<Link to="/$locale/login" params={{ locale }}>
							{t.auth.signInLink}
						</Link>
					</Button>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4 pt-6">
					<div className="space-y-2">
						<Label htmlFor="email">{t.auth.email}</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					{error && (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? t.common.loading : t.auth.sendResetLink}
					</Button>

					<div className="text-center pt-2">
						<Link
							to="/$locale/login"
							params={{ locale }}
							className="text-xs text-primary underline-offset-4 hover:underline"
						>
							{t.common.back} {t.auth.signInLink}
						</Link>
					</div>
				</form>
			)}
		</Card>
	);
}
