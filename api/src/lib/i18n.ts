export type SupportedLocale = "en" | "ar";

export type ErrorDefinition = {
	code: string;
	en: string;
	ar: string;
	status?: number;
};

// -------------------------------------------------------------
// 1. Field Name Translations (For Zod & Form Validation)
// -------------------------------------------------------------
export const FIELD_LABELS: Record<string, { en: string; ar: string }> = {
	title: { en: "Title", ar: "العنوان" },
	titleAr: { en: "Arabic Title", ar: "العنوان بالعربية" },
	content: { en: "Content", ar: "المحتوى" },
	contentAr: { en: "Arabic Content", ar: "المحتوى بالعربية" },
	slug: { en: "Slug", ar: "الرابط المخصص" },
	price: { en: "Price", ar: "السعر" },
	currency: { en: "Currency", ar: "العملة" },
	year: { en: "Year", ar: "سنة الصنع" },
	mileage: { en: "Mileage", ar: "المسافة المقطوعة" },
	condition: { en: "Condition", ar: "الحالة" },
	transmission: { en: "Transmission", ar: "ناقل الحركة" },
	fuelType: { en: "Fuel Type", ar: "نوع الوقود" },
	phone: { en: "Phone Number", ar: "رقم الهاتف" },
	email: { en: "Email", ar: "البريد الإلكتروني" },
	password: { en: "Password", ar: "كلمة المرور" },
	name: { en: "Name", ar: "الاسم" },
	nameEn: { en: "English Name", ar: "الاسم بالإنجليزية" },
	nameAr: { en: "Arabic Name", ar: "الاسم بالعربية" },
	code: { en: "Code", ar: "الرمز" },
	makeId: { en: "Make", ar: "الشركة المصنعة" },
	modelId: { en: "Model", ar: "الموديل" },
	categoryId: { en: "Category", ar: "القسم" },
	cityId: { en: "City", ar: "المدينة" },
	countryId: { en: "Country", ar: "الدولة" },
	districtId: { en: "District", ar: "الحي / المنطقة" },
	isActive: { en: "Active Status", ar: "حالة التفعيل" },
	packageId: { en: "Package", ar: "الباقة" },
	transactionId: { en: "Transaction ID", ar: "رقم المعاملة" },
	reason: { en: "Reason", ar: "السبب" },
	rating: { en: "Rating", ar: "التقييم" },
};

export function getFieldLabel(field: string, locale: SupportedLocale): string {
	const entry = FIELD_LABELS[field];
	if (entry) return locale === "ar" ? entry.ar : entry.en;
	return field;
}

// -------------------------------------------------------------
// 2. Interpolation Helper
// -------------------------------------------------------------
export function interpolate(template: string, params?: Record<string, string | number>): string {
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (_, key) => {
		return params[key] !== undefined ? String(params[key]) : `{${key}}`;
	});
}

