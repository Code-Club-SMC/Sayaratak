import { createFileRoute } from "@tanstack/react-router";
import { Building2, MapPin, Search, Star, Wrench } from "lucide-react";
import { type Workshop, WorkshopCard } from "@/components/domain/workshop-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_public/workshops/")({
	component: WorkshopsDirectoryPage,
});

// Mock data for workshops
const MOCK_WORKSHOPS: Workshop[] = [
	{
		id: "wk-1",
		name: "Al-Waha Auto Workshop",
		logoUrl:
			"https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum",
		isVerified: true,
		rating: 4.7,
		reviewCount: 128,
		specializations: ["Engine Diagnostics", "Oil Change", "Brake Service"],
		isOpenNow: true,
	},
	{
		id: "wk-2",
		name: "Blue Nile Service Center",
		logoUrl:
			"https://images.unsplash.com/photo-1599256621730-535171e28f32?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum North",
		isVerified: true,
		rating: 4.6,
		reviewCount: 96,
		specializations: ["AC Repair", "Electrical", "Maintenance"],
		isOpenNow: true,
	},
	{
		id: "wk-3",
		name: "Al-Noor Garage",
		logoUrl:
			"https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Omdurman",
		isVerified: true,
		rating: 4.5,
		reviewCount: 72,
		specializations: ["Engine Repair", "Brake Service", "Alignment"],
		isOpenNow: true,
	},
	{
		id: "wk-4",
		name: "Bahri Auto Care",
		logoUrl:
			"https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Bahri",
		isVerified: true,
		rating: 4.4,
		reviewCount: 64,
		specializations: ["AC Repair", "Electrical", "Diagnostics"],
		isOpenNow: true,
	},
];

const MOCK_ALL_WORKSHOPS: Workshop[] = [
	{
		id: "wk-5",
		name: "Port Sudan Tire & Brake",
		logoUrl:
			"https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Port Sudan",
		isVerified: true,
		rating: 4.4,
		reviewCount: 58,
		specializations: ["Tires", "Brake Service", "Alignment"],
		isOpenNow: true,
	},
	{
		id: "wk-6",
		name: "Modern Engine Lab",
		logoUrl:
			"https://images.unsplash.com/photo-1590496736636-f09b5eb0fa5e?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum",
		isVerified: true,
		rating: 4.6,
		reviewCount: 83,
		specializations: ["Engine Diagnostics", "Repair", "Tuning"],
		isOpenNow: false,
		hoursText: "Closed • Opens 8:00 AM",
	},
	{
		id: "wk-7",
		name: "Omdurman Auto Electrical",
		logoUrl:
			"https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Omdurman",
		isVerified: true,
		rating: 4.3,
		reviewCount: 47,
		specializations: ["Electrical Repair", "Batteries", "Diagnostics"],
		isOpenNow: true,
	},
	{
		id: "wk-8",
		name: "Wad Madani Auto Service",
		logoUrl:
			"https://images.unsplash.com/photo-1486262715619-670810a04453?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Wad Madani",
		isVerified: true,
		rating: 4.2,
		reviewCount: 36,
		specializations: ["General Service", "Oil Change", "AC Repair"],
		isOpenNow: false,
		hoursText: "Closed • Opens 8:00 AM",
	},
];

