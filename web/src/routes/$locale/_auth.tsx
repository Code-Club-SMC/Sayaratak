import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

/**
 * Auth layout — wraps login, register, forgot-password, etc.
 *
 * If the user is already authenticated, redirects to dashboard.
 * This prevents the awkward "logged in user sees the login page" state.
 */
export const Route = createFileRoute("/$locale/_auth")({
	beforeLoad: async ({ params }) => {
		try {
			const { data } = await authClient.getSession();
			if (data?.session) {
				throw redirect({
					to: "/$locale/_dashboard/dashboard",
					params: { locale: params.locale },
				});
			}
		} catch (e) {
			// Re-throw redirects
			if (e instanceof Response || (e && typeof e === "object" && "to" in e)) {
				throw e;
			}
			// Session check failed — allow access to auth pages
		}
	},
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="h-dvh w-full overflow-hidden">
			<div className="grid h-full grid-cols-1 md:grid-cols-3">
				<div className="relative hidden overflow-hidden md:block">
					<img
						src="/auth-layout.png"
						alt=""
						className="absolute inset-0 h-full w-full object-cover object-center"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
					<div className="relative flex h-full flex-col justify-between p-7">
						<img
							src="/sayaratak-logo.svg"
							alt="Sayaratak logo"
							className="size-30 object-center"
						/>
						<div className="flex flex-col gap-y-2">
							<h2 className="max-w-sm text-4xl font-bold text-white">
								Join Sayaratak in minutes
							</h2>
							<p className="max-w-sm text-gray-200">
								Create or login to your account and start buying, selling,
								renting or offering services with confidence.
							</p>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center overflow-y-auto md:col-span-2">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
