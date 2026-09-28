import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsQueryOptions, conversationMessagesQueryOptions } from "@/lib/query-options/chat";
import { listingDetailQueryOptions } from "@/lib/query-options/listings";
import { useState, useEffect } from "react";
import { apiPost } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/messages")({
	component: MessagesPage,
});

function MessagesPage() {
	const { t, locale } = useTranslation();
	const routerState = useRouterState();
	const queryClient = useQueryClient();
	const { data: session } = useSession();

	const newListingId = (routerState.location.state as any)?.newConversation?.listingId;

	const { data: conversations = [], isLoading } = useQuery(conversationsQueryOptions());

	const [activeConvId, setActiveConvId] = useState<string | null>(null);
	const [activeVirtualListingId, setActiveVirtualListingId] = useState<string | null>(null);
	const [messageText, setMessageText] = useState("");

	useEffect(() => {
		if (newListingId && conversations.length > 0 && !activeConvId) {
			const existing = conversations.find(c => c.listingId === newListingId);
			if (existing) {
				setActiveConvId(existing.id);
			} else {
				setActiveVirtualListingId(newListingId);
				setActiveConvId(null);
			}
		} else if (!activeConvId && conversations.length > 0 && !newListingId) {
			setActiveConvId(conversations[0].id);
		} else if (newListingId && conversations.length === 0 && !isLoading) {
			setActiveVirtualListingId(newListingId);
		}
	}, [newListingId, conversations, activeConvId, isLoading]);

	const { data: virtualListing } = useQuery({
		...listingDetailQueryOptions(locale, activeVirtualListingId || ""),
		enabled: !!activeVirtualListingId,
	});

	const { data: messages = [] } = useQuery({
		...conversationMessagesQueryOptions(activeConvId || ""),
		enabled: !!activeConvId,
		refetchInterval: 5000,
	});

	const sendMessageMutation = useMutation({
		mutationFn: async (content: string) => {
			if (activeConvId) {
				return apiPost(`/api/chat/${activeConvId}/messages`, { content });
			} else if (activeVirtualListingId) {
				const res = await apiPost("/api/chat", { listingId: activeVirtualListingId });
				const convId = (res as any).id;
				setActiveConvId(convId);
				setActiveVirtualListingId(null);
				return apiPost(`/api/chat/${convId}/messages`, { content });
			}
		},
		onSuccess: () => {
			setMessageText("");
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});

	const activeConversation = conversations.find(c => c.id === activeConvId);

	return (
		<div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 shrink-0">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-1">
						Conversations
					</h1>
					<p className="text-slate-600 text-sm">
						Messages from buyers, sellers and service providers.
					</p>
				</div>
			</div>

			<div className="flex-1 min-h-0 bg-white border border-border rounded-xl shadow-sm flex overflow-hidden">
				<div className="w-full md:w-[350px] lg:w-[450px] border-r border-border flex flex-col shrink-0">
					<div className="flex-1 overflow-y-auto p-4 space-y-1">
						{activeVirtualListingId && !activeConvId && (
							<div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer">
								<div className="flex-1 min-w-0">
									<h4 className="font-bold text-sm truncate text-blue-700">New Conversation</h4>
									<p className="text-xs text-blue-600">{virtualListing?.listing.title || "Loading..."}</p>
								</div>
							</div>
						)}
						{conversations.map((conv) => (
							<div
								key={conv.id}
								onClick={() => { setActiveConvId(conv.id); setActiveVirtualListingId(null); }}
								className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-colors ${activeConvId === conv.id ? 'bg-slate-100 border-border' : 'hover:bg-slate-50 border-transparent hover:border-border'}`}
							>
								<div className="relative shrink-0">
									<Avatar className="size-12 border border-border shadow-sm">
										<AvatarImage src={conv.user?.avatar || undefined} />
										<AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
											{conv.user?.name?.[0]?.toUpperCase() || "U"}
										</AvatarFallback>
									</Avatar>
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<h4 className="font-bold text-sm truncate">
											{conv.user?.name || "User"}
										</h4>
									</div>
									<div className="text-xs font-semibold truncate text-slate-600">
										{conv.listing?.title}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{activeConvId || activeVirtualListingId ? (
					<div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
						<div className="p-4 bg-white border-b border-border flex items-center justify-between shrink-0">
							<div className="flex items-center gap-3">
								<div>
									<h3 className="font-bold">{activeConversation ? activeConversation.user?.name : "New Conversation"}</h3>
									<p className="text-xs text-slate-500">
										{activeConversation ? activeConversation.listing?.title : virtualListing?.listing.title} - 
										{activeConversation ? activeConversation.listing?.price : `${virtualListing?.listing.currency || "SDG"} ${virtualListing?.listing.price}`}
									</p>
								</div>
							</div>
						</div>
						
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messages.map((msg) => {
								const isMe = msg.senderId === session?.user?.id;
								return (
									<div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
										<div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-tl-sm'}`}>
											{msg.content}
										</div>
									</div>
								);
							})}
						</div>

						<div className="p-4 bg-white border-t border-border shrink-0">
							<form 
								onSubmit={(e) => {
									e.preventDefault();
									if (messageText.trim()) sendMessageMutation.mutate(messageText);
								}}
								className="flex items-center gap-2"
							>
								<Input
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									placeholder="Type a message..."
									className="flex-1 bg-slate-50"
									disabled={sendMessageMutation.isPending}
								/>
								<Button type="submit" size="icon" disabled={!messageText.trim() || sendMessageMutation.isPending} className="shrink-0 bg-blue-600 hover:bg-blue-700">
									<Send className="size-4" />
								</Button>
							</form>
						</div>
					</div>
				) : (
					<div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50">
						<MessageSquare className="size-12 text-slate-300 mb-4" />
						<h3 className="text-xl font-bold mb-2">Select a conversation</h3>
						<p className="text-slate-500 max-w-sm">
							Choose a conversation from the list to view your messages.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
