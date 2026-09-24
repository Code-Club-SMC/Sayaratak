import { createFileRoute } from "@tanstack/react-router";
import {
	BadgeCheck,
	Briefcase,
	Building2,
	MapPin,
	MessageSquare,
	Search,
	ShieldCheck,
	Star,
	Wrench,
} from "lucide-react";
import { type Mechanic, MechanicCard } from "@/components/domain/mechanic-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/$locale/_public/mechanics/")({
	component: MechanicsDirectoryPage,
});

// Mock data for mechanics
const MOCK_MECHANICS: Mechanic[] = [
	{
		id: "mech-1",
		name: "Ibrahim Hassan",
		title: "Engine Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "12+ years experience",
		city: "Khartoum",
		isVerified: true,
		rating: 4.8,
		reviewCount: 128,
		specializations: ["Engine Repair", "Diagnostics", "Tuning"],
		isAvailable: true,
	},
	{
		id: "mech-2",
		name: "Ahmed Mahgoub",
		title: "Auto Electrician",
		photoUrl:
			"https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "9+ years experience",
		city: "Omdurman",
		isVerified: true,
		rating: 4.7,
		reviewCount: 96,
		specializations: ["Electrical Repair", "Batteries", "Alternators"],
		isAvailable: true,
	},
	{
		id: "mech-3",
		name: "Osama Elamin",
		title: "Transmission Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "10+ years experience",
		city: "Khartoum North",
		isVerified: true,
		rating: 4.7,
		reviewCount: 88,
		specializations: ["Transmission", "Clutch", "Gearbox"],
		isAvailable: false,
	},
	{
		id: "mech-4",
		name: "Moataz Bashir",
		title: "Brake Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "8+ years experience",
		city: "Port Sudan",
		isVerified: true,
		rating: 4.6,
		reviewCount: 72,
		specializations: ["Brake Service", "ABS", "Suspension"],
		isAvailable: true,
	},
];

const MOCK_ALL_MECHANICS: Mechanic[] = [
	{
		id: "mech-5",
		name: "Yasir Abdalla",
		title: "General Mechanic",
		photoUrl:
			"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "7+ years experience",
		city: "Khartoum",
		isVerified: true,
		rating: 4.5,
		reviewCount: 58,
		specializations: ["General Repair", "Maintenance"],
		isAvailable: true,
	},
	{
		id: "mech-6",
		name: "Tariq Alnoor",
		title: "AC Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "6+ years experience",
		city: "Omdurman",
		isVerified: true,
		rating: 4.4,
		reviewCount: 49,
		specializations: ["AC Repair", "Cooling System"],
		isAvailable: true,
	},
	{
		id: "mech-7",
		name: "Sami Altyeb",
		title: "Diesel Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "15+ years experience",
		city: "Khartoum North",
		isVerified: true,
		rating: 4.7,
		reviewCount: 91,
		specializations: ["Diesel Engine", "Diagnostics"],
		isAvailable: false,
	},
	{
		id: "mech-8",
		name: "Abdelrahman Ali",
		title: "Suspension Specialist",
		photoUrl:
			"https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "9+ years experience",
		city: "Wad Madani",
		isVerified: true,
		rating: 4.6,
		reviewCount: 63,
		specializations: ["Suspension", "Steering"],
		isAvailable: true,
	},
	{
		id: "mech-9",
		name: "Hisham Idris",
		title: "Body & Paint",
		photoUrl:
			"https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "12+ years experience",
		city: "Port Sudan",
		isVerified: true,
		rating: 4.5,
		reviewCount: 54,
		specializations: ["Body Work", "Painting"],
		isAvailable: true,
	},
	{
		id: "mech-10",
		name: "Mohamed Saeed",
		title: "Car Mechanic",
		photoUrl:
			"https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=150&h=180",
		experience: "5+ years experience",
		city: "Kassala",
		isVerified: true,
		rating: 4.3,
		reviewCount: 36,
		specializations: ["General Repair", "Oil Change"],
		isAvailable: true,
	},
];

