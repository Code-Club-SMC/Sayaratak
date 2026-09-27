import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ChevronLeft,
	ChevronRight,
	ImageOff,
	Plus,
	Search,
} from "lucide-react";
import { useState } from "react";
import { ListingActionsMenu } from "@/components/domain/dashboard/listing-actions-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { listingKeys } from "@/lib/query-keys";
import {
	deleteListing,
	type ListingItem,
	type ListingLifecycleStatus,
	type ListingStatus,
	managementListingsQueryOptions,
	updateListingStatus,
} from "@/lib/query-options/listings";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/listings")({
	component: MyListingsPage,
});

const statuses: ListingLifecycleStatus[] = [
	"draft",
	"available",
	"reserved",
	"sold",
	"rented",
	"pending",
	"rejected",
	"banned",
];
const labels: Record<ListingLifecycleStatus, { en: string; ar: string }> = {
	draft: { en: "Draft", ar: "مسودة" },
	available: { en: "Available", ar: "متاح" },
	reserved: { en: "Reserved", ar: "محجوز" },
	sold: { en: "Sold", ar: "مباع" },
	rented: { en: "Rented", ar: "مؤجر" },
	pending: { en: "Pending review", ar: "قيد المراجعة" },
	rejected: { en: "Rejected", ar: "مرفوض" },
	banned: { en: "Banned", ar: "محظور" },
};

function statusClass(status?: ListingLifecycleStatus): string {
	switch (status) {
		case "available":
			return "border-emerald-200 bg-emerald-50 text-emerald-700";
		case "reserved":
			return "border-sky-200 bg-sky-50 text-sky-700";
		case "pending":
			return "border-amber-200 bg-amber-50 text-amber-700";
		case "rejected":
		case "banned":
			return "border-red-200 bg-red-50 text-red-700";
		default:
			return "border-border bg-muted text-foreground";
	}
}

function formatDate(value: string | undefined, locale: string): string {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-SD" : "en-US", {
		dateStyle: "medium",
		timeZone: "UTC",
	}).format(date);
}

type ListingRowProps = {
	listing: ListingItem;
	locale: string;
	busy: boolean;
	error?: string | null;
	onStatusChange: (id: string, status: ListingStatus) => Promise<void>;
	onDelete: (id: string) => Promise<boolean>;
};

function ListingRow({
	listing,
	locale,
	busy,
	error,
	onStatusChange,
	onDelete,
}: ListingRowProps) {
	const ar = locale === "ar";
	return (
		<TableRow>
			<TableCell className="min-w-60 whitespace-normal py-3">
				<div className="flex items-center gap-3">
					<div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
						{listing.images?.[0] ? (
							<img
								src={listing.images[0]}
								alt=""
								className="size-full object-cover"
							/>
						) : (
							<ImageOff aria-hidden="true" className="size-5" />
						)}
					</div>
					<div className="min-w-0">
						<Link
							to="/$locale/dashboard/listings/$id/edit"
							params={{ locale, id: listing.id }}
							className="font-medium text-foreground hover:underline"
						>
							{listing.title}
						</Link>
						<div
							className="mt-1 truncate text-xs text-muted-foreground"
							title={listing.id}
						>
							{listing.id}
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							{[listing.year, listing.city].filter(Boolean).join(" · ")}
						</div>
					</div>
				</div>
			</TableCell>
			<TableCell>
				<Badge variant="outline" className={statusClass(listing.status)}>
					{listing.status ? labels[listing.status][ar ? "ar" : "en"] : "-"}
				</Badge>
			</TableCell>
			<TableCell className="font-medium tabular-nums">
				{new Intl.NumberFormat(ar ? "ar-SD" : "en-US").format(listing.price)}{" "}
				{listing.currency}
			</TableCell>
			<TableCell className="text-muted-foreground">
				{formatDate(listing.createdAt, locale)}
			</TableCell>
			<TableCell className="text-end">
				<ListingActionsMenu
					listingId={listing.id}
					title={listing.title}
					status={listing.status}
					locale={locale}
					busy={busy}
					error={error}
					onStatusChange={(next) => onStatusChange(listing.id, next)}
					onDelete={() => onDelete(listing.id)}
				/>
			</TableCell>
		</TableRow>
	);
}

