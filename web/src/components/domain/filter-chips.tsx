import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export type FilterChipItem = {
	key: string;
	label: string;
	value: string | number;
};

type FilterChipsProps = {
	chips: FilterChipItem[];
	onRemove: (key: string) => void;
	onClearAll: () => void;
	className?: string;
};

export function FilterChips({
	chips,
	onRemove,
	onClearAll,
	className,
}: FilterChipsProps) {
	const { t } = useTranslation();

	if (chips.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2 py-2">
			{chips.map((chip) => (
				<Badge
					key={chip.key}
					variant="secondary"
					className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-foreground border border-border/80 hover:bg-slate-200 transition-colors"
				>
					<span>{chip.label}</span>
					<button
						type="button"
						onClick={() => onRemove(chip.key)}
						className="size-3.5 rounded-full hover:bg-black/10 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
						aria-label={`Remove filter ${chip.label}`}
					>
						<X className="size-3" />
					</button>
				</Badge>
			))}

			<Button
				variant="ghost"
				size="sm"
				onClick={onClearAll}
				className="h-7 text-xs font-semibold text-primary hover:text-primary/80 px-2"
			>
				{t.filters.clearAll}
			</Button>
		</div>
	);
}
