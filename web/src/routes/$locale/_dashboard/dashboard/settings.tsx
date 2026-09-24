import { createFileRoute } from "@tanstack/react-router";
import { Bell, Globe, Monitor, MoreVertical, Smartphone } from "lucide-react";
import { ProfileForm } from "@/components/domain/dashboard/profile-form";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { t } = useTranslation();
	const { user } = Route.useRouteContext();

	async function handleSaveProfile(_data: any) {
		// Mock API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		alert("Profile updated successfully!");
	}

	return (
		<div className="space-y-8 max-w-4xl pb-10">
			<div>
				<h1 className="text-3xl font-bold tracking-tight mb-2">
					Account Settings
				</h1>
				<p className="text-slate-600">
					Manage your personal information, preferences, and account security.
				</p>
			</div>

			{/* 1. Personal Profile */}
			<section className="bg-white rounded-2xl border border-border p-8 shadow-sm">
				<h2 className="text-lg font-bold mb-6">1. Personal Profile</h2>
				<ProfileForm
					user={{
						name: user.name,
						email: user.email,
						image: user.image,
					}}
					onSave={handleSaveProfile}
				/>
			</section>

			{/* 2. Language & Currency */}
			<section className="bg-white rounded-2xl border border-border p-8 shadow-sm">
				<h2 className="text-lg font-bold mb-6 flex items-center gap-2">
					<Globe className="size-5 text-blue-600" /> Language & Currency
				</h2>
				<div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
					<div className="space-y-2">
						<label className="text-sm font-medium">Language</label>
						<NativeSelect defaultValue="en">
							<option value="en">English</option>
							<option value="ar">العربية</option>
						</NativeSelect>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Currency</label>
						<NativeSelect defaultValue="sdg">
							<option value="sdg">SDG - Sudanese Pound</option>
							<option value="usd">USD - US Dollar</option>
						</NativeSelect>
					</div>
				</div>
			</section>

			{/* 3. Notifications */}
			<section className="bg-white rounded-2xl border border-border p-8 shadow-sm">
				<h2 className="text-lg font-bold mb-6 flex items-center gap-2">
					<Bell className="size-5 text-blue-600" /> Notifications
				</h2>

				<div className="max-w-2xl">
					<div className="grid grid-cols-[1fr_80px_80px] gap-4 mb-4 text-sm font-semibold text-slate-500">
						<div>Notification Type</div>
						<div className="text-center">Email</div>
						<div className="text-center">Push</div>
					</div>

					<div className="space-y-4">
						<div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3 border-b border-border/50">
							<div className="text-sm font-medium">Messages</div>
							<div className="flex justify-center">
								<Switch defaultChecked />
							</div>
							<div className="flex justify-center">
								<Switch defaultChecked />
							</div>
						</div>
						<div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3 border-b border-border/50">
							<div className="text-sm font-medium">Ad Inquiries</div>
							<div className="flex justify-center">
								<Switch defaultChecked />
							</div>
							<div className="flex justify-center">
								<Switch defaultChecked />
							</div>
						</div>
						<div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3 border-b border-border/50">
							<div className="text-sm font-medium">Saved Search Alerts</div>
							<div className="flex justify-center">
								<Switch defaultChecked />
							</div>
							<div className="flex justify-center">
								<Switch />
							</div>
						</div>
						<div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3">
							<div className="text-sm font-medium">
								Product Updates & Offers
							</div>
							<div className="flex justify-center">
								<Switch />
							</div>
							<div className="flex justify-center">
								<Switch />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 4. Session / Logout */}
			<section className="bg-white rounded-2xl border border-border p-8 shadow-sm">
				<h2 className="text-lg font-bold mb-6">4. Session / Logout</h2>
				<div className="mb-4 text-sm font-semibold text-slate-500">
					Active Sessions
				</div>

				<div className="space-y-3 mb-6">
					{/* Current */}
					<div className="flex items-center justify-between p-4 rounded-xl border border-border">
						<div className="flex items-center gap-4">
							<div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
								<Monitor className="size-5" />
							</div>
							<div>
								<div className="font-semibold text-sm">Current Device</div>
								<div className="text-xs text-slate-500">
									Chrome on Windows • Khartoum, SD
								</div>
							</div>
						</div>
						<div className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded">
							This Device
						</div>
					</div>

					{/* Other */}
					<div className="flex items-center justify-between p-4 rounded-xl border border-border">
						<div className="flex items-center gap-4">
							<div className="size-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
								<Smartphone className="size-5" />
							</div>
							<div>
								<div className="font-semibold text-sm">Mobile Device</div>
								<div className="text-xs text-slate-500">
									Samsung Galaxy S23 • Khartoum, SD
								</div>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-xs text-slate-500">
								May 17, 2025 at 09:12 AM
							</span>
							<Button variant="ghost" size="icon" className="size-8">
								<MoreVertical className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						className="text-blue-600 border-blue-200 hover:bg-blue-50"
					>
						Log Out of All Other Sessions
					</Button>
					<Button
						variant="outline"
						className="text-red-600 border-red-200 hover:bg-red-50 ml-auto"
					>
						Log Out
					</Button>
				</div>
			</section>
		</div>
	);
}
