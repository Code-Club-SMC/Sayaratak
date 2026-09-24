import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowUpDown,
	Building2,
	Car,
	ClipboardCheck,
	Clock,
	Handshake,
	MapPin,
	Search,
	ShieldCheck,
	Star,
} from "lucide-react";
import {
	type Dealership,
	DealershipCard,
} from "@/components/domain/dealership-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_public/dealerships/")({
	component: DealershipsDirectoryPage,
});

// Mock data for dealerships
const MOCK_DEALERSHIPS: Dealership[] = [
	{
		id: "dlr-1",
		name: "Toyota Sudan Motors",
		logoUrl:
			"https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum",
		isVerified: true,
		rating: 4.7,
		reviewCount: 128,
		inventoryCount: 126,
		brands: ["Toyota", "Lexus", "Hyundai"],
		recentImages: [
			"https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=200",
		],
		responseTime: "Responds within 1h",
		yearsActive: "15+ years active",
	},
	{
		id: "dlr-2",
		name: "Al-Fateh Hyundai",
		logoUrl:
			"https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Omdurman",
		isVerified: true,
		rating: 4.6,
		reviewCount: 96,
		inventoryCount: 98,
		brands: ["Hyundai", "Kia", "Nissan"],
		recentImages: [
			"https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1503376760367-111161d9eb17?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=200",
		],
		responseTime: "Responds within 2h",
		yearsActive: "10+ years active",
	},
	{
		id: "dlr-3",
		name: "Nissan Bahri Motors",
		logoUrl:
			"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Bahri",
		isVerified: true,
		rating: 4.5,
		reviewCount: 72,
		inventoryCount: 74,
		brands: ["Nissan", "Renault", "Mitsubishi"],
		recentImages: [
			"https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1525609004556-c46dce31c4b3?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=200",
		],
		responseTime: "Responds within 1h",
		yearsActive: "12+ years active",
	},
	{
		id: "dlr-4",
		name: "Kia Motors Sudan",
		logoUrl:
			"https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum",
		isVerified: true,
		rating: 4.6,
		reviewCount: 64,
		inventoryCount: 61,
		brands: ["Kia", "Hyundai", "Toyota"],
		recentImages: [
			"https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=200",
			"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200",
		],
		responseTime: "Responds within 2h",
		yearsActive: "8+ years active",
	},
];

const MOCK_ALL_DEALERSHIPS: Dealership[] = [
	{
		id: "dlr-5",
		name: "Al Sahafa Cars",
		logoUrl:
			"https://images.unsplash.com/photo-1542361345-89e58247f2d5?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum",
		isVerified: true,
		rating: 4.4,
		reviewCount: 53,
		inventoryCount: 43,
		brands: ["Toyota", "Nissan", "Hyundai"],
		recentImages: MOCK_DEALERSHIPS[0].recentImages,
		responseTime: "Responds within 3h",
		yearsActive: "7+ years active",
	},
	{
		id: "dlr-6",
		name: "Central Motors",
		logoUrl:
			"https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Port Sudan",
		isVerified: true,
		rating: 4.3,
		reviewCount: 41,
		inventoryCount: 36,
		brands: ["Toyota", "Hyundai", "Kia"],
		recentImages: MOCK_DEALERSHIPS[1].recentImages,
		responseTime: "Responds within 3h",
		yearsActive: "9+ years active",
	},
	{
		id: "dlr-7",
		name: "Wad Madani Auto",
		logoUrl:
			"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Wad Madani",
		isVerified: true,
		rating: 4.2,
		reviewCount: 32,
		inventoryCount: 28,
		brands: ["Nissan", "Toyota", "Hyundai"],
		recentImages: MOCK_DEALERSHIPS[2].recentImages,
		responseTime: "Responds within 4h",
		yearsActive: "6+ years active",
	},
	{
		id: "dlr-8",
		name: "Blue Nile Motors",
		logoUrl:
			"https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=150&h=150",
		city: "Khartoum North",
		isVerified: true,
		rating: 4.1,
		reviewCount: 28,
		inventoryCount: 24,
		brands: ["Hyundai", "Kia", "Nissan"],
		recentImages: MOCK_DEALERSHIPS[3].recentImages,
		responseTime: "Responds within 4h",
		yearsActive: "5+ years active",
	},
];

