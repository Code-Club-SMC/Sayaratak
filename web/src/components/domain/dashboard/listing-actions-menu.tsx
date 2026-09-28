import { Link } from "@tanstack/react-router";
import { Check, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
	ListingLifecycleStatus,
	ListingStatus,
} from "@/lib/query-options/listings";

type Props = {
	listingId: string;
	title: string;
	status?: ListingLifecycleStatus;
	locale: string;
	busy: boolean;
	error?: string | null;
	onStatusChange: (status: ListingStatus) => Promise<void>;
	onDelete: () => Promise<boolean>;
};

const transitions: Partial<Record<ListingLifecycleStatus, ListingStatus[]>> = {
	draft: ["available"],
	available: ["reserved", "sold", "rented"],
	reserved: ["available", "sold"],
};

const actionNames: Record<ListingStatus, { en: string; ar: string }> = {
	draft: { en: "Mark draft", ar: "تحديد كمسودة" },
	available: { en: "Mark available", ar: "تحديد كمتاح" },
	reserved: { en: "Mark reserved", ar: "تحديد كمحجوز" },
	sold: { en: "Mark sold", ar: "تحديد كمباع" },
	rented: { en: "Mark rented", ar: "تحديد كمؤجر" },
};

export function ListingActionsMenu({
	listingId,
	title,
	status,
	locale,
	busy,
	error,
	onStatusChange,
	onDelete,
}: Props) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const ar = locale === "ar";
	const actions = status ? (transitions[status] ?? []) : [];

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							disabled={busy}
							aria-label={ar ? `إجراءات ${title}` : `Actions for ${title}`}
						/>
					}
				>
					<MoreHorizontal aria-hidden="true" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-44">
					<DropdownMenuItem
						render={
							<Link
								to="/$locale/dashboard/listings/$id/edit"
								params={{ locale, id: listingId }}
							/>
						}
					>
						<Pencil aria-hidden="true" /> {ar ? "تعديل" : "Edit"}
					</DropdownMenuItem>
					{status === "available" && (
						<DropdownMenuItem
							render={
								<Link
									to="/$locale/listings/$id"
									params={{ locale, id: listingId }}
								/>
							}
						>
							<Eye aria-hidden="true" /> {ar ? "عرض" : "View"}
						</DropdownMenuItem>
					)}
					{actions.map((next) => (
						<DropdownMenuItem
							key={next}
							onClick={() => void onStatusChange(next)}
						>
							<Check aria-hidden="true" /> {actionNames[next][ar ? "ar" : "en"]}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setConfirmOpen(true)}
					>
						<Trash2 aria-hidden="true" /> {ar ? "حذف" : "Delete"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{ar ? "حذف الإعلان؟" : "Delete listing?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{ar
								? `سيتم حذف «${title}» نهائياً.`
								: `"${title}" will be permanently deleted.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{error && (
						<p role="alert" className="text-xs text-destructive">
							{error}
						</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={busy}>
							{ar ? "إلغاء" : "Cancel"}
						</AlertDialogCancel>
						<Button
							variant="destructive"
							disabled={busy}
							onClick={async () => {
								if (await onDelete()) setConfirmOpen(false);
							}}
						>
							<Trash2 aria-hidden="true" />{" "}
							{ar ? "حذف الإعلان" : "Delete listing"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
