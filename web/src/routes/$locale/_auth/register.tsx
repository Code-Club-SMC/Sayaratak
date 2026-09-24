import { createFileRoute, Link } from "@tanstack/react-router";
import { RegisterForm } from "@/components/custom/auth/register-form";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_auth/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const { t, locale } = useTranslation();

	return (
		<div className="w-full max-w-lg p-4 my-8">
			<Card className="p-8 shadow-sm">
				<div className="space-y-1.5 text-center mb-6">
					<h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
						{t.auth.createAccount}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t.auth.signInSubtitle}
					</p>
				</div>

				<RegisterForm />

				<p className="pt-6 text-center text-sm text-muted-foreground">
					{t.auth.haveAccount}{" "}
					<Link
						to="/$locale/login"
						params={{ locale }}
						className="font-medium text-primary underline-offset-4 hover:underline"
					>
						{t.auth.signInLink}
					</Link>
				</p>
			</Card>
		</div>
	);
}
