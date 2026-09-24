import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Bell,
	Car,
	CheckCircle2,
	Clock,
	Eye,
	Heart,
	MessageSquare,
	MoreVertical,
	Phone,
	PieChart,
	Search,
	Settings,
	ShieldAlert,
	UserPlus,
	Zap,
} from "lucide-react";
import { ListingCard } from "@/components/domain/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/")({
	component: DashboardOverview,
});

function StatCard({
	title,
	value,
	icon: Icon,
	linkText,
	href,
}: {
	title: string;
	value: string;
	icon: any;
	linkText: string;
	href: string;
}) {
	return (
		<div className="bg-white rounded-[12px] p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
			<div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
				<Icon className="size-5" />
			</div>
			<div>
				<h3 className="text-[28px] leading-none font-bold mb-1.5 text-slate-900">
					{value}
				</h3>
				<p className="text-[13px] text-slate-500 mb-4">{title}</p>
				<Link
					to={href}
					className="text-blue-600 text-[13px] font-medium flex items-center gap-1 hover:underline"
				>
					{linkText} <ArrowRight className="size-3.5" />
				</Link>
			</div>
		</div>
	);
}

// Dummy data for Recently Viewed
const recentlyViewed = [
	{
		id: "1",
		title: "Toyota Corolla Altis 1.8 X",
		year: 2021,
		mileage: 48500,
		price: 24750000,
		city: "Khartoum",
		images: [
			"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=300&q=80",
		],
	},
	{
		id: "2",
		title: "Hyundai Tucson 2.0",
		year: 2020,
		mileage: 62000,
		price: 33800000,
		city: "Omdurman",
		images: [
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80",
		],
	},
	{
		id: "3",
		title: "Toyota Hilux GL 2.4",
		year: 2022,
		mileage: 27000,
		price: 42500000,
		city: "Khartoum",
		images: [
			"https://images.unsplash.com/photo-1593950315186-76a92975b60c?auto=format&fit=crop&w=300&q=80",
		],
	},
	{
		id: "4",
		title: "Bajaj RE Compact",
		year: 2019,
		mileage: 18000,
		price: 4800000,
		city: "Khartoum",
		images: [
			"https://images.unsplash.com/photo-1581561571439-d3e9196b0267?auto=format&fit=crop&w=300&q=80",
		],
	},
	{
		id: "5",
		title: "Yamaha YBR 125",
		year: 2021,
		mileage: 9500,
		price: 2600000,
		city: "Omdurman",
		images: [
			"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80",
		],
	},
];

