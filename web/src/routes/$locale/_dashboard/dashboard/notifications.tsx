import { createFileRoute } from "@tanstack/react-router";
import {
	Bell,
	Car,
	Check,
	CheckSquare,
	Crown,
	Filter,
	MailOpen,
	MessageSquare,
	MoreVertical,
	Search,
	Search as SearchIcon,
	Shield,
	Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute(
	"/$locale/_dashboard/dashboard/notifications",
)({
	component: NotificationsPage,
});

const mockNotifications = [
	{
		id: 1,
		unread: true,
		type: "listing",
		icon: Car,
		iconColor: "text-blue-600 bg-blue-50",
		title: "Your listing has 12 new views",
		desc: "Toyota Corolla Altis 1.8 X 2021",
		time: "2 minutes ago",
		image: "/images/cars/corolla.png",
		action: "View Listing",
	},
	{
		id: 2,
		unread: true,
		type: "message",
		icon: MessageSquare,
		iconColor: "text-purple-600 bg-purple-50",
		title: "You have a new message from Mohamed Hassan",
		desc: "Re: Toyota Corolla Altis 1.8 X 2021",
		time: "1 hour ago",
		image: "/images/users/user1.png",
		action: "Open Chat",
		isAvatar: true,
	},
	{
		id: 3,
		unread: true,
		type: "search",
		icon: SearchIcon,
		iconColor: "text-green-600 bg-green-50",
		title: 'New matches for "Toyota Corolla in Khartoum"',
		desc: "We found 6 new listings that match your search",
		time: "3 hours ago",
		action: "View Matches",
	},
	{
		id: 4,
		unread: true,
		type: "review",
		icon: Star,
		iconColor: "text-amber-600 bg-amber-50",
		title: "Aisha Mohammed left you a review",
		desc: "For your listing: Bajaj RE Compact 2019",
		time: "Yesterday",
		image: "/images/cars/bajaj.png",
		action: "View Review",
	},
	{
		id: 5,
		unread: true,
		type: "subscription",
		icon: Crown,
		iconColor: "text-teal-600 bg-teal-50",
		title: "Your Premium Plan will renew in 3 days",
		desc: "Renew now to keep your benefits active",
		time: "Yesterday",
		action: "Manage Plan",
	},
	{
		id: 6,
		unread: false,
		type: "system",
		icon: Shield,
		iconColor: "text-slate-600 bg-slate-100",
		title: "Security alert",
		desc: "New login detected from Chrome on Windows",
		time: "May 17, 2025",
		action: "Review Activity",
	},
];

const categories = [
	{ label: "All Notifications", count: 12, icon: Bell, active: true },
	{ label: "Listings", count: 4, icon: Car },
	{ label: "Messages", count: 3, icon: MessageSquare },
	{ label: "Saved Searches", count: 2, icon: SearchIcon },
	{ label: "Reviews", count: 1, icon: Star },
	{ label: "Subscriptions", count: 1, icon: Crown },
	{ label: "System", count: 1, icon: Shield },
];

function NotificationsPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6 flex flex-col xl:flex-row gap-8">
			{/* Main Content (Left) */}
			<div className="flex-1 min-w-0">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
					<div>
						<h1 className="text-3xl font-bold tracking-tight mb-1">
							Notifications
						</h1>
						<p className="text-slate-600 text-sm">
							Stay updated with everything that matters.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<div className="relative w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
							<Input
								placeholder="Search notifications..."
								className="pl-9 bg-white"
							/>
						</div>
						<Button
							variant="outline"
							className="gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
						>
							<Filter className="size-4" /> Unread only{" "}
							<span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
								12
							</span>
						</Button>
						<Button variant="outline" size="icon" className="bg-white shrink-0">
							<MoreVertical className="size-4" />
						</Button>
					</div>
				</div>

				<div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
					{/* Toolbar */}
					<div className="p-3 border-b border-border flex items-center justify-between bg-slate-50/50">
						<div className="flex items-center gap-6">
							<label className="flex items-center gap-2 text-sm font-semibold cursor-pointer ml-3">
								<input
									type="checkbox"
									className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
								/>
								Select all
							</label>
							<button
								type="button"
								className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
							>
								<MailOpen className="size-4" /> Mark one as read
							</button>
							<button
								type="button"
								className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
							>
								<CheckSquare className="size-4" /> Mark all as read
							</button>
						</div>
						<NativeSelect className="w-44 h-8 bg-transparent border-transparent font-semibold shadow-none">
							<option>Sort: Newest first</option>
						</NativeSelect>
					</div>

					{/* List */}
					<div className="divide-y divide-border">
						{mockNotifications.map((notif) => {
							const Icon = notif.icon;
							return (
								<div
									key={notif.id}
									className="p-4 flex items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors"
								>
									<input
										type="checkbox"
										className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 sm:mt-0"
									/>

									<div className="w-2 shrink-0 flex justify-center">
										{notif.unread && (
											<div className="size-2.5 bg-blue-600 rounded-full" />
										)}
									</div>

									<div
										className={`size-10 rounded-full flex items-center justify-center shrink-0 ${notif.iconColor}`}
									>
										<Icon className="size-5" />
									</div>

									<div className="flex-1 min-w-0">
										<div
											className={`font-bold text-sm ${notif.unread ? "text-slate-900" : "text-slate-700"}`}
										>
											{notif.title}
										</div>
										<div className="text-sm text-slate-500 mt-0.5 truncate">
											{notif.desc}
										</div>
									</div>

									<div className="text-xs text-slate-500 shrink-0 w-24 text-right hidden sm:block">
										{notif.time}
									</div>

									{notif.image ? (
										<div
											className={`shrink-0 hidden md:block ${notif.isAvatar ? "size-10 rounded-full" : "h-10 w-14 rounded"} overflow-hidden bg-slate-100`}
										>
											<img
												src={notif.image}
												alt=""
												className="object-cover w-full h-full"
											/>
										</div>
									) : (
										<div className="w-14 hidden md:block shrink-0" />
									)}

									<div className="shrink-0 flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											className="text-blue-600 border-blue-200 hover:bg-blue-50 w-[110px]"
										>
											{notif.action}
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 text-slate-400"
										>
											<MoreVertical className="size-4" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>

					{/* Footer */}
					<div className="p-4 flex justify-center items-center gap-2 text-sm text-slate-500 font-semibold bg-slate-50/50">
						<Check className="size-4" /> No more notifications
					</div>
				</div>
			</div>

			{/* Right Sidebar */}
			<div className="w-full xl:w-72 shrink-0 space-y-6 mt-6 xl:mt-[4.5rem]">
				{/* Categories */}
				<div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
					<div className="p-4 border-b border-border">
						<h3 className="font-bold">Notification Categories</h3>
					</div>
					<nav className="p-2 space-y-1">
						{categories.map((cat) => {
							const Icon = cat.icon;
							return (
								<button
									type="button"
									key={cat.label}
									className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
										cat.active
											? "bg-blue-50 text-blue-700"
											: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
									}`}
								>
									<div className="flex items-center gap-3">
										<Icon className="size-4" />
										{cat.label}
									</div>
									{cat.active ? (
										<span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
											{cat.count}
										</span>
									) : (
										<span className="text-slate-400 font-semibold">
											{cat.count}
										</span>
									)}
								</button>
							);
						})}
					</nav>
				</div>

				{/* All caught up block */}
				<div className="bg-slate-50/50 border border-border rounded-xl p-8 text-center shadow-sm">
					<div className="relative mx-auto w-16 h-16 mb-4">
						<div className="absolute inset-0 bg-blue-100 blur-xl rounded-full" />
						<Bell className="size-16 text-blue-500 relative z-10" />
					</div>
					<h4 className="font-bold mb-1">All caught up!</h4>
					<p className="text-sm text-slate-500 mb-4">
						You've read all notifications.
					</p>
					<Button
						variant="link"
						className="text-blue-600 font-semibold p-0 h-auto"
					>
						View all notifications
					</Button>
				</div>
			</div>
		</div>
	);
}
