import { db } from "./index";
import {
	countries,
	cities,
	districts,
	categories,
	makes,
	models,
	subscriptionPackages,
	pages,
} from "./schemas";
import { eq, sql } from "drizzle-orm";

export async function seedDatabase() {
	console.log("🌱 Ensuring PostGIS and Seeding Taxonomy data...");

	// Ensure PostGIS extension is available
	try {
		await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
		console.log("✅ PostGIS extension verified");
	} catch (err) {
		console.warn("⚠️ PostGIS extension check notice:", (err as Error).message);
	}

	// 0. Seed Free Plan
	const existingFreePlan = await db
		.select()
		.from(subscriptionPackages)
		.where(eq(subscriptionPackages.nameEn, "Free Plan"))
		.limit(1);

	if (existingFreePlan.length === 0) {
		await db.insert(subscriptionPackages).values({
			nameEn: "Free Plan",
			nameAr: "الخطة المجانية",
			roleTarget: "user", // Base target
			price: 0,
			listingLimit: 5, // Users can post 5 listings for free
			durationDays: 36500, // Effectively lifetime
			isActive: true,
			isFeaturedIncluded: false,
		});
		console.log("✅ Seeded Free Plan");
	}

	// 1. Seed Country: Sudan
	const existingCountries = await db
		.select()
		.from(countries)
		.where(eq(countries.code, "SD"))
		.limit(1);

	let countryId = existingCountries[0]?.id;

	if (!countryId) {
		const [inserted] = await db
			.insert(countries)
			.values({
				nameEn: "Sudan",
				nameAr: "السودان",
				code: "SD",
				currencyCode: "SDG",
				phoneCode: "+249",
				isActive: true,
			})
			.returning();
		countryId = inserted.id;
	}

	// 2. Seed Cities
	const cityData = [
		{ nameEn: "Khartoum", nameAr: "الخرطوم", lat: 15.5007, lng: 32.5599 },
		{ nameEn: "Omdurman", nameAr: "أم درمان", lat: 15.6505, lng: 32.4809 },
		{ nameEn: "Khartoum North (Bahri)", nameAr: "بحري (الخرطوم بحري)", lat: 15.6458, lng: 32.5355 },
		{ nameEn: "Port Sudan", nameAr: "بورتسودان", lat: 19.6158, lng: 37.2164 },
		{ nameEn: "Kassala", nameAr: "كسلا", lat: 15.451, lng: 36.4001 },
		{ nameEn: "Wad Madani", nameAr: "ود مدني", lat: 14.4012, lng: 33.5199 },
		{ nameEn: "El Obeid", nameAr: "الأبيض", lat: 13.1843, lng: 30.2167 },
		{ nameEn: "Nyala", nameAr: "نيالا", lat: 12.0467, lng: 24.8922 },
	];

	for (const c of cityData) {
		const existing = await db
			.select()
			.from(cities)
			.where(eq(cities.nameEn, c.nameEn))
			.limit(1);

		let cityId = existing[0]?.id;

		if (!cityId) {
			const [insertedCity] = await db
				.insert(cities)
				.values({
					countryId,
					nameEn: c.nameEn,
					nameAr: c.nameAr,
					lat: c.lat,
					lng: c.lng,
					isActive: true,
				})
				.returning();
			cityId = insertedCity.id;

			// Add sample districts for Khartoum
			if (c.nameEn === "Khartoum") {
				const khartoumDistricts = [
					{ nameEn: "Al Riyadh", nameAr: "الرياض", lat: 15.5833, lng: 32.5667 },
					{ nameEn: "Al Manshiya", nameAr: "المنشية", lat: 15.6, lng: 32.5833 },
					{ nameEn: "Al Amarat", nameAr: "العمارات", lat: 15.5667, lng: 32.55 },
					{ nameEn: "Garden City", nameAr: "قاردن سيتي", lat: 15.605, lng: 32.55 },
					{ nameEn: "Arkawit", nameAr: "أركويت", lat: 15.55, lng: 32.5667 },
				];
				for (const d of khartoumDistricts) {
					await db.insert(districts).values({
						cityId,
						nameEn: d.nameEn,
						nameAr: d.nameAr,
						lat: d.lat,
						lng: d.lng,
						isActive: true,
					});
				}
			}
		}
	}

	// 3. Seed Marketplace Categories
	const categoryData = [
		{ slug: "cars-for-sale", nameEn: "Cars for Sale", nameAr: "سيارات للبيع", displayOrder: 1 },
		{ slug: "cars-for-rent", nameEn: "Cars for Rent", nameAr: "سيارات للإيجار", displayOrder: 2 },
		{ slug: "trucks", nameEn: "Trucks & Heavy Vehicles", nameAr: "شاحنات ومعدات ثقيلة", displayOrder: 3 },
		{ slug: "tuk-tuks", nameEn: "Tuk-Tuks & Rickshaws", nameAr: "توك توك وركشات", displayOrder: 4 },
		{ slug: "spare-parts", nameEn: "Spare Parts", nameAr: "قطع غيار", displayOrder: 5 },
		{ slug: "motorcycles", nameEn: "Motorcycles", nameAr: "دراجات نارية", displayOrder: 6 },
		{ slug: "automotive-services", nameEn: "Automotive Services", nameAr: "خدمات وصيانة السيارات", displayOrder: 7 },
	];

	for (const cat of categoryData) {
		const existing = await db
			.select()
			.from(categories)
			.where(eq(categories.slug, cat.slug))
			.limit(1);

		if (existing.length === 0) {
			await db.insert(categories).values({
				slug: cat.slug,
				nameEn: cat.nameEn,
				nameAr: cat.nameAr,
				displayOrder: cat.displayOrder,
				isActive: true,
			});
		}
	}

	// 4. Seed Popular Vehicle Makes & Models in Sudan
	const makesData = [
		{
			nameEn: "Toyota",
			nameAr: "تويوتا",
			slug: "toyota",
			models: [
				{ nameEn: "Hilux", nameAr: "هايلوكس", slug: "hilux", vehicleType: "truck" },
				{ nameEn: "Land Cruiser", nameAr: "لاند كروزر", slug: "land-cruiser", vehicleType: "car" },
				{ nameEn: "Land Cruiser Prado", nameAr: "برادو", slug: "prado", vehicleType: "car" },
				{ nameEn: "Corolla", nameAr: "كورولا", slug: "corolla", vehicleType: "car" },
				{ nameEn: "Yaris", nameAr: "يارس", slug: "yaris", vehicleType: "car" },
				{ nameEn: "RAV4", nameAr: "راف 4", slug: "rav4", vehicleType: "car" },
				{ nameEn: "Camry", nameAr: "كامري", slug: "camry", vehicleType: "car" },
			],
		},
		{
			nameEn: "Hyundai",
			nameAr: "هيونداي",
			slug: "hyundai",
			models: [
				{ nameEn: "Accent", nameAr: "أكسنت", slug: "accent", vehicleType: "car" },
				{ nameEn: "Elantra", nameAr: "إلنترا", slug: "elantra", vehicleType: "car" },
				{ nameEn: "Tucson", nameAr: "توسان", slug: "tucson", vehicleType: "car" },
				{ nameEn: "Santa Fe", nameAr: "سنتافي", slug: "santa-fe", vehicleType: "car" },
				{ nameEn: "Sonata", nameAr: "سوناتا", slug: "sonata", vehicleType: "car" },
				{ nameEn: "Creta", nameAr: "كريتا", slug: "creta", vehicleType: "car" },
			],
		},
		{
			nameEn: "Nissan",
			nameAr: "نيسان",
			slug: "nissan",
			models: [
				{ nameEn: "Patrol", nameAr: "باترول", slug: "patrol", vehicleType: "car" },
				{ nameEn: "Sunny", nameAr: "صني", slug: "sunny", vehicleType: "car" },
				{ nameEn: "Navara", nameAr: "نافارا", slug: "navara", vehicleType: "truck" },
				{ nameEn: "X-Trail", nameAr: "إكس تريل", slug: "x-trail", vehicleType: "car" },
			],
		},
		{
			nameEn: "Mitsubishi",
			nameAr: "ميتسوبيشي",
			slug: "mitsubishi",
			models: [
				{ nameEn: "L200", nameAr: "L200", slug: "l200", vehicleType: "truck" },
				{ nameEn: "Pajero", nameAr: "باجيرو", slug: "pajero", vehicleType: "car" },
				{ nameEn: "Lancer", nameAr: "لانسر", slug: "lancer", vehicleType: "car" },
				{ nameEn: "Canter", nameAr: "كانتر", slug: "canter", vehicleType: "truck" },
			],
		},
		{
			nameEn: "Bajaj",
			nameAr: "بجاج",
			slug: "bajaj",
			models: [
				{ nameEn: "RE Tuk-Tuk", nameAr: "ركشة بجاج RE", slug: "re-tuk-tuk", vehicleType: "tuk-tuk" },
				{ nameEn: "Boxer 150", nameAr: "بوكسر 150", slug: "boxer-150", vehicleType: "motorcycle" },
				{ nameEn: "Pulsar", nameAr: "بولسار", slug: "pulsar", vehicleType: "motorcycle" },
			],
		},
		{
			nameEn: "Mercedes-Benz",
			nameAr: "مرسيدس بنز",
			slug: "mercedes-benz",
			models: [
				{ nameEn: "C-Class", nameAr: "الفئة C", slug: "c-class", vehicleType: "car" },
				{ nameEn: "E-Class", nameAr: "الفئة E", slug: "e-class", vehicleType: "car" },
				{ nameEn: "G-Class", nameAr: "جي كلاس", slug: "g-class", vehicleType: "car" },
				{ nameEn: "Actros", nameAr: "أكتروس", slug: "actros", vehicleType: "truck" },
			],
		},
		{
			nameEn: "Kia",
			nameAr: "كيا",
			slug: "kia",
			models: [
				{ nameEn: "Cerato", nameAr: "سيراتو", slug: "cerato", vehicleType: "car" },
				{ nameEn: "Sportage", nameAr: "سبورتاج", slug: "sportage", vehicleType: "car" },
				{ nameEn: "Sorento", nameAr: "سورينتو", slug: "sorento", vehicleType: "car" },
				{ nameEn: "Picanto", nameAr: "بيكانتو", slug: "picanto", vehicleType: "car" },
			],
		},
	];

	for (const m of makesData) {
		const existing = await db
			.select()
			.from(makes)
			.where(eq(makes.slug, m.slug))
			.limit(1);

		let makeId = existing[0]?.id;

		if (!makeId) {
			const [insertedMake] = await db
				.insert(makes)
				.values({
					nameEn: m.nameEn,
					nameAr: m.nameAr,
					slug: m.slug,
					isActive: true,
				})
				.returning();
			makeId = insertedMake.id;
		}

		for (const modelItem of m.models) {
			const existingModel = await db
				.select()
				.from(models)
				.where(eq(models.slug, modelItem.slug))
				.limit(1);

			if (existingModel.length === 0) {
				await db.insert(models).values({
					makeId,
					nameEn: modelItem.nameEn,
					nameAr: modelItem.nameAr,
					slug: modelItem.slug,
					vehicleType: modelItem.vehicleType,
					isActive: true,
				});
			}
		}
	}

	// 5. Seed Core Website CMS Pages
	const defaultPages = [
		{
			slug: "about-us",
			title: "About Sayaratak",
			titleAr: "عن سياراتك",
			content: "Sayaratak is Sudan's premier digital automotive marketplace, connecting buyers, sellers, dealerships, workshops, and mechanics across Sudan.",
			contentAr: "سياراتك هي المنصة الرقمية الرائدة في السودان لسوق السيارات، حيث تربط بين المشترين والبائعين ومعارض السيارات وورش الصيانة والفنيين في جميع أنحاء السودان.",
		},
		{
			slug: "contact-us",
			title: "Contact Us",
			titleAr: "اتصل بنا",
			content: "Have questions or need assistance? Reach out to our dedicated support team via email at support@sayaratak.com or via WhatsApp.",
			contentAr: "هل لديك استفسارات أو تحتاج إلى مساعدة؟ تواصل مع فريق الدعم المتخصص عبر البريد الإلكتروني support@sayaratak.com أو عبر واتساب.",
		},
		{
			slug: "privacy-policy",
			title: "Privacy Policy",
			titleAr: "سياسة الخصوصية",
			content: "At Sayaratak, we value your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our marketplace platform.",
			contentAr: "في سياراتك، نولي خصوصيتك أهمية بالغة. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا.",
		},
		{
			slug: "terms-and-conditions",
			title: "Terms & Conditions",
			titleAr: "الشروط والأحكام",
			content: "By accessing or using Sayaratak, you agree to be bound by these Terms and Conditions. All listings must comply with local laws and regulations.",
			contentAr: "من خلال الوصول إلى منصة سياراتك أو استخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. يجب أن تتوافق جميع الإعلانات مع القوانين واللوائح المعمول بها.",
		},
	];

	for (const p of defaultPages) {
		const existingPage = await db
			.select()
			.from(pages)
			.where(eq(pages.slug, p.slug))
			.limit(1);

		if (existingPage.length === 0) {
			await db.insert(pages).values({
				slug: p.slug,
				title: p.title,
				titleAr: p.titleAr,
				content: p.content,
				contentAr: p.contentAr,
				isActive: true,
			});
		}
	}

	console.log("✅ Taxonomy, Locations, and CMS Pages seeded successfully!");
}

if (import.meta.main) {
	await seedDatabase();
	process.exit(0);
}