function DashboardOverview() {
	const { t, locale } = useTranslation();
	const { user } = Route.useRouteContext();

	return (
		<div className="flex flex-col xl:flex-row gap-6">
			{/* Main Content (Left) */}
			<div className="flex-1 space-y-8 min-w-0">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
						Welcome back, {user.name.split(" ")[0]}!
					</h1>
					<p className="text-[13px] text-slate-900">
						Here's what's happening with your account today.
					</p>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
					<StatCard
						title="Active Listings"
						value="8"
						icon={Car}
						linkText="Manage"
						href="/$locale/dashboard/listings"
					/>
					<StatCard
						title="Pending Review"
						value="2"
						icon={Clock}
						linkText="View"
						href="/$locale/dashboard/listings"
					/>
					<StatCard
						title="Favorites"
						value="24"
						icon={Heart}
						linkText="View"
						href="/$locale/dashboard/favorites"
					/>
					<StatCard
						title="Saved Searches"
						value="5"
						icon={Search}
						linkText="View"
						href="/$locale/dashboard/saved-searches"
					/>
					<StatCard
						title="Unread Messages"
						value="5"
						icon={MessageSquare}
						linkText="View"
						href="/$locale/dashboard/messages"
					/>
					<StatCard
						title="Unread Notifications"
						value="7"
						icon={Bell}
						linkText="View"
						href="/$locale/dashboard/notifications"
					/>
				</div>

				{/* Recently Viewed */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
							<Car className="size-4 text-blue-600" /> Recently Viewed
						</h2>
						<Button
							variant="link"
							className="text-blue-600 text-[13px] font-medium gap-1 pr-0"
						>
							View all <ArrowRight className="size-3.5" />
						</Button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
						{recentlyViewed.map((listing) => (
							<ListingCard
								key={listing.id}
								listing={listing as any}
								variant="grid"
							/>
						))}
					</div>
				</div>

				{/* Listing Performance */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
							<PieChart className="size-4 text-blue-600" /> Listing Performance{" "}
							<span className="text-[13px] font-medium text-slate-500">
								(Last 30 Days)
							</span>
						</h2>
						<Button
							variant="link"
							className="text-blue-600 text-[13px] font-medium gap-1 pr-0"
						>
							View all analytics <ArrowRight className="size-3.5" />
						</Button>
					</div>
					<div className="flex flex-col xl:flex-row gap-4">
						<div className="flex-[3] bg-white rounded-[12px] border border-slate-200 p-5 shadow-sm">
							<h3 className="font-semibold mb-4 text-[13px] text-slate-900">
								Overall Performance
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="p-3 bg-slate-50 rounded-xl">
									<div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1.5">
										<Eye className="size-3" /> Views
									</div>
									<div className="font-bold text-xl text-slate-900 mb-1">
										1,245
									</div>
									<div className="text-[11px] text-green-600 font-medium">
										↑ 18%
									</div>
								</div>
								<div className="p-3 bg-slate-50 rounded-xl">
									<div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1.5">
										<Phone className="size-3" /> Contacts
									</div>
									<div className="font-bold text-xl text-slate-900 mb-1">
										87
									</div>
									<div className="text-[11px] text-green-600 font-medium">
										↑ 12%
									</div>
								</div>
								<div className="p-3 bg-slate-50 rounded-xl">
									<div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1.5">
										<MessageSquare className="size-3" /> Messages
									</div>
									<div className="font-bold text-xl text-slate-900 mb-1">
										36
									</div>
									<div className="text-[11px] text-green-600 font-medium">
										↑ 8%
									</div>
								</div>
								<div className="p-3 bg-slate-50 rounded-xl">
									<div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1.5">
										<Heart className="size-3" /> Favorites
									</div>
									<div className="font-bold text-xl text-slate-900 mb-1">
										52
									</div>
									<div className="text-[11px] text-green-600 font-medium">
										↑ 15%
									</div>
								</div>
							</div>
						</div>
						<div className="flex-[2] bg-white rounded-[12px] border border-slate-200 p-5 shadow-sm">
							<h3 className="font-semibold mb-4 text-[13px] text-slate-900">
								Top Performing Listing
							</h3>
							<div className="flex gap-3">
								<div className="w-[88px] h-[56px] rounded-lg bg-slate-100 shrink-0 object-cover overflow-hidden">
									<img
										src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=160&q=80"
										alt="Car"
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="flex flex-col justify-center">
									<h4 className="font-bold text-[13px] text-slate-900 line-clamp-1">
										Toyota Corolla Altis 1.8 X 2021
									</h4>
									<div className="font-bold text-slate-900 text-[11px] mt-0.5">
										SDG 24,750,000
									</div>
								</div>
							</div>
							<div className="flex justify-between mt-5 pt-4 border-t border-slate-100">
								<div className="text-center">
									<div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-medium mb-1">
										<Eye className="size-3" /> Views
									</div>
									<div className="font-bold text-[13px] text-slate-900">
										542
									</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-medium mb-1">
										<Phone className="size-3" /> Contacts
									</div>
									<div className="font-bold text-[13px] text-slate-900">31</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-medium mb-1">
										<MessageSquare className="size-3" /> Messages
									</div>
									<div className="font-bold text-[13px] text-slate-900">12</div>
								</div>
								<div className="text-center">
									<div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-medium mb-1">
										<Heart className="size-3" /> Favorites
									</div>
									<div className="font-bold text-[13px] text-slate-900">18</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Your Listings Overview */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
							<Settings className="size-4 text-blue-600" /> Your Listings
							Overview
						</h2>
						<Button
							variant="link"
							className="text-blue-600 text-[13px] font-medium gap-1 pr-0"
						>
							View all listings <ArrowRight className="size-3.5" />
						</Button>
					</div>
					<div className="bg-white rounded-[12px] border border-slate-200 shadow-sm overflow-hidden">
						<table className="w-full text-sm text-left">
							<thead className="bg-slate-50 text-slate-500 text-[12px] font-medium border-b border-slate-200">
								<tr>
									<th className="px-5 py-3 font-medium">Listing</th>
									<th className="px-5 py-3 font-medium">Status</th>
									<th className="px-5 py-3 font-medium text-center">Views</th>
									<th className="px-5 py-3 font-medium text-center">
										Contacts
									</th>
									<th className="px-5 py-3 font-medium text-center">
										Messages
									</th>
									<th className="px-5 py-3 font-medium text-center">
										Favorites
									</th>
									<th className="px-5 py-3 font-medium">Updated</th>
									<th className="px-5 py-3 font-medium"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								<tr className="hover:bg-slate-50/50">
									<td className="px-5 py-4">
										<div className="flex items-center gap-3">
											<div className="w-[64px] h-[44px] rounded-md bg-slate-100 shrink-0 overflow-hidden">
												<img
													src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=120&q=80"
													alt="Car"
													className="w-full h-full object-cover"
												/>
											</div>
											<div>
												<div className="font-semibold text-[13px] text-slate-900 line-clamp-1">
													Toyota Corolla Altis 1.8 X 2021
												</div>
												<div className="text-[11px] font-medium text-slate-500 mt-0.5">
													SDG 24,750,000
												</div>
											</div>
										</div>
									</td>
									<td className="px-5 py-4">
										<Badge className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none font-medium px-2.5 py-0.5">
											Active
										</Badge>
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										542
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										31
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										12
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										18
									</td>
									<td className="px-5 py-4 text-slate-500 text-[12px]">
										May 18, 2025
									</td>
									<td className="px-5 py-4 text-right">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-slate-400"
										>
											<MoreVertical className="size-4" />
										</Button>
									</td>
								</tr>
								<tr className="hover:bg-slate-50/50">
									<td className="px-5 py-4">
										<div className="flex items-center gap-3">
											<div className="w-[64px] h-[44px] rounded-md bg-slate-100 shrink-0 overflow-hidden">
												<img
													src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=120&q=80"
													alt="Car"
													className="w-full h-full object-cover"
												/>
											</div>
											<div>
												<div className="font-semibold text-[13px] text-slate-900 line-clamp-1">
													Isuzu NPR 85 2019
												</div>
												<div className="text-[11px] font-medium text-slate-500 mt-0.5">
													SDG 115,000,000
												</div>
											</div>
										</div>
									</td>
									<td className="px-5 py-4">
										<Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 shadow-none font-medium px-2.5 py-0.5">
											Pending Review
										</Badge>
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-400 text-center">
										—
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-400 text-center">
										—
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-400 text-center">
										—
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-400 text-center">
										—
									</td>
									<td className="px-5 py-4 text-slate-500 text-[12px]">
										May 17, 2025
									</td>
									<td className="px-5 py-4 text-right">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-slate-400"
										>
											<MoreVertical className="size-4" />
										</Button>
									</td>
								</tr>
								<tr className="hover:bg-slate-50/50">
									<td className="px-5 py-4">
										<div className="flex items-center gap-3">
											<div className="w-[64px] h-[44px] rounded-md bg-slate-100 shrink-0 overflow-hidden">
												<img
													src="https://images.unsplash.com/photo-1593950315186-76a92975b60c?auto=format&fit=crop&w=120&q=80"
													alt="Vehicle"
													className="w-full h-full object-cover"
												/>
											</div>
											<div>
												<div className="font-semibold text-[13px] text-slate-900 line-clamp-1">
													Bajaj RE Compact 2019
												</div>
												<div className="text-[11px] font-medium text-slate-500 mt-0.5">
													SDG 4,800,000
												</div>
											</div>
										</div>
									</td>
									<td className="px-5 py-4">
										<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none font-medium px-2.5 py-0.5">
											Paused
										</Badge>
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										187
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										8
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										3
									</td>
									<td className="px-5 py-4 font-semibold text-[13px] text-slate-900 text-center">
										6
									</td>
									<td className="px-5 py-4 text-slate-500 text-[12px]">
										May 16, 2025
									</td>
									<td className="px-5 py-4 text-right">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-slate-400"
										>
											<MoreVertical className="size-4" />
										</Button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Right Sidebar */}
			<div className="w-full xl:w-[320px] shrink-0 space-y-6">
				{/* Profile Completion */}
				<div className="bg-white rounded-[12px] border border-slate-200 p-6 shadow-sm">
					<h3 className="font-bold mb-4 text-[15px] text-slate-900">
						Profile Completion
					</h3>
					<div className="flex items-center gap-4 mb-6">
						<div className="relative size-[68px] flex items-center justify-center shrink-0">
							<svg
								className="size-[68px] rotate-[-90deg]"
								role="img"
								aria-label="Profile completion progress"
							>
								<title>Profile completion progress</title>
								<circle
									cx="34"
									cy="34"
									r="30"
									fill="none"
									stroke="currentColor"
									strokeWidth="6"
									className="text-slate-100"
								/>
								<circle
									cx="34"
									cy="34"
									r="30"
									fill="none"
									stroke="currentColor"
									strokeWidth="6"
									strokeDasharray="188"
									strokeDashoffset="37.6"
									className="text-blue-600"
									strokeLinecap="round"
								/>
							</svg>
							<span className="absolute font-bold text-[15px] text-slate-900">
								80%
							</span>
						</div>
						<div>
							<p className="font-bold text-[13px] text-slate-900 mb-1">
								Great job! Almost there.
							</p>
							<p className="text-[12px] text-slate-500 leading-relaxed">
								Complete your profile to build trust and get more responses.
							</p>
						</div>
					</div>
					<ul className="space-y-3.5 mb-6">
						<li className="flex items-center gap-3 text-[13px] font-medium text-slate-900">
							<CheckCircle2 className="size-[18px] text-green-500 shrink-0" />{" "}
							Profile Photo
						</li>
						<li className="flex items-center gap-3 text-[13px] font-medium text-slate-900">
							<CheckCircle2 className="size-[18px] text-green-500 shrink-0" />{" "}
							Phone Number Verified
						</li>
						<li className="flex items-center gap-3 text-[13px] font-medium text-slate-900">
							<CheckCircle2 className="size-[18px] text-green-500 shrink-0" />{" "}
							Email Verified
						</li>
						<li className="flex items-center gap-3 text-[13px] font-medium text-slate-900">
							<CheckCircle2 className="size-[18px] text-green-500 shrink-0" />{" "}
							Personal Information
						</li>
						<li className="flex items-center gap-3 text-[13px] font-medium text-slate-900">
							<div className="size-[18px] rounded-full border-2 border-slate-200 shrink-0" />{" "}
							Add ID Verification
						</li>
					</ul>
					<Link
						to="/$locale/dashboard/settings"
						className="text-blue-600 text-[13px] font-medium flex items-center gap-1 hover:underline"
					>
						Complete Now <ArrowRight className="size-3.5" />
					</Link>
				</div>

				{/* Subscription & Usage */}
				<div className="bg-white rounded-[12px] border border-slate-200 p-6 shadow-sm">
					<h3 className="font-bold mb-4 text-[15px] text-slate-900">
						Subscription & Usage
					</h3>
					<div className="flex items-center justify-between mb-1.5">
						<div className="flex items-center gap-2 font-bold text-[13px] text-slate-900">
							<div className="size-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
								<CheckCircle2 className="size-3" />
							</div>
							Verified Seller Plan
						</div>
						<span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
							Active
						</span>
					</div>
					<p className="text-[12px] text-slate-500 mb-6">
						Valid until: Jun 19, 2025
					</p>

					<div className="space-y-4 mb-6">
						<div>
							<div className="flex justify-between text-[12px] font-semibold text-slate-900 mb-2">
								<span>Featured Credits</span>
								<span className="text-slate-500 font-medium">2 / 5 used</span>
							</div>
							<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
								<div className="h-full bg-blue-600 w-2/5 rounded-full" />
							</div>
						</div>
						<div>
							<div className="flex justify-between text-[12px] font-semibold text-slate-900 mb-2">
								<span>Boosted Credits</span>
								<span className="text-slate-500 font-medium">1 / 3 used</span>
							</div>
							<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
								<div className="h-full bg-blue-600 w-1/3 rounded-full" />
							</div>
						</div>
					</div>

					<Link
						to="/$locale/dashboard/subscription"
						className="text-blue-600 text-[13px] font-medium flex items-center gap-1 hover:underline"
					>
						Manage Subscription <ArrowRight className="size-3.5" />
					</Link>
				</div>

				{/* Next Steps */}
				<div className="bg-white rounded-[12px] border border-slate-200 p-6 shadow-sm">
					<h3 className="font-bold mb-5 text-[15px] text-slate-900">
						Next Steps
					</h3>
					<div className="space-y-5">
						<Link
							to="/$locale/dashboard/settings"
							className="flex items-start gap-3.5 group"
						>
							<div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
								<ShieldAlert className="size-5" />
							</div>
							<div className="flex-1 pt-0.5">
								<div className="flex items-center justify-between">
									<h4 className="font-bold text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">
										Get Verified
									</h4>
									<ArrowRight className="size-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
								</div>
								<p className="text-[12px] text-slate-500 mt-0.5">
									Verify your ID to build more trust.
								</p>
							</div>
						</Link>

						<Link
							to="/$locale/dashboard/listings"
							className="flex items-start gap-3.5 group"
						>
							<div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
								<Zap className="size-5" />
							</div>
							<div className="flex-1 pt-0.5">
								<div className="flex items-center justify-between">
									<h4 className="font-bold text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">
										Promote a Listing
									</h4>
									<ArrowRight className="size-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
								</div>
								<p className="text-[12px] text-slate-500 mt-0.5">
									Increase visibility and get more views.
								</p>
							</div>
						</Link>

						<Link
							to="/$locale/dashboard/settings"
							className="flex items-start gap-3.5 group"
						>
							<div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
								<UserPlus className="size-5" />
							</div>
							<div className="flex-1 pt-0.5">
								<div className="flex items-center justify-between">
									<h4 className="font-bold text-[13px] text-slate-900 group-hover:text-blue-600 transition-colors">
										Complete Profile
									</h4>
									<ArrowRight className="size-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
								</div>
								<p className="text-[12px] text-slate-500 mt-0.5">
									Add more details to stand out.
								</p>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
