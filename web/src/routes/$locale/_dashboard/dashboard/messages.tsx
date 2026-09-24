import { createFileRoute } from "@tanstack/react-router";
import { Filter, MessageSquare, MoreVertical, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/messages")({
	component: MessagesPage,
});

// Mock data based on SCR-047
const mockConversations = [
	{
		id: 1,
		user: {
			name: "Mohamed Hassan",
			avatar: "/images/users/user1.png",
			isOnline: true,
		},
		lastMessage: "Is this car still available?",
		listing: {
			title: "Toyota Corolla Altis 1.8 X 2021",
			price: "SDG 24,750,000",
			image: "/images/cars/corolla.png",
		},
		time: "10:45 AM",
		unread: 2,
	},
	{
		id: 2,
		user: {
			name: "Aisha Mohammed",
			avatar: "/images/users/user2.png",
			isOnline: true,
		},
		lastMessage: "Can you share more photos?",
		listing: {
			title: "Bajaj RE Compact 2019",
			price: "SDG 4,800,000",
			image: "/images/cars/bajaj.png",
		},
		time: "Yesterday",
		unread: 1,
	},
	{
		id: 3,
		user: {
			name: "Al-Waha Trucks",
			avatar: "/images/users/user3.png",
			isOnline: true,
		},
		lastMessage: "Thanks! I'll contact you soon.",
		listing: {
			title: "Isuzu NPR 85 2019",
			price: "SDG 115,000,000",
			image: "/images/cars/isuzu.png",
		},
		time: "Yesterday",
		unread: 0,
	},
	{
		id: 4,
		user: {
			name: "Omar Saleh",
			avatar: "/images/users/user4.png",
			isOnline: false,
		},
		lastMessage: "Do you offer delivery to Omdurman?",
		listing: {
			title: "Honda CB 150F 2021",
			price: "SDG 2,700,000",
			image: "/images/cars/honda-cb.png",
		},
		time: "May 17",
		unread: 3,
	},
	{
		id: 5,
		user: {
			name: "Sara Store (Spare Parts)",
			avatar: null,
			isOnline: false,
			initials: "SS",
		},
		lastMessage: "Part is in stock and ready.",
		listing: {
			title: "Brake Disc - Toyota Hilux",
			price: "SDG 65,000",
			image: "/images/parts/brake.png",
		},
		time: "May 16",
		unread: 0,
	},
];

function MessagesPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 shrink-0">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-1">
						Conversations
					</h1>
					<p className="text-slate-600 text-sm">
						Messages from buyers, sellers and service providers.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
						<Input
							placeholder="Search conversations..."
							className="pl-9 bg-white"
						/>
					</div>
					<Button
						variant="outline"
						className="gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
					>
						<Filter className="size-4" /> Unread{" "}
						<span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
							8
						</span>
					</Button>
					<Button variant="outline" size="icon" className="bg-white shrink-0">
						<MoreVertical className="size-4" />
					</Button>
				</div>
			</div>

			{/* Main Chat Layout */}
			<div className="flex-1 min-h-0 bg-white border border-border rounded-xl shadow-sm flex overflow-hidden">
				{/* Left List */}
				<div className="w-full md:w-[500px] border-r border-border flex flex-col shrink-0">
					<div className="flex-1 overflow-y-auto p-4 space-y-1">
						{mockConversations.map((conv) => (
							<div
								key={conv.id}
								className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-border transition-colors"
							>
								<div className="relative shrink-0">
									<Avatar className="size-12 border border-border shadow-sm">
										<AvatarImage src={conv.user.avatar || undefined} />
										<AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
											{conv.user.initials || "U"}
										</AvatarFallback>
									</Avatar>
									{conv.user.isOnline && (
										<div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-2 border-white rounded-full" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<h4 className="font-bold text-sm truncate">
											{conv.user.name}
										</h4>
										<span className="text-xs text-slate-500 shrink-0 ml-2">
											{conv.time}
										</span>
									</div>
									<p className="text-sm text-slate-600 truncate">
										{conv.lastMessage}
									</p>
								</div>

								{/* Listing Preview Snippet */}
								<div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border shrink-0 w-[180px]">
									<div className="size-10 rounded-md overflow-hidden bg-slate-100 shrink-0">
										{conv.listing.image && (
											<img
												src={conv.listing.image}
												alt=""
												className="object-cover w-full h-full"
											/>
										)}
									</div>
									<div className="min-w-0">
										<div className="text-xs font-semibold truncate">
											{conv.listing.title}
										</div>
										<div className="text-[10px] text-blue-600 font-bold truncate">
											{conv.listing.price}
										</div>
									</div>
								</div>

								{conv.unread > 0 ? (
									<div className="size-6 shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center ml-2">
										{conv.unread}
									</div>
								) : (
									<div className="w-6 shrink-0 ml-2" />
								)}
							</div>
						))}
					</div>
					<div className="p-4 border-t border-border flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
						<span>Showing 1 to 5 of 28 conversations</span>
						<button
							type="button"
							className="text-blue-600 font-bold hover:underline"
						>
							Load more ↓
						</button>
					</div>
				</div>

				{/* Right Empty State */}
				<div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50">
					<div className="relative mb-6">
						<div className="absolute inset-0 bg-blue-100 blur-2xl rounded-full opacity-50" />
						<div className="size-32 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center relative shadow-sm">
							<MessageSquare className="size-12 text-blue-500" />
						</div>
					</div>
					<h3 className="text-2xl font-bold mb-2">Select a conversation</h3>
					<p className="text-slate-500 max-w-sm">
						Choose a conversation from the list to view your messages.
					</p>
				</div>
			</div>
		</div>
	);
}