function WorkshopsDirectoryPage() {
	const { locale } = useTranslation();

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-r from-sky-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-900 border-b border-border py-12">
				{/* Workshop Background Banner */}
				<div className="absolute inset-0 pointer-events-none opacity-40">
					<img
						src="/images/placeholders/workshop-banner-bg.png"
						alt="Workshop Background"
						className="w-full h-full object-cover object-center"
					/>
				</div>
				<div className="container mx-auto max-w-7xl px-4 relative z-10 flex items-center gap-6">
					<div className="hidden sm:flex size-24 shrink-0 rounded-full bg-blue-100/50 dark:bg-blue-900/20 items-center justify-center border-2 border-blue-200 dark:border-blue-800">
						<img
							src="/images/Svgs/workshop-icon.svg"
							alt="Workshop Icon"
							className="size-11"
						/>
					</div>
					<div className="space-y-2">
						<h1 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
							{locale === "ar" ? "ورش الصيانة" : "Workshops"}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
							{locale === "ar"
								? "ابحث عن ورش السيارات الموثوقة في السودان. فنيين معتمدين، خدمة بجودة عالية، وأسعار عادلة."
								: "Find trusted automotive workshops across Sudan. Verified professionals, quality service, and fair prices."}
						</p>
					</div>
				</div>
			</section>

			{/* Filter Bar */}
			<div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-xs">
				<div className="container mx-auto max-w-7xl px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
					<div className="relative flex-1 min-w-[250px]">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder={
								locale === "ar"
									? "ابحث باسم الورشة أو الخدمة"
									: "Search by workshop name or service"
							}
							className="ps-9 h-10 text-sm bg-background border-border shadow-none"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="relative w-full sm:w-36 shrink-0">
							<MapPin className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="">
									{locale === "ar" ? "كل المدن" : "All Cities"}
								</option>
								<option value="khartoum">Khartoum</option>
								<option value="bahri">Bahri</option>
								<option value="omdurman">Omdurman</option>
							</NativeSelect>
						</div>

						<div className="relative w-full sm:w-44 shrink-0">
							<Wrench className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="">
									{locale === "ar" ? "كل التخصصات" : "All Specializations"}
								</option>
								<option value="engine">Engine Repair</option>
								<option value="electrical">Electrical</option>
								<option value="ac">AC Repair</option>
							</NativeSelect>
						</div>

						<label className="flex items-center gap-2 cursor-pointer h-10 px-3 border border-border bg-background rounded-md text-xs font-medium hover:bg-muted/50 transition-colors">
							<Checkbox />
							<span>{locale === "ar" ? "موثّق فقط" : "Verified only"}</span>
						</label>

						<label className="flex items-center gap-2 cursor-pointer h-10 px-3 border border-border bg-background rounded-md text-xs font-medium hover:bg-muted/50 transition-colors">
							<Checkbox />
							<span>{locale === "ar" ? "مفتوح الآن" : "Open now"}</span>
						</label>

						<div className="relative w-[130px] shrink-0">
							<Star className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="">
									{locale === "ar" ? "كل التقييمات" : "All Ratings"}
								</option>
								<option value="4+">4.0+ Stars</option>
								<option value="3+">3.0+ Stars</option>
							</NativeSelect>
						</div>

						<Button className="h-10 text-xs font-semibold px-4 w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 ml-auto">
							<MapPin className="size-3.5" />
							{locale === "ar" ? "عرض على الخريطة" : "View on Map"}
						</Button>
					</div>
				</div>
			</div>

			<div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
				{/* Featured Workshops */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Star className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "ورش مميزة" : "Featured Workshops"}
							</h2>
						</div>
						<Button
							variant="link"
							className="text-primary font-semibold text-sm px-0"
						>
							{locale === "ar" ? "عرض الكل >" : "View all featured >"}
						</Button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{MOCK_WORKSHOPS.map((workshop) => (
							<WorkshopCard key={workshop.id} workshop={workshop} />
						))}
					</div>
				</section>

				{/* All Workshops */}
				<section>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Building2 className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "كل الورش" : "All Workshops"}
							</h2>
						</div>
						<div className="text-sm text-muted-foreground font-medium">
							146 {locale === "ar" ? "ورشة موجودة" : "workshops found"}
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{MOCK_ALL_WORKSHOPS.map((workshop) => (
							<WorkshopCard key={workshop.id} workshop={workshop} />
						))}
					</div>

					{/* Pagination Mock */}
					<div className="mt-10 flex items-center justify-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="size-9 rounded-md"
							disabled
						>
							<span className="sr-only">Previous</span>
							&lt;
						</Button>
						<Button variant="default" size="icon" className="size-9 rounded-md">
							1
						</Button>
						<Button variant="outline" size="icon" className="size-9 rounded-md">
							2
						</Button>
						<Button variant="outline" size="icon" className="size-9 rounded-md">
							3
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="size-9 rounded-md hidden sm:inline-flex"
						>
							4
						</Button>
						<Button
							variant="outline"
							size="icon"
							className="size-9 rounded-md hidden sm:inline-flex"
						>
							5
						</Button>
						<span className="px-2 text-muted-foreground">...</span>
						<Button variant="outline" size="icon" className="size-9 rounded-md">
							15
						</Button>
						<Button variant="outline" size="icon" className="size-9 rounded-md">
							<span className="sr-only">Next</span>
							&gt;
						</Button>
					</div>
				</section>
			</div>
		</div>
	);
}