// -------------------------------------------------------------
// 3. Canonical Error Definitions (Bilingual Dictionary)
// -------------------------------------------------------------
export const ERROR_DICTIONARY: Record<string, ErrorDefinition> = {
	// Authentication & Permissions
	UNAUTHORIZED: {
		code: "UNAUTHORIZED",
		en: "Unauthorized",
		ar: "غير مصرح لك بالوصول",
		status: 401,
	},
	FORBIDDEN: {
		code: "FORBIDDEN",
		en: "Forbidden",
		ar: "تم رفض الوصول",
		status: 403,
	},
	FORBIDDEN_BANNED: {
		code: "FORBIDDEN_BANNED",
		en: "Your account has been suspended",
		ar: "تم حظر هذا الحساب",
		status: 403,
	},
	ADMIN_REQUIRED: {
		code: "ADMIN_REQUIRED",
		en: "Forbidden: Admin role required",
		ar: "تم رفض الوصول: يتطلب صلاحيات المشرف",
		status: 403,
	},
	NOT_OWNER: {
		code: "NOT_OWNER",
		en: "Forbidden: You do not own this resource",
		ar: "تم رفض الوصول: لست صاحب هذا المورد",
		status: 403,
	},
	FORBIDDEN_LISTING_OWNER: {
		code: "FORBIDDEN_LISTING_OWNER",
		en: "Forbidden: You do not own this listing",
		ar: "تم رفض الوصول: لست صاحب هذا الإعلان",
		status: 403,
	},
	FORBIDDEN_PROFILE_OWNER: {
		code: "FORBIDDEN_PROFILE_OWNER",
		en: "Forbidden: You can only upload to your own profile",
		ar: "تم رفض الوصول: يمكنك الرفع إلى ملفك الشخصي فقط",
		status: 403,
	},

	// Resource Not Found / Inactive
	NOT_FOUND: {
		code: "NOT_FOUND",
		en: "Not found",
		ar: "العنصر غير موجود",
		status: 404,
	},
	LISTING_NOT_FOUND: {
		code: "LISTING_NOT_FOUND",
		en: "Listing not found",
		ar: "الإعلان غير موجود",
		status: 404,
	},
	LISTING_UNAVAILABLE: {
		code: "LISTING_UNAVAILABLE",
		en: "Listing is no longer available",
		ar: "هذا الإعلان لم يعد متاحاً",
		status: 410,
	},
	DEALERSHIP_NOT_FOUND: {
		code: "DEALERSHIP_NOT_FOUND",
		en: "Dealership not found",
		ar: "معرض السيارات غير موجود",
		status: 404,
	},
	WORKSHOP_NOT_FOUND: {
		code: "WORKSHOP_NOT_FOUND",
		en: "Workshop not found",
		ar: "الورشة غير موجودة",
		status: 404,
	},
	MECHANIC_NOT_FOUND: {
		code: "MECHANIC_NOT_FOUND",
		en: "Mechanic not found",
		ar: "فني الصيانة غير موجود",
		status: 404,
	},
	PAGE_NOT_FOUND: {
		code: "PAGE_NOT_FOUND",
		en: "Page not found",
		ar: "الصفحة المطلوبة غير موجودة",
		status: 404,
	},
	SHORT_LINK_NOT_FOUND: {
		code: "SHORT_LINK_NOT_FOUND",
		en: "Short link not found or expired",
		ar: "الرابط المختصر غير موجود أو انتهت صلاحيته",
		status: 404,
	},
	PAYMENT_NOT_FOUND: {
		code: "PAYMENT_NOT_FOUND",
		en: "Payment not found",
		ar: "بيانات الدفع غير موجودة",
		status: 404,
	},
	PACKAGE_NOT_FOUND: {
		code: "PACKAGE_NOT_FOUND",
		en: "Package not found",
		ar: "الباقة غير موجودة",
		status: 404,
	},
	REPORT_NOT_FOUND: {
		code: "REPORT_NOT_FOUND",
		en: "Report not found",
		ar: "البلاغ غير موجود",
		status: 404,
	},
	CATEGORY_NOT_FOUND: {
		code: "CATEGORY_NOT_FOUND",
		en: "Category not found",
		ar: "القسم غير موجود",
		status: 404,
	},
	MAKE_NOT_FOUND: {
		code: "MAKE_NOT_FOUND",
		en: "Make not found",
		ar: "الشركة المصنعة غير موجودة",
		status: 404,
	},
	MODEL_NOT_FOUND: {
		code: "MODEL_NOT_FOUND",
		en: "Model not found",
		ar: "الموديل غير موجود",
		status: 404,
	},
	COUNTRY_NOT_FOUND: {
		code: "COUNTRY_NOT_FOUND",
		en: "Country not found",
		ar: "الدولة غير موجودة",
		status: 404,
	},
	CITY_NOT_FOUND: {
		code: "CITY_NOT_FOUND",
		en: "City not found",
		ar: "المدينة غير موجودة",
		status: 404,
	},
	DISTRICT_NOT_FOUND: {
		code: "DISTRICT_NOT_FOUND",
		en: "District not found",
		ar: "الحي / المنطقة غير موجودة",
		status: 404,
	},
	LISTING_GONE: {
		code: "LISTING_GONE",
		en: "Listing is no longer available",
		ar: "هذا الإعلان لم يعد متاحاً",
		status: 410,
	},
	INVALID_ENTITY_TYPE: {
		code: "INVALID_ENTITY_TYPE",
		en: "Invalid entity type: {type}",
		ar: "نوع العنصر غير صالح: {type}",
		status: 400,
	},

	// Validation & Business Logic Errors
	VALIDATION_ERROR: {
		code: "VALIDATION_ERROR",
		en: "Validation error",
		ar: "خطأ في التحقق من صحة البيانات",
		status: 400,
	},
	INVALID_INPUT: {
		code: "INVALID_INPUT",
		en: "Invalid input",
		ar: "البيانات المدخلة غير صالحة",
		status: 400,
	},
	SLUG_ALREADY_EXISTS: {
		code: "SLUG_ALREADY_EXISTS",
		en: "A page with this slug already exists",
		ar: "يوجد صفحة أخرى تستخدم هذا الرابط المخصص بالفعل",
		status: 409,
	},
	CANNOT_DELETE_PROTECTED_PAGE: {
		code: "CANNOT_DELETE_PROTECTED_PAGE",
		en: "This page cannot be deleted. Deactivate it instead.",
		ar: "لا يمكن حذف هذه الصفحة القانونية، يمكنك إلغاء تفعيلها بدلاً من ذلك.",
		status: 403,
	},
	BILINGUAL_REQUIRED_ON_PUBLISH: {
		code: "BILINGUAL_REQUIRED_ON_PUBLISH",
		en: "Published pages (isActive: true) must include both Arabic and English title and content",
		ar: "يجب تعبئة المحتوى باللغتين العربية والإنجليزية لنشر الصفحة",
		status: 400,
	},
	CANNOT_MESSAGE_SELF: {
		code: "CANNOT_MESSAGE_SELF",
		en: "Cannot message yourself",
		ar: "لا يمكنك مراسلة نفسك",
		status: 400,
	},
	PAYMENT_NOT_PENDING: {
		code: "PAYMENT_NOT_PENDING",
		en: "Payment is not pending",
		ar: "العملية ليست معلقة",
		status: 400,
	},
	INVALID_PURPOSE: {
		code: "INVALID_PURPOSE",
		en: "Invalid purpose",
		ar: "الغرض غير صالح",
		status: 400,
	},

	// Rate Limiting & Monetization
	TOO_MANY_REQUESTS: {
		code: "TOO_MANY_REQUESTS",
		en: "Too Many Requests",
		ar: "طلبات كثيرة جداً، يرجى المحاولة لاحقاً",
		status: 429,
	},
	RATE_LIMIT_SIGNATURE: {
		code: "RATE_LIMIT_SIGNATURE",
		en: "Too Many Requests. Signature rate limit exceeded.",
		ar: "تم تجاوز الحد المسموح به لطلبات رفع الوسائط، يرجى الانتظار دقيقة والمحاولة مجدداً.",
		status: 429,
	},
	LISTING_LIMIT_REACHED: {
		code: "LISTING_LIMIT_REACHED",
		en: "Listing limit reached. Please upgrade your subscription.",
		ar: "لقد استهلكت الحد الأقصى لنشر الإعلانات في باقتك، يرجى الترقية للاستمرار.",
		status: 403,
	},

	// System Errors
	INTERNAL_SERVER_ERROR: {
		code: "INTERNAL_SERVER_ERROR",
		en: "Internal Server Error",
		ar: "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً",
		status: 500,
	},
};

