import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, LayoutGrid, List, Search } from "lucide-react";
import { DataTable } from "@/components/domain/dashboard/data-table";
import { ListingActionsMenu } from "@/components/domain/dashboard/listing-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/listings")({
	component: MyListingsPage,
});

// Mock data based on SCR-043
const mockListings = [
	{
		id: "STK-2025-05-18-5631",
		title: "Toyota Corolla Altis 1.8 X 2021",
		image: "/images/cars/corolla.png",
		tags: ["Sedan", "Petrol", "Automatic", "Khartoum"],
		status: "Available",
		publishedAt: "May 19, 2025",
		stats: { views: 512, favorites: 36, phone: 28, whatsapp: 17 },
	},
	{
		id: "STK-2025-05-18-5632",
		title: "Isuzu NPR 75 2020",
		image: "/images/cars/isuzu.png",
		tags: ["Truck", "Diesel", "Manual", "Omdurman"],
		status: "Pending Review",
		publishedAt: "May 18, 2025",
		stats: { views: 97, favorites: 8, phone: 12, whatsapp: 9 },
	},
];

const columns: ColumnDef<(typeof mockListings)[0]>[] = [
	{
		accessorKey: "title",
		header: "Listing",
		cell: ({ row }) => (
			<div className="flex items-center gap-4 py-2">
				<div className="h-20 w-28 rounded-lg overflow-hidden shrink-0 bg-slate-100 relative">
					<img
						src={row.original.image}
						alt=""
						className="object-cover w-full h-full"
					/>
					<div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
						6 <FileText className="size-3 inline-block ml-0.5" />
					</div>
				</div>
				<div>
					<div className="font-bold text-base">{row.original.title}</div>
					<div className="text-xs text-slate-500 mb-1">{row.original.id}</div>
					<div className="text-xs text-slate-600 flex items-center gap-1.5">
						{row.original.tags.map((tag, i) => (
							<span key={tag} className="flex items-center gap-1.5">
								{i > 0 && (
									<span className="w-1 h-1 rounded-full bg-slate-300" />
								)}
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<div>
				<Badge
					variant="outline"
					className={
						row.original.status === "Available"
							? "bg-green-50 text-green-700 border-green-200"
							: "bg-amber-50 text-amber-700 border-amber-200"
					}
				>
					{row.original.status}
				</Badge>
				<div className="text-xs text-slate-500 mt-1">
					Published
					<br />
					{row.original.publishedAt}
				</div>
			</div>
		),
	},
	{
		accessorKey: "views",
		header: "Views",
		cell: ({ row }) => (
			<span className="font-medium text-slate-700">
				{row.original.stats.views}
			</span>
		),
	},
	{
		id: "actions",
		header: "Actions",
		cell: () => (
			<div className="flex items-center gap-1">
				{/* The buttons from design */}
				<Button variant="ghost" size="sm" className="h-8 text-blue-600">
					Edit
				</Button>
				<Button variant="ghost" size="sm" className="h-8 text-blue-600">
					Promote
				</Button>
				<ListingActionsMenu />
			</div>
		),
	},
];

function MyListingsPage() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-1">
						My Listings
					</h1>
					<p className="text-slate-600 text-sm">
						Manage all your vehicle ads in one place.
					</p>
				</div>
				<div className="flex items-center gap-6 text-sm">
					<div className="flex items-center gap-2">
						<FileText className="size-4 text-slate-400" />
						<div>
							<div className="text-slate-500 text-xs font-medium">
								Total Listings
							</div>
							<div className="font-bold text-lg leading-none mt-1">8</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-green-500" />
						<div>
							<div className="text-slate-500 text-xs font-medium">
								Available
							</div>
							<div className="font-bold text-lg leading-none mt-1">3</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-blue-500" />
						<div>
							<div className="text-slate-500 text-xs font-medium">Reserved</div>
							<div className="font-bold text-lg leading-none mt-1">1</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-amber-500" />
						<div>
							<div className="text-slate-500 text-xs font-medium">
								Pending Review
							</div>
							<div className="font-bold text-lg leading-none mt-1">1</div>
						</div>
					</div>
				</div>
			</div>

			{/* Filters Bar */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[200px] max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
					<Input
						placeholder="Search by title, ID or keyword..."
						className="pl-9 h-10 bg-white"
					/>
				</div>
				<NativeSelect className="w-36 h-10 bg-white">
					<option>All Status</option>
				</NativeSelect>
				<NativeSelect className="w-40 h-10 bg-white">
					<option>All Categories</option>
				</NativeSelect>
				<NativeSelect className="w-36 h-10 bg-white">
					<option>All Types</option>
				</NativeSelect>
				<NativeSelect className="w-44 h-10 bg-white ml-auto">
					<option>Sort by: Newest</option>
				</NativeSelect>
				<div className="flex items-center bg-white border border-border rounded-md p-1 h-10">
					<Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm">
						<LayoutGrid className="size-4" />
					</Button>
					<Button
						variant="secondary"
						size="icon"
						className="h-7 w-7 rounded-sm bg-blue-50 text-blue-600"
					>
						<List className="size-4" />
					</Button>
				</div>
			</div>

			{/* Table Content */}
			<div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
				<DataTable columns={columns} data={mockListings} />
			</div>
		</div>
	);
}
