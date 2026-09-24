import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";

export type SortOption = "newest" | "price_asc" | "price_desc" | "mileage_asc";

type SortBottomSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	value: SortOption;
	onChange: (value: SortOption) => void;
};

export function SortBottomSheet({
	open,
	onOpenChange,
	value,
	onChange,
}: SortBottomSheetProps) {
	const { t, locale } = useTranslation();

	const options: { value: SortOption; label: string }[] = [
		{ value: "newest", label: t.filters.newest },
		{ value: "price_asc", label: t.filters.priceAsc },
		{ value: "price_desc", label: t.filters.priceDesc },
		{ value: "mileage_asc", label: t.filters.mileageAsc },
	];

	function handleSelect(val: SortOption) {
		onChange(val);
		onOpenChange(false);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-4">
				{/* Drawer Drag Pill Indicator */}
				<div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />

				<SheetHeader className="text-start pb-4 border-b border-border">
					<SheetTitle className="font-heading text-lg font-bold">
						{locale === "ar" ? "ترتيب النتائج" : "Sort Results"}
					</SheetTitle>
				</SheetHeader>

				<div className="py-4 space-y-1">
					{options.map((opt) => {
						const isSelected = value === opt.value;
						return (
							<button
								key={opt.value}
								type="button"
								onClick={() => handleSelect(opt.value)}
								className={`flex w-full items-center justify-between p-3.5 rounded-lg text-sm font-medium transition-colors ${
									isSelected
										? "bg-primary/10 text-primary font-semibold"
										: "text-foreground hover:bg-muted"
								}`}
							>
								<span>{opt.label}</span>
								{isSelected && <Check className="size-4 text-primary" />}
							</button>
						);
					})}
				</div>

				<Button onClick={() => onOpenChange(false)} className="w-full mt-2">
					{locale === "ar" ? "تطبيق الترتيب" : "Apply Sort"}
				</Button>
			</SheetContent>
		</Sheet>
	);
}
