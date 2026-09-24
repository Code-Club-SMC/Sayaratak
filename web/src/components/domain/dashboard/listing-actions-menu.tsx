import { Link } from "@tanstack/react-router";
import { CheckCircle, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

interface ListingActionsMenuProps {
	listingId: string;
	status: "active" | "pending" | "sold";
	locale: "en" | "ar";
}

export function ListingActionsMenu({
	listingId,
	status,
	locale,
}: ListingActionsMenuProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="size-8 p-0" aria-label="Open menu">
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
					{t.common.actions || "Actions"}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link
						to="/$locale/listings/$id"
						params={{ locale, id: listingId }}
						className="flex items-center gap-2 cursor-pointer"
					>
						<Eye className="size-4" />
						<span>{t.common.view || "View"}</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<Link
						to="/$locale/dashboard/listings"
						params={{ locale }}
						className="flex items-center gap-2 cursor-pointer"
					>
						<Edit className="size-4" />
						<span>{t.common.edit || "Edit"}</span>
					</Link>
				</DropdownMenuItem>

				{status !== "sold" && (
					<DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
						<CheckCircle className="size-4" />
						<span>Mark as Sold</span>
					</DropdownMenuItem>
				)}

				<DropdownMenuSeparator />

				<DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
					<Trash2 className="size-4" />
					<span>{t.common.delete || "Delete"}</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
