import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

type ReportDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listingId: string;
};

export function ReportDialog({
	open,
	onOpenChange,
	listingId,
}: ReportDialogProps) {
	const { locale } = useTranslation();
	const [reason, setReason] = useState("spam");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reasons = [
		{
			id: "spam",
			labelEn: "This is spam or an advertisement",
			labelAr: "هذا إعلان مزعج أو متكرر (سبام)",
		},
		{
			id: "incorrect",
			labelEn: "Incorrect or misleading information",
			labelAr: "معلومات غير صحيحة أو مضللة",
		},
		{
			id: "unavailable",
			labelEn: "The item is sold or unavailable",
			labelAr: "المركبة مباعة بالفعل أو غير متوفرة",
		},
		{
			id: "inappropriate",
			labelEn: "Inappropriate content or images",
			labelAr: "محتوى أو صور غير لائقة ومخالفة",
		},
		{
			id: "fraud",
			labelEn: "Suspicious or fraudulent listing",
			labelAr: "إعلان مشبوه أو محاولة احتيال",
		},
		{
			id: "other",
			labelEn: "Other reason",
			labelAr: "سبب آخر",
		},
	];

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await apiPost("/api/v1/reports", {
				listingId,
				reason,
				description: description.trim() || undefined,
			});
			setSubmitted(true);
		} catch (err) {
			console.warn("Report submission failed:", err);
			setError(
				locale === "ar"
					? "تعذر إرسال البلاغ. يرجى تسجيل الدخول والمحاولة مرة أخرى."
					: "Unable to submit report. Please sign in and try again.",
			);
		} finally {
			setLoading(false);
		}
	}

	function handleClose() {
		onOpenChange(false);
		setTimeout(() => {
			setSubmitted(false);
			setDescription("");
			setReason("spam");
			setError(null);
		}, 300);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg p-6 rounded-2xl">
				{submitted ? (
					/* Success Confirmation State */
					<div className="py-8 text-center space-y-4">
						<div className="mx-auto size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
							<CheckCircle2 className="size-8" />
						</div>
						<h3 className="font-heading text-lg font-bold text-foreground">
							{locale === "ar" ? "شكراً لمساعدتك" : "Thank you for your report"}
						</h3>
						<p className="text-xs text-muted-foreground max-w-sm mx-auto">
							{locale === "ar"
								? "لقد استلمنا بلاغك وسيقوم فريق المراقبة بمراجعته واتخاذ الإجراء المناسب في أقرب وقت."
								: "We have received your report. Our moderation team will review this listing promptly to keep Sayaratak safe."}
						</p>
						<Button
							onClick={handleClose}
							className="mt-4 text-xs font-semibold px-6"
						>
							{locale === "ar" ? "إغلاق" : "Close"}
						</Button>
					</div>
				) : (
					/* Report Form (Matching OVR-008) */
					<form onSubmit={handleSubmit} className="space-y-4">
						<DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
							<div>
								<DialogTitle className="font-heading text-lg font-bold text-foreground">
									{locale === "ar"
										? "الإبلاغ عن هذا الإعلان"
										: "Report this listing"}
								</DialogTitle>
								<p className="text-xs text-muted-foreground mt-0.5">
									{locale === "ar"
										? "ساعدنا في الحفاظ على أمان وموثوقية منصة سيارتك."
										: "Help us keep Sayaratak safe and trustworthy."}
								</p>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="size-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground"
							>
								<X className="size-4" />
							</button>
						</DialogHeader>

						{/* Reason Radio Group */}
						<div className="space-y-2 py-1">
							<span className="text-xs font-semibold text-foreground">
								{locale === "ar"
									? "ما سبب الإبلاغ؟"
									: "Why are you reporting this?"}
							</span>

							<RadioGroup
								value={reason}
								onValueChange={(val) => setReason(val as string)}
								className="gap-1.5 border border-border rounded-xl p-3 bg-card"
							>
								{reasons.map((r) => {
									const isSelected = reason === r.id;
									return (
										<label
											key={r.id}
											className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
												isSelected
													? "bg-primary/10 font-semibold text-primary"
													: "text-foreground hover:bg-muted"
											}`}
										>
											<RadioGroupItem value={r.id} />
											<span>{locale === "ar" ? r.labelAr : r.labelEn}</span>
										</label>
									);
								})}
							</RadioGroup>
						</div>

						{/* Additional Details */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<label className="font-semibold text-foreground">
									{locale === "ar"
										? "تفاصيل إضافية (اختياري)"
										: "Additional details (optional)"}
								</label>
								<span className="text-[11px] text-muted-foreground tabular-nums">
									{description.length}/500
								</span>
							</div>
							<Textarea
								value={description}
								onChange={(e) => setDescription(e.target.value.slice(0, 500))}
								placeholder={
									locale === "ar"
										? "يرجى تقديم أي تفاصيل إضافية تساعدنا في التحقق..."
										: "Please provide any additional information..."
								}
								rows={3}
								className="text-xs resize-none"
							/>
						</div>

						{/* Safety Callout Box (Matching OVR-008) */}
						<div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40 text-xs">
							<ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
							<div className="space-y-0.5">
								<span className="font-bold text-foreground">
									{locale === "ar" ? "أمانك يهمنا" : "Your safety matters"}
								</span>
								<p className="text-muted-foreground text-[11px]">
									{locale === "ar"
										? "بلاغك يتم التعامل معه بسرية تامة. سنقوم بمراجعته واتخاذ الإجراء اللازم. شكراً لمساهمتك في حماية الجميع."
										: "Your report is confidential. We'll review it and take action if needed. Thank you for helping keep Sayaratak safe for everyone."}
								</p>
							</div>
						</div>

						{error && (
							<p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
								{error}
							</p>
						)}

						{/* Buttons */}
						<div className="flex items-center gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleClose}
								className="flex-1 h-10 text-xs font-semibold"
							>
								{locale === "ar" ? "إلغاء" : "Cancel"}
							</Button>
							<Button
								type="submit"
								disabled={loading}
								className="flex-1 h-10 text-xs font-semibold bg-primary hover:bg-primary/90"
							>
								{loading
									? locale === "ar"
										? "جاري الإرسال..."
										: "Submitting..."
									: locale === "ar"
										? "إرسال البلاغ"
										: "Submit Report"}
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
