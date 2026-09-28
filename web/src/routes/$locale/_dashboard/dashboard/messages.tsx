import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Filter,
	MessageSquare,
	MoreVertical,
	Search,
	Send,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { chatKeys } from "@/lib/query-keys";
import {
	type ChatMessage,
	conversationMessagesQueryOptions,
	conversationsQueryOptions,
	type MessagesResponse,
	sendMessage,
	startConversation,
} from "@/lib/query-options/chat";
import { listingDetailQueryOptions } from "@/lib/query-options/listings";
import { useChatSocket } from "@/lib/use-chat-socket";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/messages")({
	validateSearch: z.object({ startListingId: z.string().optional() }),
	component: MessagesPage,
});

function formatTime(iso: string, locale: string): string {
	const date = new Date(iso);
	const now = new Date();
	const sameDay = date.toDateString() === now.toDateString();
	if (sameDay) {
		return date.toLocaleTimeString(locale === "ar" ? "ar-SD" : "en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	}
	return date.toLocaleDateString(locale === "ar" ? "ar-SD" : "en-US", {
		month: "short",
		day: "numeric",
	});
}

function MessagesPage() {
	const { locale } = useTranslation();
	const { user } = Route.useRouteContext();
	const { startListingId } = Route.useSearch();
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [composeText, setComposeText] = useState("");
	const [composeClientId, setComposeClientId] = useState<string | null>(null);
	const [composeError, setComposeError] = useState<string | null>(null);
	const [replyText, setReplyText] = useState("");
	const [replyClientId, setReplyClientId] = useState<string | null>(null);

	const { data, isLoading, isError } = useQuery(
		conversationsQueryOptions(locale, page),
	);

	const existingForListing = startListingId
		? data?.items.find((c) => c.listingId === startListingId)
		: undefined;

	// Prefer an already-selected/known conversation over the compose flow.
	const showCompose =
		Boolean(startListingId) && !activeConversationId && !existingForListing;

	const { data: composeListing } = useQuery({
		...listingDetailQueryOptions(locale, startListingId ?? ""),
		enabled: Boolean(showCompose && startListingId),
	});

	useEffect(() => {
		if (existingForListing && !activeConversationId) {
			setActiveConversationId(existingForListing.id);
		}
	}, [existingForListing, activeConversationId]);

	const activeConversation = data?.items.find(
		(c) => c.id === activeConversationId,
	);

	const messagesQuery = useQuery({
		...conversationMessagesQueryOptions(locale, activeConversationId ?? ""),
		enabled: Boolean(activeConversationId),
	});

	const { connected } = useChatSocket((message: ChatMessage) => {
		if (message.conversationId === activeConversationId) {
			queryClient.setQueryData(
				chatKeys.messages(locale, message.conversationId, 1),
				(old: MessagesResponse | undefined) =>
					old && !old.items.some((m) => m.id === message.id)
						? { ...old, items: [...old.items, message] }
						: old,
			);
		}
		queryClient.invalidateQueries({ queryKey: chatKeys.all(locale) });
	});

	// Visible-thread refresh fallback while the socket isn't connected.
	useEffect(() => {
		if (connected || !activeConversationId) return;
		const interval = setInterval(() => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.messages(locale, activeConversationId, 1),
			});
		}, 5000);
		return () => clearInterval(interval);
	}, [connected, activeConversationId, locale, queryClient]);

	const startMutation = useMutation({
		mutationFn: () => {
			if (!startListingId) throw new Error("Missing listing id");
			const clientMessageId = composeClientId ?? crypto.randomUUID();
			setComposeClientId(clientMessageId);
			return startConversation(locale, {
				listingId: startListingId,
				content: composeText.trim(),
				clientMessageId,
			});
		},
		onSuccess: (result) => {
			setComposeError(null);
			setActiveConversationId(result.conversation.id);
			queryClient.invalidateQueries({ queryKey: chatKeys.all(locale) });
		},
		onError: (err: any) => {
			setComposeError(
				err?.code === "LISTING_NOT_CONTACTABLE"
					? locale === "ar"
						? "هذا الإعلان مغلق ولا يمكن بدء محادثة جديدة عليه."
						: "This listing is closed and can no longer start a new conversation."
					: locale === "ar"
						? "تعذر إرسال الرسالة. حاول مرة أخرى."
						: "Couldn't send your message. Please try again.",
			);
		},
	});

	const replyMutation = useMutation({
		mutationFn: () => {
			if (!activeConversationId) throw new Error("No active conversation");
			const clientMessageId = replyClientId ?? crypto.randomUUID();
			setReplyClientId(clientMessageId);
			return sendMessage(locale, activeConversationId, {
				content: replyText.trim(),
				clientMessageId,
			});
		},
		onSuccess: () => {
			setReplyText("");
			setReplyClientId(null);
			if (activeConversationId) {
				queryClient.invalidateQueries({
					queryKey: chatKeys.messages(locale, activeConversationId, 1),
				});
			}
			queryClient.invalidateQueries({
				queryKey: chatKeys.conversations(locale, page),
			});
		},
	});

	function handleSendCompose(e: FormEvent) {
		e.preventDefault();
		if (!composeText.trim() || startMutation.isPending) return;
		startMutation.mutate();
	}

	function handleSendReply(e: FormEvent) {
		e.preventDefault();
		if (!replyText.trim() || replyMutation.isPending) return;
		replyMutation.mutate();
	}

	const totalUnread = useMemo(
		() => (data?.items ?? []).reduce((sum, c) => sum + c.unreadCount, 0),
		[data],
	);

	return (
		<div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 shrink-0">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-1">
						{locale === "ar" ? "المحادثات" : "Conversations"}
					</h1>
					<p className="text-slate-600 text-sm">
						{locale === "ar"
							? "رسائل من المشترين والبائعين ومزودي الخدمات."
							: "Messages from buyers, sellers and service providers."}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
						<Input
							placeholder={
								locale === "ar"
									? "بحث في المحادثات..."
									: "Search conversations..."
							}
							className="pl-9 bg-white"
						/>
					</div>
					<Button
						variant="outline"
						className="gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
					>
						<Filter className="size-4" />{" "}
						{locale === "ar" ? "غير مقروء" : "Unread"}{" "}
						{totalUnread > 0 && (
							<span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
								{totalUnread}
							</span>
						)}
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
						{isLoading && (
							<p className="text-sm text-slate-500 p-4">
								{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}
							</p>
						)}
						{isError && (
							<p className="text-sm text-destructive p-4">
								{locale === "ar"
									? "تعذر تحميل المحادثات."
									: "Couldn't load conversations."}
							</p>
						)}
						{!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
							<p className="text-sm text-slate-500 p-4">
								{locale === "ar"
									? "لا توجد محادثات بعد."
									: "No conversations yet."}
							</p>
						)}
						{data?.items.map((conv) => (
							<button
								type="button"
								key={conv.id}
								onClick={() => setActiveConversationId(conv.id)}
								className={`w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 cursor-pointer border transition-colors text-left ${
									activeConversationId === conv.id
										? "border-primary bg-primary/5"
										: "border-transparent hover:border-border"
								}`}
							>
								<div className="relative shrink-0">
									<Avatar className="size-12 border border-border shadow-sm">
										<AvatarImage src={conv.participant.image ?? undefined} />
										<AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
											{conv.participant.name?.charAt(0) ?? "U"}
										</AvatarFallback>
									</Avatar>
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<h4 className="font-bold text-sm truncate">
											{conv.participant.name ??
												(locale === "ar" ? "مستخدم" : "User")}
										</h4>
										<span className="text-xs text-slate-500 shrink-0 ml-2">
											{formatTime(conv.lastMessageAt, locale)}
										</span>
									</div>
								</div>

								{/* Listing Preview Snippet */}
								<div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border shrink-0 w-[180px]">
									{conv.listing ? (
										<>
											<div className="size-10 rounded-md overflow-hidden bg-slate-100 shrink-0">
												{conv.listing.primaryImage && (
													<img
														src={conv.listing.primaryImage}
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
													{conv.listing.currency}{" "}
													{conv.listing.price.toLocaleString()}
												</div>
											</div>
										</>
									) : (
										<div className="text-[10px] text-slate-400 italic">
											{locale === "ar"
												? "الإعلان غير متاح"
												: "Listing no longer available"}
										</div>
									)}
								</div>

								{conv.unreadCount > 0 ? (
									<div className="size-6 shrink-0 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center ml-2">
										{conv.unreadCount}
									</div>
								) : (
									<div className="w-6 shrink-0 ml-2" />
								)}
							</button>
						))}
					</div>
					<div className="p-4 border-t border-border flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
						<span>
							{locale === "ar"
								? `عرض ${data?.items.length ?? 0} من ${data?.total ?? 0}`
								: `Showing ${data?.items.length ?? 0} of ${data?.total ?? 0}`}
						</span>
						{data && page < data.totalPages && (
							<button
								type="button"
								onClick={() => setPage((p) => p + 1)}
								className="text-blue-600 font-bold hover:underline"
							>
								{locale === "ar" ? "تحميل المزيد ↓" : "Load more ↓"}
							</button>
						)}
					</div>
				</div>

				{/* Right Pane */}
				{showCompose ? (
					<div className="hidden md:flex flex-1 flex-col p-6 gap-4">
						<div className="rounded-xl border border-border p-4 bg-slate-50/50">
							<div className="text-xs font-semibold text-muted-foreground mb-1">
								{locale === "ar" ? "بخصوص" : "About"}
							</div>
							<div className="font-semibold text-sm">
								{composeListing?.title ??
									(locale === "ar" ? "جارٍ التحميل..." : "Loading...")}
							</div>
							{composeListing && (
								<div className="text-xs text-blue-600 font-bold mt-1">
									{composeListing.currency}{" "}
									{composeListing.price.toLocaleString()}
								</div>
							)}
						</div>
						<form
							onSubmit={handleSendCompose}
							className="flex-1 flex flex-col gap-3"
						>
							<Textarea
								className="flex-1 min-h-32"
								placeholder={
									locale === "ar"
										? "اكتب رسالتك الأولى للبائع..."
										: "Write your first message to the seller..."
								}
								value={composeText}
								onChange={(e) => setComposeText(e.target.value)}
							/>
							{composeError && (
								<p className="text-xs text-destructive">{composeError}</p>
							)}
							<Button
								type="submit"
								disabled={!composeText.trim() || startMutation.isPending}
								className="self-end gap-2"
							>
								<Send className="size-4" />
								{locale === "ar" ? "إرسال" : "Send"}
							</Button>
						</form>
					</div>
				) : activeConversationId ? (
					<div className="hidden md:flex flex-1 flex-col">
						<div className="flex-1 overflow-y-auto p-6 space-y-3">
							{activeConversation?.listing &&
								activeConversation.listing.status !== "available" && (
									<div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-3 py-2">
										{locale === "ar"
											? "هذا الإعلان مغلق، لكن يمكنك الرد."
											: "This listing is closed, but you can still reply."}
									</div>
								)}
							{messagesQuery.data?.items.map((msg) => {
								const isMine = msg.senderId === user.id;
								return (
									<div
										key={msg.id}
										className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
											isMine
												? "ml-auto bg-blue-600 text-white"
												: "mr-auto bg-slate-100 text-slate-900"
										}`}
									>
										{msg.content}
									</div>
								);
							})}
						</div>
						<form
							onSubmit={handleSendReply}
							className="border-t border-border p-4 flex items-center gap-3"
						>
							<Input
								className="flex-1"
								placeholder={
									locale === "ar" ? "اكتب رداً..." : "Write a reply..."
								}
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
							/>
							<Button
								type="submit"
								size="icon"
								disabled={!replyText.trim() || replyMutation.isPending}
							>
								<Send className="size-4" />
							</Button>
						</form>
					</div>
				) : (
					<div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50">
						<div className="relative mb-6">
							<div className="absolute inset-0 bg-blue-100 blur-2xl rounded-full opacity-50" />
							<div className="size-32 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center relative shadow-sm">
								<MessageSquare className="size-12 text-blue-500" />
							</div>
						</div>
						<h3 className="text-2xl font-bold mb-2">
							{locale === "ar" ? "اختر محادثة" : "Select a conversation"}
						</h3>
						<p className="text-slate-500 max-w-sm">
							{locale === "ar"
								? "اختر محادثة من القائمة لعرض رسائلك."
								: "Choose a conversation from the list to view your messages."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
