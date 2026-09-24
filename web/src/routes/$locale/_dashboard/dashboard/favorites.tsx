import { createFileRoute } from "@tanstack/react-router";
import { Clock, Heart, LayoutGrid, List, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_dashboard/dashboard/favorites")(
	{
		component: FavoritesPage,
	},
);

// Mock data based on SCR-045
const mockFavorites = [
	{
		title: "Toyota Corolla Altis 1.8 X 2021",
		price: "SDG 24,750,000",
		image: "/images/cars/corolla.png",
		tags: ["2021", "48,500 km", "Petrol", "Auto"],
		location: "Khartoum",
		addedAgo: "Added 2 days ago",
	},
	{
		title: "Hyundai Tucson 2.0 2020",
		price: "SDG 33,800,000",
		image: "/images/cars/tucson.png",
		tags: ["2020", "62,000 km", "Petrol", "Auto"],
		location: "Omdurman",
		addedAgo: "Added 3 days ago",
	},
	{
		title: "Toyota Hilux GL 2.4 2022",
		price: "SDG 42,500,000",
		image: "/images/cars/hilux.png",
		tags: ["2022", "27,000 km", "Diesel", "Manual"],
		location: "Khartoum",
		addedAgo: "Added 1 week ago",
	},
	{
		title: "Bajaj RE Compact 2019",
		price: "SDG 4,800,000",
		image: "/images/cars/bajaj.png",
		tags: ["2019", "18,000 km", "Petrol", "Manual"],
		location: "Khartoum",
		addedAgo: "Added 2 weeks ago",
	},
];

function FavoritesPage() {
	const { t } = useTranslation();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
					Favorites <Heart className="size-6 text-slate-400" />
				</h1>
				<p className="text-slate-600 text-sm">
					Listings you've saved for later.
				</p>
			</div>

			{/* Filters Bar */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[200px] max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
					<Input
						placeholder="Search your favorites..."
						className="pl-9 h-10 bg-white"
					/>
				</div>
				<NativeSelect className="w-40 h-10 bg-white">
					<option>All Categories</option>
				</NativeSelect>
				<NativeSelect className="w-40 h-10 bg-white">
					<option>All Locations</option>
				</NativeSelect>
				<NativeSelect className="w-36 h-10 bg-white">
					<option>All Types</option>
				</NativeSelect>
				<NativeSelect className="w-48 h-10 bg-white ml-auto">
					<option>Sort by: Recently Added</option>
				</NativeSelect>
				<div className="flex items-center bg-white border border-border rounded-md p-1 h-10">
					<Button
						variant="secondary"
						size="icon"
						className="h-7 w-7 rounded-sm bg-blue-50 text-blue-600"
					>
						<LayoutGrid className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm">
						<List className="size-4" />
					</Button>
				</div>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{mockFavorites.map((fav, i) => (
					<div
						key={i}
						className="bg-white border border-border rounded-xl overflow-hidden shadow-sm flex flex-col group"
					>
						<div className="relative h-48 bg-slate-100">
							<img
								src={fav.image}
								alt=""
								className="object-cover w-full h-full"
							/>
							<button
								type="button"
								className="absolute top-3 right-3 size-8 rounded-full bg-white flex items-center justify-center shadow-sm"
							>
								<Heart className="size-4 text-red-500 fill-red-500" />
							</button>
						</div>
						<div className="p-4 flex-1 flex flex-col">
							<h3 className="font-bold text-sm leading-tight mb-1">
								{fav.title}
							</h3>
							<div className="text-blue-600 font-bold mb-3">{fav.price}</div>
							<div className="flex flex-wrap gap-1.5 mb-4">
								{fav.tags.map((tag) => (
									<span
										key={tag}
										className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full"
									>
										{tag}
									</span>
								))}
							</div>
							<div className="mt-auto flex items-center justify-between text-xs text-slate-500 mb-4">
								<div className="flex items-center gap-1">
									<MapPin className="size-3" /> {fav.location}
								</div>
								<div className="flex items-center gap-1">
									<Clock className="size-3" /> {fav.addedAgo}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 border-t border-border h-10">
							<button
								type="button"
								className="text-xs font-bold text-blue-600 hover:bg-slate-50 border-r border-border"
							>
								View Details
							</button>
							<button
								type="button"
								className="text-xs font-bold text-red-500 hover:bg-slate-50"
							>
								Remove
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