function MyListingsPage() {
	const { locale } = Route.useParams();
	const { user } = Route.useRouteContext();
	const ar = locale === "ar";
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<ListingLifecycleStatus | "all">("all");
	const [search, setSearch] = useState("");
	const [busyId, setBusyId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const { data, isLoading, isError, error, refetch } = useQuery(
		managementListingsQueryOptions(locale, user.id, {
			page,
			limit: 20,
			status: status === "all" ? undefined : status,
		}),
	);
	const items =
		data?.items.filter((item) =>
			`${item.title} ${item.id}`
				.toLocaleLowerCase()
				.includes(search.trim().toLocaleLowerCase()),
		) ?? [];

	async function refreshAfterChange(id: string, deleted: boolean) {
		if (deleted) {
			queryClient.removeQueries({
				queryKey: listingKeys.managedDetail(locale, id),
			});
			queryClient.removeQueries({ queryKey: listingKeys.detail(locale, id) });
		}
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: listingKeys.managementLists(locale),
			}),
			queryClient.invalidateQueries({ queryKey: listingKeys.lists(locale) }),
			...(deleted
				? []
				: [
						queryClient.invalidateQueries({
							queryKey: listingKeys.managedDetail(locale, id),
						}),
						queryClient.invalidateQueries({
							queryKey: listingKeys.detail(locale, id),
						}),
					]),
		]);
	}

	async function changeStatus(id: string, next: ListingStatus) {
		if (busyId) return;
		setBusyId(id);
		setActionError(null);
		try {
			await updateListingStatus(locale, id, next);
			await refreshAfterChange(id, false);
		} catch (cause) {
			setActionError(
				cause instanceof Error
					? cause.message
					: ar
						? "تعذر تحديث الحالة"
						: "Status update failed",
			);
		} finally {
			setBusyId(null);
		}
	}

	async function removeListing(id: string): Promise<boolean> {
		if (busyId) return false;
		setBusyId(id);
		setActionError(null);
		try {
			await deleteListing(locale, id);
			await refreshAfterChange(id, true);
			if (data?.items.length === 1 && page > 1) setPage(page - 1);
			return true;
		} catch (cause) {
			setActionError(
				cause instanceof Error
					? cause.message
					: ar
						? "تعذر حذف الإعلان"
						: "Delete failed",
			);
			return false;
		} finally {
			setBusyId(null);
		}
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">
						{ar ? "إعلاناتي" : "My Listings"}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{data
							? `${new Intl.NumberFormat(ar ? "ar-SD" : "en-US").format(data.total)} ${ar ? "إعلان" : data.total === 1 ? "listing" : "listings"}`
							: ""}
					</p>
				</div>
				<Button
					render={
						<Link to="/$locale/dashboard/listings/new" params={{ locale }} />
					}
				>
					<Plus aria-hidden="true" /> {ar ? "إضافة إعلان" : "New listing"}
				</Button>
			</div>
			{actionError && (
				<Alert variant="destructive">
					<AlertCircle aria-hidden="true" />
					<AlertDescription>{actionError}</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap gap-2">
				<div className="relative min-w-48 max-w-sm flex-1">
					<Search
						aria-hidden="true"
						className="absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						aria-label={ar ? "بحث في الصفحة الحالية" : "Search current page"}
						placeholder={ar ? "بحث في الصفحة الحالية" : "Search current page"}
						className="ps-9"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</div>
				<NativeSelect
					aria-label={ar ? "تصفية حسب الحالة" : "Filter by status"}
					value={status}
					onChange={(event) => {
						setStatus(event.target.value as ListingLifecycleStatus | "all");
						setPage(1);
					}}
				>
					<option value="all">{ar ? "كل الحالات" : "All statuses"}</option>
					{statuses.map((value) => (
						<option key={value} value={value}>
							{labels[value][ar ? "ar" : "en"]}
						</option>
					))}
				</NativeSelect>
			</div>
			{isError ? (
				<Alert variant="destructive">
					<AlertCircle aria-hidden="true" />
					<AlertDescription>
						{error instanceof Error
							? error.message
							: ar
								? "تعذر تحميل الإعلانات"
								: "Could not load listings"}{" "}
						<Button variant="outline" size="sm" onClick={() => void refetch()}>
							{ar ? "إعادة المحاولة" : "Retry"}
						</Button>
					</AlertDescription>
				</Alert>
			) : isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 5 }, (_, index) => (
						<Skeleton key={index} className="h-20 w-full" />
					))}
				</div>
			) : items.length === 0 ? (
				<div className="border-y py-16 text-center text-sm text-muted-foreground">
					{search
						? ar
							? "لا توجد نتائج في هذه الصفحة"
							: "No results on this page"
						: ar
							? "لا توجد إعلانات"
							: "No listings found"}
				</div>
			) : (
				<div className="overflow-hidden rounded-md border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{ar ? "الإعلان" : "Listing"}</TableHead>
								<TableHead>{ar ? "الحالة" : "Status"}</TableHead>
								<TableHead>{ar ? "السعر" : "Price"}</TableHead>
								<TableHead>{ar ? "تاريخ الإنشاء" : "Created"}</TableHead>
								<TableHead className="text-end">
									{ar ? "إجراءات" : "Actions"}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((item) => (
								<ListingRow
									key={item.id}
									listing={item}
									locale={locale}
									busy={busyId !== null}
									error={actionError}
									onStatusChange={changeStatus}
									onDelete={removeListing}
								/>
							))}
						</TableBody>
					</Table>
				</div>
			)}
			{data && data.totalPages > 1 && !isError && (
				<div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
					<span>
						{ar
							? `صفحة ${page} من ${data.totalPages}`
							: `Page ${page} of ${data.totalPages}`}
					</span>
					<Button
						variant="outline"
						size="icon"
						aria-label={ar ? "الصفحة السابقة" : "Previous page"}
						disabled={page <= 1}
						onClick={() => setPage((current) => current - 1)}
					>
						<ChevronLeft aria-hidden="true" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						aria-label={ar ? "الصفحة التالية" : "Next page"}
						disabled={page >= data.totalPages}
						onClick={() => setPage((current) => current + 1)}
					>
						<ChevronRight aria-hidden="true" />
					</Button>
				</div>
			)}
		</div>
	);
}
