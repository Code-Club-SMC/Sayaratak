import {
	Check,
	Copy,
	MessageCircle,
	QrCode,
	Send,
	Share2,
	ShieldCheck,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

type ShareSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listing: {
		id: string;
		title: string;
		price: number;
		currency?: string;
		city?: string | null;
		district?: string | null;
		image?: string;
	};
};

export function ShareSheet({ open, onOpenChange, listing }: ShareSheetProps) {
	const { locale } = useTranslation();
	const [copied, setCopied] = useState(false);
	const [showQr, setShowQr] = useState(false);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/${locale}/listings/${listing.id}`
			: `https://sayaratak.com/${locale}/listings/${listing.id}`;

	const shareText = `${listing.title} - ${listing.currency || "SDG"} ${listing.price.toLocaleString()} on Sayaratak Sudan`;

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch (e) {
			console.error("Failed to copy:", e);
		}
	}

	async function handleNativeShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: listing.title,
					text: shareText,
					url: shareUrl,
				});
			} catch (_e) {
				// User cancelled share
			}
		} else {
			handleCopy();
		}
	}

	function handleWhatsApp() {
		const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
		window.open(url, "_blank");
	}

	function handleFacebook() {
		const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
		window.open(url, "_blank");
	}

	function handleTelegram() {
		const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
		window.open(url, "_blank");
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-6 rounded-2xl">
				<DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
					<div>
						<DialogTitle className="font-heading text-lg font-bold text-foreground">
							{locale === "ar" ? "مشاركة هذا الإعلان" : "Share this listing"}
						</DialogTitle>
						<p className="text-xs text-muted-foreground mt-0.5">
							{locale === "ar"
								? `شارك ${listing.title} مع الآخرين.`
								: `Share this ${listing.title} with others.`}
						</p>
					</div>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="size-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground"
					>
						<X className="size-4" />
					</button>
				</DialogHeader>

				{/* Vehicle Preview Card (Matching OVR-007) */}
				<div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 my-4">
					{listing.image ? (
						<img
							src={listing.image}
							alt={listing.title}
							className="size-14 rounded-lg object-cover shrink-0"
						/>
					) : (
						<div className="size-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
							<Share2 className="size-5 text-muted-foreground" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<h4 className="font-semibold text-xs text-foreground truncate">
							{listing.title}
						</h4>
						<p className="text-xs font-bold text-primary tabular-nums mt-0.5">
							{listing.currency || "SDG"} {listing.price.toLocaleString()}
							{listing.city && (
								<span className="text-[11px] font-normal text-muted-foreground ms-1.5">
									• {listing.city}
									{listing.district ? `, ${listing.district}` : ""}
								</span>
							)}
						</p>
						<p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
							{shareUrl}
						</p>
					</div>
				</div>

				{/* Share Options Grid (Matching OVR-007 7-grid) */}
				<div className="space-y-3">
					<span className="text-xs font-semibold text-muted-foreground">
						{locale === "ar" ? "مشاركة عبر" : "Share via"}
					</span>

					<div className="grid grid-cols-4 gap-3 text-center">
						{/* Native Share */}
						<button
							type="button"
							onClick={handleNativeShare}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
								<Share2 className="size-5" />
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								{locale === "ar" ? "مشاركة سريعة" : "Native Share"}
							</span>
						</button>

						{/* WhatsApp */}
						<button
							type="button"
							onClick={handleWhatsApp}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
								<MessageCircle className="size-5" />
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								WhatsApp
							</span>
						</button>

						{/* Facebook */}
						<button
							type="button"
							onClick={handleFacebook}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
								<span className="font-bold text-lg">f</span>
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								Facebook
							</span>
						</button>

						{/* Telegram */}
						<button
							type="button"
							onClick={handleTelegram}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center group-hover:scale-105 transition-transform">
								<Send className="size-5" />
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								Telegram
							</span>
						</button>

						{/* Copy Link */}
						<button
							type="button"
							onClick={handleCopy}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
								{copied ? (
									<Check className="size-5 text-emerald-600" />
								) : (
									<Copy className="size-5" />
								)}
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								{copied
									? locale === "ar"
										? "تم النسخ!"
										: "Copied!"
									: locale === "ar"
										? "نسخ الرابط"
										: "Copy Link"}
							</span>
						</button>

						{/* QR Code */}
						<button
							type="button"
							onClick={() => setShowQr(!showQr)}
							className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
						>
							<div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
								<QrCode className="size-5" />
							</div>
							<span className="text-[11px] font-medium text-foreground truncate max-w-full">
								QR Code
							</span>
						</button>
					</div>
				</div>

				{/* Inline QR Code View if toggled */}
				{showQr && (
					<div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 mt-2">
						<img
							src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
							alt="QR Code for listing"
							className="size-32 rounded-lg bg-white p-2 border border-border"
						/>
						<span className="text-[11px] text-muted-foreground">
							{locale === "ar"
								? "امسح الرمز لفتح الإعلان"
								: "Scan to view on your phone"}
						</span>
					</div>
				)}

				{/* Safety Notice Box (Matching OVR-007) */}
				<div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 mt-3 text-xs">
					<ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
					<div className="space-y-0.5">
						<span className="font-bold text-foreground">
							{locale === "ar" ? "تنبيه أمان:" : "Be safe:"}
						</span>
						<p className="text-muted-foreground text-[11px]">
							{locale === "ar"
								? "شارك فقط مع أشخاص تثق بهم. سيارتك لا تطلب أبداً تحويل أموال خارج المنصة."
								: "Only share with people you trust. Sayaratak never asks for payments outside the platform."}
						</p>
					</div>
				</div>

				<div className="pt-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="w-full h-10 text-xs font-semibold"
					>
						{locale === "ar" ? "إلغاء" : "Cancel"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