// -------------------------------------------------------------
// 4. Reverse String Map (English phrase -> ErrorDefinition)
// -------------------------------------------------------------
const REVERSE_STRING_MAP = new Map<string, ErrorDefinition>();

for (const def of Object.values(ERROR_DICTIONARY)) {
	REVERSE_STRING_MAP.set(def.en.toLowerCase().trim(), def);
	REVERSE_STRING_MAP.set(def.code.toLowerCase().trim(), def);
}

// Common string variations
REVERSE_STRING_MAP.set("unauthorized", ERROR_DICTIONARY.UNAUTHORIZED);
REVERSE_STRING_MAP.set("forbidden", ERROR_DICTIONARY.FORBIDDEN);
REVERSE_STRING_MAP.set("not found", ERROR_DICTIONARY.NOT_FOUND);
REVERSE_STRING_MAP.set("listing not found", ERROR_DICTIONARY.LISTING_NOT_FOUND);
REVERSE_STRING_MAP.set("listing is no longer available", ERROR_DICTIONARY.LISTING_UNAVAILABLE);
REVERSE_STRING_MAP.set("dealership not found", ERROR_DICTIONARY.DEALERSHIP_NOT_FOUND);
REVERSE_STRING_MAP.set("workshop not found", ERROR_DICTIONARY.WORKSHOP_NOT_FOUND);
REVERSE_STRING_MAP.set("mechanic not found", ERROR_DICTIONARY.MECHANIC_NOT_FOUND);
REVERSE_STRING_MAP.set("page not found", ERROR_DICTIONARY.PAGE_NOT_FOUND);
REVERSE_STRING_MAP.set("too many requests", ERROR_DICTIONARY.TOO_MANY_REQUESTS);
REVERSE_STRING_MAP.set("too many requests. signature rate limit exceeded.", ERROR_DICTIONARY.RATE_LIMIT_SIGNATURE);
REVERSE_STRING_MAP.set("forbidden: you do not own this listing", ERROR_DICTIONARY.FORBIDDEN_LISTING_OWNER);
REVERSE_STRING_MAP.set("forbidden: you can only upload to your own profile", ERROR_DICTIONARY.FORBIDDEN_PROFILE_OWNER);
REVERSE_STRING_MAP.set("forbidden: admin role required for cms assets", ERROR_DICTIONARY.ADMIN_REQUIRED);
REVERSE_STRING_MAP.set("forbidden: admin role required", ERROR_DICTIONARY.ADMIN_REQUIRED);
REVERSE_STRING_MAP.set("this page cannot be deleted. deactivate it instead.", ERROR_DICTIONARY.CANNOT_DELETE_PROTECTED_PAGE);
REVERSE_STRING_MAP.set("a page with this slug already exists", ERROR_DICTIONARY.SLUG_ALREADY_EXISTS);
REVERSE_STRING_MAP.set("listing limit reached. please upgrade your subscription.", ERROR_DICTIONARY.LISTING_LIMIT_REACHED);

