import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	title: string;
	value: string | number;
	description?: string;
	icon: LucideIcon;
	trend?: {
		value: number;
		label: string;
	};
	className?: string;
}

export function StatCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	className,
}: StatCardProps) {
	return (
		<Card className={cn("overflow-hidden border-border/60", className)}>
			<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
					<Icon className="size-4" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold font-heading">{value}</div>
				{(description || trend) && (
					<p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
						{trend && (
							<span
								className={cn(
									"font-medium",
									trend.value > 0 ? "text-emerald-600" : "text-rose-600",
								)}
							>
								{trend.value > 0 ? "+" : ""}
								{trend.value}%
							</span>
						)}
						{trend && <span>{trend.label}</span>}
						{!trend && description && <span>{description}</span>}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
