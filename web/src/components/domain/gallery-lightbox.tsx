import {
	ChevronLeft,
	ChevronRight,
	Download,
	Heart,
	Share2,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";

type GalleryLightboxProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	images: string[];
	initialIndex?: number;
	title: string;
	onShare?: () => void;
};

export function GalleryLightbox({
	open,
	onOpenChange,
	images,
	initialIndex = 0,
	title,
	onShare,
}: GalleryLightboxProps) {
	const { locale, dir } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [isZoomed, setIsZoomed] = useState(false);
	const [isFavorited, setIsFavorited] = useState(false);

	// Sync initial index when opened
	useEffect(() => {
		if (open) {
			setCurrentIndex(initialIndex);
			setIsZoomed(false);
		}
	}, [open, initialIndex]);

	const handlePrev = useCallback(() => {
		setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
		setIsZoomed(false);
	}, [images.length]);

	const handleNext = useCallback(() => {
		setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
		setIsZoomed(false);
	}, [images.length]);

	// Keyboard shortcut handling
	useEffect(() => {
		if (!open) return;

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "ArrowLeft") {
				dir === "rtl" ? handleNext() : handlePrev();
			} else if (e.key === "ArrowRight") {
				dir === "rtl" ? handlePrev() : handleNext();
			} else if (e.key === "Escape") {
				onOpenChange(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, dir, handleNext, handlePrev, onOpenChange]);

	if (images.length === 0) return null;

	const currentImage = images[currentIndex] || images[0];

	function handleDownload() {
		const a = document.createElement("a");
		a.href = currentImage;
		a.download = `${title.replace(/\s+/g, "_")}_${currentIndex + 1}.jpg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="fixed inset-0 z-50 p-0 m-0 w-screen h-screen max-w-none rounded-none border-none bg-black/95 flex flex-col justify-between text-white">
				{/* Top Controls Header */}
				<div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
					{/* Left: Counter & Title */}
					<div className="flex items-center gap-4">
						<span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tabular-nums">
							{currentIndex + 1} / {images.length}
						</span>
						<h3 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
							{title}
						</h3>
					</div>

					{/* Right: Actions */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsFavorited(!isFavorited)}
							className="h-9 px-3 text-xs gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
						>
							<Heart
								className={`size-4 ${
									isFavorited ? "fill-rose-500 text-rose-500" : ""
								}`}
							/>
							<span className="hidden sm:inline">
								{locale === "ar" ? "حفظ" : "Save"}
							</span>
						</Button>

						{onShare && (
							<Button
								variant="ghost"
								size="sm"
								onClick={onShare}
								className="h-9 px-3 text-xs gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
							>
								<Share2 className="size-4" />
								<span className="hidden sm:inline">
									{locale === "ar" ? "مشاركة" : "Share"}
								</span>
							</Button>
						)}

						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownload}
							className="h-9 px-3 text-xs gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
						>
							<Download className="size-4" />
							<span className="hidden sm:inline">
								{locale === "ar" ? "تحميل" : "Download"}
							</span>
						</Button>

						<div className="w-px h-6 bg-white/20 mx-1" />

						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="size-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
							aria-label="Close lightbox"
						>
							<X className="size-5" />
						</button>
					</div>
				</div>

				{/* Center: Main Image Viewport with Nav Arrows */}
				<div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none">
					{/* Previous Arrow */}
					<button
						type="button"
						onClick={handlePrev}
						className="absolute start-6 z-10 size-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10"
						aria-label="Previous image"
					>
						{dir === "rtl" ? (
							<ChevronRight className="size-6" />
						) : (
							<ChevronLeft className="size-6" />
						)}
					</button>

					{/* Image */}
					<button
						type="button"
						aria-label={isZoomed ? "Fit image to screen" : "Zoom image"}
						className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
							isZoomed
								? "scale-150 cursor-zoom-out"
								: "scale-100 cursor-zoom-in"
						}`}
						onClick={() => setIsZoomed(!isZoomed)}
					>
						<img
							src={currentImage}
							alt={`${title} ${currentIndex + 1}`}
							className="max-h-[70vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
						/>
					</button>

					{/* Next Arrow */}
					<button
						type="button"
						onClick={handleNext}
						className="absolute end-6 z-10 size-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95 border border-white/10"
						aria-label="Next image"
					>
						{dir === "rtl" ? (
							<ChevronLeft className="size-6" />
						) : (
							<ChevronRight className="size-6" />
						)}
					</button>

					{/* Zoom button indicator */}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setIsZoomed(!isZoomed);
						}}
						className="absolute bottom-6 start-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/10 text-xs font-semibold flex items-center gap-2 text-white/90 transition-colors"
					>
						{isZoomed ? (
							<>
								<ZoomOut className="size-3.5" />
								<span>Fit</span>
							</>
						) : (
							<>
								<ZoomIn className="size-3.5" />
								<span>Zoom 100%</span>
							</>
						)}
					</button>
				</div>

				{/* Bottom Thumbnails & Keyboard Hint */}
				<div className="border-t border-white/10 bg-black/60 backdrop-blur-md py-3 px-6 shrink-0 space-y-2">
					{/* Thumbnails row */}
					<div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-thin">
						{images.map((img, idx) => {
							const isSelected = idx === currentIndex;
							return (
								<button
									key={idx}
									type="button"
									onClick={() => {
										setCurrentIndex(idx);
										setIsZoomed(false);
									}}
									className={`relative size-14 shrink-0 rounded-md overflow-hidden transition-all ${
										isSelected
											? "ring-2 ring-primary ring-offset-2 ring-offset-black scale-105"
											: "opacity-50 hover:opacity-100"
									}`}
								>
									<img
										src={img}
										alt={`Thumbnail ${idx + 1}`}
										className="size-full object-cover"
									/>
								</button>
							);
						})}
					</div>

					{/* Keyboard Hint */}
					<div className="hidden sm:flex items-center justify-center gap-4 text-[11px] text-white/40 pt-1">
						<span>← → {locale === "ar" ? "التنقل" : "Navigate"}</span>
						<span>•</span>
						<span>Esc {locale === "ar" ? "إغلاق" : "Close"}</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