/**
 * Parses request to determine preferred locale.
 * Priority:
 * 1. Query parameter: `?lang=` or `?locale=`
 * 2. Accept-Language header (RFC 9110 / RFC 4647 with q-factor weighting)
 * 3. Default fallback: 'en'
 */
export function resolveLocale(req: { header: (name: string) => string | undefined; query: (name: string) => string | undefined }): SupportedLocale {
	// 1. Query parameter override
	const queryLang = req.query("lang") || req.query("locale");
	if (queryLang) {
		const clean = queryLang.toLowerCase().trim();
		if (clean.startsWith("ar")) return "ar";
		if (clean.startsWith("en")) return "en";
	}

	// 2. Accept-Language header parsing
	const acceptLang = req.header("accept-language");
	if (acceptLang) {
		const parts = acceptLang.split(",").map((part) => {
			const [tag, qVal] = part.trim().split(";q=");
			return {
				tag: tag.trim().toLowerCase(),
				q: qVal ? parseFloat(qVal) : 1.0,
			};
		}).filter((item) => !isNaN(item.q) && item.q > 0);

		// Sort by q-value descending
		parts.sort((a, b) => b.q - a.q);

		for (const { tag } of parts) {
			if (tag === "*" || tag.startsWith("en")) return "en";
			if (tag.startsWith("ar")) return "ar";
		}
	}

	// 3. Default fallback
	return "en";
}

/**
 * Localizes an error message and extracts its canonical machine-readable code.
 * Supports dynamic interpolation parameters.
 */