function DealershipsDirectoryPage() {
	const { locale, t } = useTranslation();

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
			{/* Hero Section */}
			<section className="relative overflow-hidden bg-gradient-to-r from-sky-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-900 border-b border-border py-12">
				{/* Faint City Skyline Background Illusion */}
				<div className="absolute inset-0 pointer-events-none opacity-40">
					<img
						src="/images/placeholders/Minimalist Automotive Skyline Banner.png"
						alt="Automotive Skyline"
						className="w-full h-full object-cover object-center"
					/>
				</div>
				<div className="container mx-auto max-w-7xl px-4 relative z-10 flex items-center gap-6">
					<div className="hidden sm:flex size-24 shrink-0 rounded-full bg-blue-100/50 dark:bg-blue-900/20 items-center justify-center border-2 border-blue-200 dark:border-blue-800">
						<img
							src="/images/Svgs/dealership-icon.svg"
							alt="Dealership Icon"
							className="size-11"
						/>
					</div>
					<div className="space-y-2">
						<h1 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
							{locale === "ar" ? "المعارض والوكالات" : "Dealerships"}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
							{locale === "ar"
								? "ابحث عن معارض السيارات الموثوقة في جميع أنحاء السودان. وكلاء معتمدون، سيارات بجودة عالية، وأفضل طريقة للشراء."
								: "Find trusted car dealerships across Sudan. Verified dealers, quality vehicles, and a better way to buy."}
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
									? "ابحث باسم المعرض أو العلامة التجارية"
									: "Search by dealership name or brand"
							}
							className="ps-9 h-10 text-sm bg-background border-border shadow-none"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="relative w-full sm:w-40 shrink-0">
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

						<label className="flex items-center gap-2 cursor-pointer h-10 px-3 border border-border bg-background rounded-md text-xs font-medium hover:bg-muted/50 transition-colors">
							<Checkbox />
							<span>{locale === "ar" ? "موثّق فقط" : "Verified only"}</span>
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

						<div className="relative w-[140px] shrink-0">
							<Car className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="">
									{locale === "ar" ? "أي مخزون" : "Any Inventory"}
								</option>
								<option value="50+">50+ Cars</option>
								<option value="100+">100+ Cars</option>
							</NativeSelect>
						</div>

						<div className="relative w-[180px] shrink-0">
							<ArrowUpDown className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="recommended">
									{locale === "ar" ? "الترتيب: مقترح" : "Sort: Recommended"}
								</option>
								<option value="rating">
									{locale === "ar"
										? "التقييم: الأعلى أولاً"
										: "Rating: Highest First"}
								</option>
								<option value="inventory">
									{locale === "ar"
										? "المخزون: الأكبر أولاً"
										: "Inventory: Largest First"}
								</option>
							</NativeSelect>
						</div>

						<Button className="h-10 text-xs font-semibold px-4 w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
							<MapPin className="size-3.5" />
							{locale === "ar" ? "عرض على الخريطة" : "View on Map"}
						</Button>
					</div>
				</div>
			</div>

			<div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
				{/* Featured Dealerships */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Star className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "معارض مميزة" : "Featured Dealerships"}
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
						{MOCK_DEALERSHIPS.map((dealer) => (
							<DealershipCard key={dealer.id} dealership={dealer} />
						))}
					</div>
				</section>

				{/* All Dealerships */}
				<section>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Building2 className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "كل المعارض" : "All Dealerships"}
							</h2>
						</div>
						<div className="text-sm text-muted-foreground font-medium">
							128 {locale === "ar" ? "معرض موجود" : "dealerships found"}
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{MOCK_ALL_DEALERSHIPS.map((dealer) => (
							<DealershipCard key={dealer.id} dealership={dealer} />
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
							13
						</Button>
						<Button variant="outline" size="icon" className="size-9 rounded-md">
							<span className="sr-only">Next</span>
							&gt;
						</Button>
					</div>
				</section>

				{/* Trust Badges */}
				<section className="mt-16 border-t border-border pt-12 pb-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="flex items-start gap-4">
							<ShieldCheck className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "وكلاء معتمدون" : "Verified Dealers"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "جميع المعارض موثقة لضمان تجربة آمنة."
										: "All dealerships are verified to ensure a safe experience."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<ClipboardCheck className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "إعلانات مفحوصة" : "Inspected Listings"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "سيارات بجودة عالية ومعلومات دقيقة يمكنك الوثوق بها."
										: "Quality vehicles and accurate information you can trust."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<Clock className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "استجابة سريعة" : "Fast Response"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "استجابة سريعة لمساعدتك في إيجاد السيارة المناسبة."
										: "Dealers respond quickly to help you find the right car."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<Handshake className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "موثوق من الآلاف" : "Trusted by Thousands"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "انضم لآلاف المشترين الذين وجدوا سيارتهم على سيارتك."
										: "Join thousands of buyers who found their car on Sayaratak."}
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