function MechanicsDirectoryPage() {
	const { locale } = useTranslation();

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
							src="/images/Svgs/mechanic-icon.svg"
							alt="Mechanic Icon"
							className="size-11"
						/>
					</div>
					<div className="space-y-2">
						<h1 className="font-heading text-3xl sm:text-4xl font-black text-foreground">
							{locale === "ar" ? "دليل الميكانيكيين" : "Mechanic Directory"}
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
							{locale === "ar"
								? "ابحث عن ميكانيكيين مستقلين موثوقين وذوي خبرة في جميع أنحاء السودان. محترفون يمكنك الوثوق بهم لإصلاح عالي الجودة وخدمة أمينة."
								: "Find verified and experienced independent mechanics across Sudan. Skilled professionals you can trust for quality repairs and honest service."}
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
									? "ابحث باسم الميكانيكي أو تخصصه"
									: "Search by mechanic name or specialty"
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
								<option value="engine">Engine Specialist</option>
								<option value="electrician">Auto Electrician</option>
								<option value="ac">AC Specialist</option>
							</NativeSelect>
						</div>

						<div className="relative w-[140px] shrink-0">
							<Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<NativeSelect className="ps-8 h-10 text-xs w-full bg-background border-border font-medium">
								<option value="">
									{locale === "ar" ? "كل الخبرات" : "All Experience"}
								</option>
								<option value="5+">5+ Years</option>
								<option value="10+">10+ Years</option>
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

						<Button className="h-10 text-xs font-semibold px-4 w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 ml-auto">
							<Search className="size-3.5" />
							{locale === "ar" ? "بحث عن ميكانيكي" : "Search Mechanics"}
						</Button>
					</div>
				</div>
			</div>

			<div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
				{/* Featured Mechanics */}
				<section>
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Star className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "ميكانيكيون مميزون" : "Featured Mechanics"}
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
						{MOCK_MECHANICS.map((mechanic) => (
							<MechanicCard key={mechanic.id} mechanic={mechanic} />
						))}
					</div>
				</section>

				{/* All Mechanics */}
				<section>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
						<div className="flex items-center gap-2">
							<div className="size-7 rounded-full bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
								<Building2 className="size-4 text-blue-600 dark:text-blue-400" />
							</div>
							<h2 className="font-heading text-xl font-bold text-foreground">
								{locale === "ar" ? "كل الميكانيكيين" : "All Mechanics"}
							</h2>
						</div>
						<div className="text-sm text-muted-foreground font-medium">
							156 {locale === "ar" ? "ميكانيكي موجود" : "mechanics found"}
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
						{MOCK_ALL_MECHANICS.map((mechanic) => (
							<MechanicCard key={mechanic.id} mechanic={mechanic} />
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
							16
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
									{locale === "ar"
										? "محترفون موثقون"
										: "Verified Professionals"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "جميع الميكانيكيين الموثقين تم فحص خلفياتهم لراحة بالك."
										: "All verified mechanics are background-checked for your peace of mind."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<BadgeCheck className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "مهارة وخبرة" : "Skilled & Experienced"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "ابحث عن ميكانيكيين بخبرة مثبتة وسنوات من العمل الميداني."
										: "Find mechanics with proven expertise and years of hands-on experience."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<MessageSquare className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "موثوق من الآلاف" : "Trusted by Thousands"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "انضم لآلاف ملاك السيارات الذين يثقون في سيارتك لإيجاد الميكانيكي المناسب."
										: "Join thousands of car owners who trust Sayaratak to find the right mechanic."}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<Star className="size-8 text-primary shrink-0" />
							<div>
								<h3 className="font-semibold text-foreground">
									{locale === "ar" ? "شفافية وصدق" : "Honest & Transparent"}
								</h3>
								<p className="text-sm text-muted-foreground mt-1 leading-relaxed">
									{locale === "ar"
										? "تقييمات حقيقية من عملاء حقيقيين تساعدك على الاختيار بثقة."
										: "Real reviews from real customers help you choose with confidence."}
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