export function localizeError(
	rawError: string,
	locale: SupportedLocale,
	params?: Record<string, string | number>
): { error: string; code: string } {
	if (!rawError || typeof rawError !== "string") {
		return {
			error: locale === "ar" ? ERROR_DICTIONARY.INTERNAL_SERVER_ERROR.ar : ERROR_DICTIONARY.INTERNAL_SERVER_ERROR.en,
			code: "INTERNAL_SERVER_ERROR",
		};
	}

	const normalized = rawError.toLowerCase().trim();
	const def = REVERSE_STRING_MAP.get(normalized) || ERROR_DICTIONARY[rawError.toUpperCase()];

	if (def) {
		const baseText = locale === "ar" ? def.ar : def.en;
		return {
			error: interpolate(baseText, params),
			code: def.code,
		};
	}

	// Dynamic regex pattern matches
	const slugMatch = rawError.match(/^a page with this slug ['"]?(.+?)['"]? already exists$/i);
	if (slugMatch) {
		const slugVal = slugMatch[1];
		return {
			error: locale === "ar" ? `يوجد صفحة أخرى تستخدم الرابط '${slugVal}' بالفعل` : rawError,
			code: "SLUG_ALREADY_EXISTS",
		};
	}

	const seoMatch = rawError.match(/^invalid seo entity type:\s*(.+)$/i);
	if (seoMatch) {
		const typeVal = seoMatch[1];
		return {
			error: locale === "ar" ? `نوع كيان محركات البحث غير صالح: ${typeVal}` : rawError,
			code: "INVALID_SEO_TYPE",
		};
	}

	// Default fallback with code generated from string
	const fallbackCode = rawError
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "") || "UNKNOWN_ERROR";

	return {
		error: interpolate(rawError, params),
		code: fallbackCode,
	};
}

// -------------------------------------------------------------
// 5. Dynamic Zod Validation Error Localizer
// -------------------------------------------------------------
export type ZodIssueLike = {
	code: string;
	path: (string | number)[];
	message?: string;
	expected?: string;
	received?: string;
	minimum?: number;
	maximum?: number;
	type?: string;
	origin?: string;
	format?: string;
	validation?: string;
	options?: string[];
	[key: string]: any;
};

/**
 * Localizes a single Zod issue object into a human-friendly sentence.
 */
export function localizeZodIssue(issue: ZodIssueLike, locale: SupportedLocale): { field: string; message: string; code: string } {
	const field = issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : "value";
	const label = getFieldLabel(field, locale);

	let localizedMessage = issue.message || "Invalid value";

	switch (issue.code) {
		case "invalid_type":
			if (issue.received === "undefined") {
				localizedMessage = locale === "ar" ? `حقل '${label}' مطلوب` : `Field '${label}' is required`;
			} else {
				localizedMessage = locale === "ar" ? `نوع البيانات المدخلة في '${label}' غير صالح` : `Invalid type for field '${label}'`;
			}
			break;

		case "too_small":
			if (issue.origin === "string" || issue.type === "string") {
				localizedMessage =
					locale === "ar"
						? `يجب أن يحتوي '${label}' على ${issue.minimum} أحرف على الأقل`
						: `Field '${label}' must contain at least ${issue.minimum} character(s)`;
			} else if (issue.origin === "number" || issue.type === "number") {
				localizedMessage =
					locale === "ar"
						? `يجب أن تكون قيمة '${label}' أكبر من أو تساوي ${issue.minimum}`
						: `Field '${label}' must be greater than or equal to ${issue.minimum}`;
			}
			break;

		case "too_big":
			if (issue.origin === "string" || issue.type === "string") {
				localizedMessage =
					locale === "ar"
						? `يجب ألا يتجاوز '${label}' ${issue.maximum} حرفاً`
						: `Field '${label}' must not exceed ${issue.maximum} characters`;
			} else if (issue.origin === "number" || issue.type === "number") {
				localizedMessage =
					locale === "ar"
						? `يجب أن تكون قيمة '${label}' أقل من أو تساوي ${issue.maximum}`
						: `Field '${label}' must be less than or equal to ${issue.maximum}`;
			}
			break;

		case "invalid_format":
		case "invalid_string":
			if (issue.validation === "email" || issue.format === "email") {
				localizedMessage = locale === "ar" ? `صيغة البريد الإلكتروني غير صالحة` : `Invalid email address`;
			} else if (issue.validation === "regex" || issue.format === "regex") {
				if (field === "slug") {
					localizedMessage =
						locale === "ar"
							? `يجب أن يحتوي الرابط على أحرف إنجليزية صغيرة وأرقام وشرطات فقط`
							: `Slug must contain only lowercase alphanumeric characters and hyphens`;
				} else {
					localizedMessage = locale === "ar" ? `صيغة حقل '${label}' غير صالحة` : `Invalid format for '${label}'`;
				}
			}
			break;

		case "invalid_enum_value":
			const opts = issue.options ? issue.options.join(", ") : "";
			localizedMessage =
				locale === "ar"
					? `القيمة المدخلة في '${label}' غير صالحة. الخيارات المتاحة: ${opts}`
					: `Invalid value for '${label}'. Allowed options: ${opts}`;
			break;

		case "custom":
			if (issue.message) {
				const loc = localizeError(issue.message, locale);
				localizedMessage = loc.error;
			}
			break;
	}

	return {
		field,
		message: localizedMessage,
		code: issue.code.toUpperCase(),
	};
}

/**
 * Localizes an array of Zod issues or validation errors.
 */
export function formatZodValidationErrors(
	issues: ZodIssueLike[],
	locale: SupportedLocale
): { error: string; code: string; details: Array<{ field: string; message: string; code: string }> } {
	const localizedDetails = issues.map((issue) => localizeZodIssue(issue, locale));
	const primaryMessage =
		locale === "ar"
			? `خطأ في التحقق من صحة البيانات: ${localizedDetails[0]?.message || "مدخلات غير صالحة"}`
			: `Validation error: ${localizedDetails[0]?.message || "Invalid input"}`;

	return {
		error: primaryMessage,
		code: "VALIDATION_ERROR",
		details: localizedDetails,
	};
}

/**
 * Shorthand helper to translate a dictionary error key or raw string.
 */
export function t(errorKey: string, locale: SupportedLocale = "en"): string {
	return localizeError(errorKey, locale).error;
}
