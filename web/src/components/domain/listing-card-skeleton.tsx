import { cn } from "@/lib/utils";

type ListingCardSkeletonProps = {
	variant?: "grid" | "horizontal";
	className?: string;
};

export function ListingCardSkeleton({
	variant = "grid",
	className,
}: ListingCardSkeletonProps) {
	if (variant === "horizontal") {
		return (
			<div
				className={cn(
					"flex overflow-hidden rounded-lg border border-border bg-card p-0",
					className,
				)}
			>
				<div className="aspect-[4/3] w-full sm:w-48 md:w-56 shrink-0 bg-muted/60 animate-pulse" />
				<div className="flex flex-1 flex-col justify-between p-4 space-y-3">
					<div className="space-y-2">
						<div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
						<div className="h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
						<div className="h-3 w-1/3 rounded bg-muted/40 animate-pulse" />
					</div>
					<div className="flex justify-between items-end pt-2 border-t border-border/40">
						<div className="h-6 w-28 rounded bg-muted animate-pulse" />
						<div className="h-3 w-20 rounded bg-muted/60 animate-pulse" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-lg border border-border bg-card",
				className,
			)}
		>
			{/* Image Shimmer */}
			<div className="aspect-[4/3] w-full bg-muted/60 animate-pulse" />

			{/* Body Shimmer */}
			<div className="flex flex-1 flex-col justify-between p-4 space-y-4">
				<div className="space-y-2">
					<div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
					<div className="h-3 w-1/2 rounded bg-muted/60 animate-pulse" />
					<div className="h-3 w-2/3 rounded bg-muted/40 animate-pulse mt-2" />
				</div>

				<div className="border-t border-border/50 pt-2.5 space-y-1.5">
					<div className="flex justify-between items-center">
						<div className="h-6 w-28 rounded bg-muted animate-pulse" />
						<div className="h-4 w-14 rounded bg-muted/40 animate-pulse" />
					</div>
					<div className="h-3 w-20 rounded bg-muted/40 animate-pulse" />
				</div>
			</div>
		</div>
	);
}

/**
 * Grid of skeletons for listing catalog loading states.
 */
export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: count }).map((_, i) => (
				<ListingCardSkeleton key={i} />
			))}
		</div>
	);
}
