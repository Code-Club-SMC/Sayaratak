export const openApiSpec = {
	openapi: "3.0.3",
	info: {
		title: "Sayaratak API",
		version: "1.0.0",
		description: "Production REST & WebSocket API specification for the Sayaratak automotive marketplace platform.",
		contact: {
			name: "Sayaratak Engineering",
			email: "dev@sayaratak.com",
		},
	},
	servers: [
		{
			url: "http://localhost:8000/api",
			description: "Local development API server",
		},
		{
			url: "https://api.sayaratak.com/api",
			description: "Production API server",
		},
	],
	components: {
		securitySchemes: {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "better-auth.session_token",
				description: "Better Auth session cookie provided upon login",
			},
			adminSecret: {
				type: "apiKey",
				in: "header",
				name: "x-secret-key",
				description: "Bootstrap secret key for administrative provisioning",
			},
		},
		schemas: {
			ErrorResponse: {
				type: "object",
				required: ["error", "code"],
				properties: {
					error: { type: "string", description: "Human-readable error message (localized via Accept-Language or ?locale=)" },
					code: { type: "string", description: "Machine-readable canonical error code" },
					details: { type: "object", description: "Validation issue details (if applicable)" },
				},
			},
			User: {
				type: "object",
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					email: { type: "string", format: "email" },
					role: { type: "string", enum: ["user", "admin"] },
					accountType: { type: "string", enum: ["user", "dealership", "workshop", "mechanic"] },
					banned: { type: "boolean" },
					banReason: { type: "string", nullable: true },
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			Country: {
				type: "object",
				properties: {
					id: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					code: { type: "string", example: "SD" },
					currencyCode: { type: "string", example: "SDG" },
					phoneCode: { type: "string", example: "+249" },
					isActive: { type: "boolean" },
				},
			},
			City: {
				type: "object",
				properties: {
					id: { type: "string" },
					countryId: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					isActive: { type: "boolean" },
				},
			},
			District: {
				type: "object",
				properties: {
					id: { type: "string" },
					cityId: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					isActive: { type: "boolean" },
				},
			},
			Category: {
				type: "object",
				properties: {
					id: { type: "string" },
					slug: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					icon: { type: "string", nullable: true },
					isActive: { type: "boolean" },
				},
			},
			Make: {
				type: "object",
				properties: {
					id: { type: "string" },
					slug: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					logoUrl: { type: "string", nullable: true },
					isPopular: { type: "boolean" },
					isActive: { type: "boolean" },
				},
			},
			Model: {
				type: "object",
				properties: {
					id: { type: "string" },
					makeId: { type: "string" },
					slug: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					vehicleType: { type: "string", enum: ["car", "motorcycle", "truck", "heavy_equipment"] },
					isActive: { type: "boolean" },
				},
			},
			Listing: {
				type: "object",
				properties: {
					id: { type: "string", format: "uuid" },
					userId: { type: "string" },
					categoryId: { type: "string" },
					makeId: { type: "string" },
					modelId: { type: "string" },
					countryId: { type: "string" },
					cityId: { type: "string" },
					districtId: { type: "string", nullable: true },
					title: { type: "string" },
					description: { type: "string" },
					price: { type: "number" },
					currency: { type: "string", default: "SDG" },
					rentalPeriod: { type: "string", enum: ["day", "week", "month"], nullable: true },
					status: { type: "string", enum: ["available", "pending", "reserved", "sold", "banned"] },
					lat: { type: "number", nullable: true },
					lng: { type: "number", nullable: true },
					isFeatured: { type: "boolean" },
					year: { type: "integer" },
					mileage: { type: "integer" },
					transmission: { type: "string", enum: ["Automatic", "Manual"] },
					fuelType: { type: "string", enum: ["Petrol", "Diesel", "Hybrid", "Electric"] },
					condition: { type: "string", enum: ["New", "Used"] },
					viewCount: { type: "integer" },
					phoneClickCount: { type: "integer" },
					whatsappClickCount: { type: "integer" },
					favoriteCount: { type: "integer" },
					shareCount: { type: "integer" },
					shareClickCount: { type: "integer" },
					specs: { type: "object" },
					media: {
						type: "array",
						items: {
							type: "object",
							properties: {
								url: { type: "string" },
								isPrimary: { type: "boolean" },
								publicId: { type: "string" },
							},
						},
					},
					createdAt: { type: "string", format: "date-time" },
					updatedAt: { type: "string", format: "date-time" },
				},
			},
			CreateListingInput: {
				type: "object",
				required: ["categoryId", "makeId", "modelId", "countryId", "cityId", "title", "description", "price", "year", "transmission", "fuelType", "condition"],
				properties: {
					categoryId: { type: "string" },
					makeId: { type: "string" },
					modelId: { type: "string" },
					countryId: { type: "string" },
					cityId: { type: "string" },
					districtId: { type: "string" },
					title: { type: "string", minLength: 5 },
					description: { type: "string", minLength: 10 },
					price: { type: "number", minimum: 1 },
					currency: { type: "string", default: "SDG" },
					rentalPeriod: { type: "string", enum: ["day", "week", "month"] },
					lat: { type: "number" },
					lng: { type: "number" },
					year: { type: "integer", minimum: 1900 },
					mileage: { type: "integer", minimum: 0 },
					transmission: { type: "string", enum: ["Automatic", "Manual"] },
					fuelType: { type: "string", enum: ["Petrol", "Diesel", "Hybrid", "Electric"] },
					condition: { type: "string", enum: ["New", "Used"] },
					specs: { type: "object" },
					media: {
						type: "array",
						items: {
							type: "object",
							required: ["url"],
							properties: {
								url: { type: "string" },
								isPrimary: { type: "boolean" },
								publicId: { type: "string" },
							},
						},
					},
				},
			},
			Profile: {
				type: "object",
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					description: { type: "string", nullable: true },
					phone: { type: "string", nullable: true },
					address: { type: "string", nullable: true },
					cityId: { type: "string", nullable: true },
					districtId: { type: "string", nullable: true },
					logoUrl: { type: "string", nullable: true },
					coverUrl: { type: "string", nullable: true },
					profilePicUrl: { type: "string", nullable: true },
					isVerified: { type: "boolean" },
					ratingAvg: { type: "number" },
					ratingCount: { type: "integer" },
					workingHours: { type: "object", nullable: true },
					images: { type: "array", items: { type: "string" } },
					portfolioImages: { type: "array", items: { type: "string" } },
					specialization: { type: "string", nullable: true },
					yearsExperience: { type: "integer", nullable: true },
				},
			},
			Banner: {
				type: "object",
				properties: {
					id: { type: "string" },
					title: { type: "string" },
					imageUrl: { type: "string" },
					targetUrl: { type: "string", nullable: true },
					placement: { type: "string", enum: ["home_hero", "listings_top", "search_sidebar"] },
					startDate: { type: "string", format: "date-time" },
					endDate: { type: "string", format: "date-time" },
					isActive: { type: "boolean" },
				},
			},
			Page: {
				type: "object",
				properties: {
					id: { type: "string" },
					slug: { type: "string" },
					title: { type: "string" },
					titleAr: { type: "string", nullable: true },
					content: { type: "string" },
					contentAr: { type: "string", nullable: true },
					isActive: { type: "boolean" },
				},
			},
			SubscriptionPackage: {
				type: "object",
				properties: {
					id: { type: "string" },
					nameEn: { type: "string" },
					nameAr: { type: "string" },
					price: { type: "number" },
					currency: { type: "string" },
					durationDays: { type: "integer" },
					listingLimit: { type: "integer" },
					featuredLimit: { type: "integer" },
					roleTarget: { type: "string", enum: ["dealership", "workshop", "mechanic", "user"] },
					isActive: { type: "boolean" },
				},
			},
			ChatMessage: {
				type: "object",
				properties: {
					id: { type: "string" },
					conversationId: { type: "string" },
					senderId: { type: "string" },
					content: { type: "string" },
					createdAt: { type: "string", format: "date-time" },
				},
			},
			Review: {
				type: "object",
				properties: {
					id: { type: "string" },
					userId: { type: "string" },
					dealershipId: { type: "string", nullable: true },
					workshopId: { type: "string", nullable: true },
					mechanicId: { type: "string", nullable: true },
					rating: { type: "integer", minimum: 1, maximum: 5 },
					comment: { type: "string", nullable: true },
					reply: { type: "string", nullable: true },
					repliedAt: { type: "string", format: "date-time", nullable: true },
					createdAt: { type: "string", format: "date-time" },
				},
			},
		},
		responses: {
			BadRequest: {
				description: "Validation error or invalid request payload",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			Unauthorized: {
				description: "Missing or invalid session credentials",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			Forbidden: {
				description: "Insufficient permissions or unauthorized resource access",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			NotFound: {
				description: "Requested resource was not found",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
			TooManyRequests: {
				description: "Per-user or per-IP rate limit exceeded",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
		},
	},
	tags: [
		{ name: "Auth", description: "Better Auth session management and credentials" },
		{ name: "Listings", description: "Search, spatial clusters, filtering, details, and listing lifecycle" },
		{ name: "Profiles", description: "Dealerships, workshops, and mechanics profiles and portfolio management" },
		{ name: "Taxonomy", description: "Categories, vehicle makes, and models" },
		{ name: "Locations", description: "Countries, cities, and municipal districts" },
		{ name: "Chat", description: "Direct buyer-seller messaging, message history, and real-time WebSockets" },
		{ name: "Media", description: "Signed Cloudinary upload authorizations and verification" },
		{ name: "Social & Deep Links", description: "Short URLs, platform-specific share intents, and click tracking" },
		{ name: "Payments & Monetization", description: "Subscription packages, listing feature checkout, and Bankak verification" },
		{ name: "Favorites", description: "User saved listings and watchlists" },
		{ name: "Saved Searches", description: "Custom search alerts with background notification matching" },
		{ name: "Reviews", description: "Ratings, feedback, and owner replies for business profiles" },
		{ name: "Reports", description: "Flagging suspicious listings or policy violations" },
		{ name: "Notifications", description: "In-app notifications and Firebase Cloud Messaging (FCM) device registration" },
		{ name: "Content & CMS", description: "Promotional hero banners and localized content pages" },
		{ name: "SEO", description: "OpenGraph metadata, Schema.org JSON-LD, sitemaps, and robots.txt" },
		{ name: "Admin", description: "Management portal, user bans, listing moderation, broadcast alerts, and analytics" },
	],
	paths: {
		// ==========================================
		// AUTHENTICATION
		// ==========================================
		"/auth/sign-up/email": {
			post: {
				tags: ["Auth"],
				summary: "Register a new user account",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email", "password", "name"],
								properties: {
									email: { type: "string", format: "email" },
									password: { type: "string", minLength: 8 },
									name: { type: "string" },
									accountType: { type: "string", enum: ["user", "dealership", "workshop", "mechanic"], default: "user" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "User registered and session created" },
					400: { $ref: "#/components/responses/BadRequest" },
				},
			},
		},
		"/auth/sign-in/email": {
			post: {
				tags: ["Auth"],
				summary: "Log in with email and password",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email", "password"],
								properties: {
									email: { type: "string", format: "email" },
									password: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Logged in successfully, sets better-auth.session_token cookie" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/auth/get-session": {
			get: {
				tags: ["Auth"],
				summary: "Get current authenticated session and user details",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "Active session and user object" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/auth/sign-out": {
			post: {
				tags: ["Auth"],
				summary: "Log out current user and clear session cookie",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "Session invalidated" },
				},
			},
		},
		"/auth/send-verification-email": {
			post: {
				tags: ["Auth"],
				summary: "Send or re-send email verification link to user",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email"],
								properties: {
									email: { type: "string", format: "email" },
									callbackURL: { type: "string", description: "Frontend redirect URL after verification" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Verification email dispatched" },
					400: { $ref: "#/components/responses/BadRequest" },
				},
			},
		},
		"/auth/verify-email": {
			get: {
				tags: ["Auth"],
				summary: "Verify user email address using token from email link",
				parameters: [
					{ name: "token", in: "query", required: true, schema: { type: "string" } },
					{ name: "callbackURL", in: "query", schema: { type: "string" } },
				],
				responses: {
					200: { description: "Email successfully verified" },
					302: { description: "Redirect to callbackURL" },
					400: { description: "Invalid or expired verification token" },
				},
			},
		},
		"/auth/request-password-reset": {
			post: {
				tags: ["Auth"],
				summary: "Request password reset email (also accessible via /auth/forget-password)",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email"],
								properties: {
									email: { type: "string", format: "email" },
									redirectTo: { type: "string", description: "Frontend URL where user enters new password" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Password reset email dispatched" },
					400: { $ref: "#/components/responses/BadRequest" },
				},
			},
		},
		"/auth/reset-password": {
			post: {
				tags: ["Auth"],
				summary: "Set new password using reset token from email",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["newPassword", "token"],
								properties: {
									newPassword: { type: "string", minLength: 8 },
									token: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Password reset successfully" },
					400: { description: "Invalid or expired token" },
				},
			},
		},
		"/auth/change-password": {
			post: {
				tags: ["Auth"],
				summary: "Change password for currently authenticated user",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["currentPassword", "newPassword"],
								properties: {
									currentPassword: { type: "string" },
									newPassword: { type: "string", minLength: 8 },
									revokeOtherSessions: { type: "boolean", default: true },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Password updated" },
					400: { description: "Incorrect current password" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/auth/change-email": {
			post: {
				tags: ["Auth"],
				summary: "Request email address change (sends confirmation to new address)",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["newEmail"],
								properties: {
									newEmail: { type: "string", format: "email" },
									callbackURL: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Confirmation email sent to new address" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/auth/sign-in/social": {
			post: {
				tags: ["Auth"],
				summary: "Initiate OAuth social login (Google, Facebook)",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["provider"],
								properties: {
									provider: { type: "string", enum: ["google", "facebook"] },
									callbackURL: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Returns authorization redirect URL" },
				},
			},
		},

		// ==========================================
		// LISTINGS
		// ==========================================
		"/v1/listings": {
			get: {
				tags: ["Listings"],
				summary: "Search, filter, and paginate vehicle listings",
				parameters: [
					{ name: "page", in: "query", schema: { type: "integer", default: 1 } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
					{ name: "makeId", in: "query", schema: { type: "string" } },
					{ name: "modelId", in: "query", schema: { type: "string" } },
					{ name: "categoryId", in: "query", schema: { type: "string" } },
					{ name: "countryId", in: "query", schema: { type: "string" } },
					{ name: "cityId", in: "query", schema: { type: "string" } },
					{ name: "districtId", in: "query", schema: { type: "string" } },
					{ name: "minPrice", in: "query", schema: { type: "number" } },
					{ name: "maxPrice", in: "query", schema: { type: "number" } },
					{ name: "currency", in: "query", schema: { type: "string", default: "SDG" } },
					{ name: "minYear", in: "query", schema: { type: "integer" } },
					{ name: "maxYear", in: "query", schema: { type: "integer" } },
					{ name: "transmission", in: "query", schema: { type: "string", enum: ["Automatic", "Manual"] } },
					{ name: "fuelType", in: "query", schema: { type: "string", enum: ["Petrol", "Diesel", "Hybrid", "Electric"] } },
					{ name: "condition", in: "query", schema: { type: "string", enum: ["New", "Used"] } },
					{ name: "rentalPeriod", in: "query", schema: { type: "string", enum: ["day", "week", "month"] } },
					{ name: "isFeatured", in: "query", schema: { type: "boolean" } },
					{ name: "lat", in: "query", schema: { type: "number" }, description: "Latitude for proximity search" },
					{ name: "lng", in: "query", schema: { type: "number" }, description: "Longitude for proximity search" },
					{ name: "radiusKm", in: "query", schema: { type: "number", default: 25 }, description: "Radius in kilometers" },
					{ name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "price", "year", "mileage"] } },
					{ name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
				],
				responses: {
					200: {
						description: "Array of listings matching filters",
						content: {
							"application/json": {
								schema: { type: "array", items: { $ref: "#/components/schemas/Listing" } },
							},
						},
					},
				},
			},
			post: {
				tags: ["Listings"],
				summary: "Create a new vehicle listing",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateListingInput" },
						},
					},
				},
				responses: {
					201: {
						description: "Listing created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Listing" },
							},
						},
					},
					400: { $ref: "#/components/responses/BadRequest" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/v1/listings/{id}": {
			get: {
				tags: ["Listings"],
				summary: "Get single listing details by UUID",
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
				],
				responses: {
					200: {
						description: "Listing with seller profile and related information",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Listing" },
							},
						},
					},
					404: { $ref: "#/components/responses/NotFound" },
					410: { description: "Listing is inactive or sold" },
				},
			},
			put: {
				tags: ["Listings"],
				summary: "Update existing listing (Owner only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateListingInput" },
						},
					},
				},
				responses: {
					200: { description: "Listing updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Listing" } } } },
					403: { $ref: "#/components/responses/Forbidden" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
			delete: {
				tags: ["Listings"],
				summary: "Delete listing and cascade Cloudinary asset cleanup (Owner only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
				],
				responses: {
					200: { description: "Listing deleted" },
					403: { $ref: "#/components/responses/Forbidden" },
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/v1/listings/{id}/status": {
			patch: {
				tags: ["Listings"],
				summary: "Update listing status (available, reserved, sold)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: { type: "string", enum: ["available", "reserved", "sold"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Status updated successfully" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/listings/{id}/clicks": {
			post: {
				tags: ["Listings"],
				summary: "Record impression or contact click (WhatsApp, Phone) — automatically filters crawlers/bots",
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["type"],
								properties: {
									type: { type: "string", enum: ["view", "phone", "whatsapp"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Click recorded" },
				},
			},
		},
		"/v1/listings/map": {
			get: {
				tags: ["Listings"],
				summary: "Fetch clustered map coordinates using PostGIS spatial clustering",
				parameters: [
					{ name: "zoom", in: "query", schema: { type: "integer", default: 10 } },
					{ name: "bounds", in: "query", schema: { type: "string" }, description: "Bounding box: minLng,minLat,maxLng,maxLat" },
				],
				responses: {
					200: { description: "GeoJSON / clustered coordinate clusters" },
				},
			},
		},

		// ==========================================
		// PROFILES
		// ==========================================
		"/v1/profiles/{type}/{id}": {
			get: {
				tags: ["Profiles"],
				summary: "Get public profile for dealership, workshop, or mechanic",
				parameters: [
					{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["dealership", "workshop", "mechanic"] } },
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: {
						description: "Business profile details",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Profile" },
							},
						},
					},
					404: { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/v1/profiles/{type}": {
			patch: {
				tags: ["Profiles"],
				summary: "Update business profile with automatic Cloudinary cleanup for replaced images (Owner only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["dealership", "workshop", "mechanic"] } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									name: { type: "string" },
									description: { type: "string" },
									phone: { type: "string" },
									address: { type: "string" },
									cityId: { type: "string" },
									districtId: { type: "string" },
									logoUrl: { type: "string" },
									coverUrl: { type: "string" },
									profilePicUrl: { type: "string" },
									workingHours: { type: "object" },
									images: { type: "array", items: { type: "string" } },
									portfolioImages: { type: "array", items: { type: "string" } },
									specialization: { type: "string" },
									yearsExperience: { type: "integer" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Profile updated" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},

		// ==========================================
		// TAXONOMY & LOCATIONS
		// ==========================
		"/v1/locations/countries": {
			get: {
				tags: ["Locations"],
				summary: "List supported countries",
				responses: {
					200: { description: "Array of countries", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Country" } } } } },
				},
			},
		},
		"/v1/locations/cities": {
			get: {
				tags: ["Locations"],
				summary: "List cities, optionally filtered by countryId",
				parameters: [
					{ name: "countryId", in: "query", schema: { type: "string" } },
				],
				responses: {
					200: { description: "Array of cities", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/City" } } } } },
				},
			},
		},
		"/v1/locations/districts": {
			get: {
				tags: ["Locations"],
				summary: "List districts, optionally filtered by cityId",
				parameters: [
					{ name: "cityId", in: "query", schema: { type: "string" } },
				],
				responses: {
					200: { description: "Array of districts", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/District" } } } } },
				},
			},
		},
		"/v1/taxonomy/categories": {
			get: {
				tags: ["Taxonomy"],
				summary: "List vehicle categories (Sedan, SUV, Truck, etc.)",
				responses: {
					200: { description: "Array of categories", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Category" } } } } },
				},
			},
		},
		"/v1/taxonomy/makes": {
			get: {
				tags: ["Taxonomy"],
				summary: "List vehicle makes/manufacturers (Toyota, Hyundai, etc.)",
				responses: {
					200: { description: "Array of makes", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Make" } } } } },
				},
			},
		},
		"/v1/taxonomy/makes/{makeId}/models": {
			get: {
				tags: ["Taxonomy"],
				summary: "List models belonging to a specific make",
				parameters: [
					{ name: "makeId", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Array of models for the specified make", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Model" } } } } },
				},
			},
		},
		"/v1/taxonomy/models": {
			get: {
				tags: ["Taxonomy"],
				summary: "List models with optional filtering by makeId and vehicleType",
				parameters: [
					{ name: "makeId", in: "query", schema: { type: "string" } },
					{ name: "vehicleType", in: "query", schema: { type: "string", enum: ["car", "motorcycle", "truck", "heavy_equipment"] } },
				],
				responses: {
					200: { description: "Array of models", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Model" } } } } },
				},
			},
		},

		// ==========================================
		// CHAT & MESSAGING
		// ==========================================
		"/v1/chat": {
			get: {
				tags: ["Chat"],
				summary: "List active conversations for the authenticated user",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "User conversations" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
			post: {
				tags: ["Chat"],
				summary: "Start a conversation on a listing (Buyer to Seller)",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["listingId"],
								properties: {
									listingId: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "New conversation initiated" },
					200: { description: "Existing conversation returned" },
					400: { description: "Self-messaging prohibited" },
					404: { description: "Listing not found" },
				},
			},
		},
		"/v1/chat/{id}/messages": {
			get: {
				tags: ["Chat"],
				summary: "Get chat message history for conversation (Participant only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Array of messages", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ChatMessage" } } } } },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
			post: {
				tags: ["Chat"],
				summary: "Send a message in conversation (Rate limited to 60 msgs/min, triggers FCM push)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["content"],
								properties: {
									content: { type: "string", minLength: 1 },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "Message sent", content: { "application/json": { schema: { $ref: "#/components/schemas/ChatMessage" } } } },
					403: { $ref: "#/components/responses/Forbidden" },
					429: { $ref: "#/components/responses/TooManyRequests" },
				},
			},
		},
		"/v1/chat/ws": {
			get: {
				tags: ["Chat"],
				summary: "WebSocket upgrade connection for real-time messaging",
				responses: {
					101: { description: "Switching protocols to WebSocket" },
				},
			},
		},

		// ==========================================
		// MEDIA
		// ==========================================
		"/v1/media/signature": {
			post: {
				tags: ["Media"],
				summary: "Request signed Cloudinary upload params (Rate limited to 30 req/min)",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["entityType", "entityId"],
								properties: {
									entityType: { type: "string", enum: ["listing", "profile", "page"] },
									entityId: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: "Upload parameters (timestamp, signature, apiKey, folder, cloudName)",
					},
					403: { description: "User does not own entityId" },
					429: { $ref: "#/components/responses/TooManyRequests" },
				},
			},
		},
		"/v1/media/verify": {
			post: {
				tags: ["Media"],
				summary: "Verify and register an uploaded Cloudinary asset",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["publicId", "entityType", "entityId"],
								properties: {
									publicId: { type: "string" },
									entityType: { type: "string", enum: ["listing", "profile", "page"] },
									entityId: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Asset verified" },
				},
			},
		},

		// ==========================================
		// SOCIAL & SHARE
		// ==========================================
		"/v1/share/generate": {
			post: {
				tags: ["Social & Deep Links"],
				summary: "Generate short link and social share intent URLs (WhatsApp, Telegram, etc.)",
				parameters: [
					{ name: "locale", in: "query", schema: { type: "string", enum: ["en", "ar"] } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["entityType", "entityId"],
								properties: {
									entityType: { type: "string", enum: ["listing", "dealership", "workshop", "mechanic", "page"] },
									entityId: { type: "string" },
									platform: { type: "string", enum: ["whatsapp", "telegram", "facebook", "twitter", "tiktok", "copy_link", "general"] },
									locale: { type: "string", enum: ["en", "ar"] },
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: "Short code, targetUrl, and platform intents with pre-filled localized text",
					},
					429: { $ref: "#/components/responses/TooManyRequests" },
				},
			},
		},
		"/s/{code}": {
			get: {
				tags: ["Social & Deep Links"],
				summary: "Short link redirect endpoint (Redirects 302 to entity page with UTM attribution; filters crawler unfurls)",
				parameters: [
					{ name: "code", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					302: { description: "Redirect to canonical entity page" },
					404: { description: "Invalid or expired short code" },
				},
			},
		},
		"/v1/share/stats/{code}": {
			get: {
				tags: ["Social & Deep Links"],
				summary: "Get click and impression analytics for short link",
				parameters: [
					{ name: "code", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Impression count and human click count" },
					403: { description: "Forbidden for private user-bound links" },
					404: { description: "Link not found" },
				},
			},
		},

		// ==========================================
		// PAYMENTS & MONETIZATION
		// ==========================================
		"/v1/payments/packages": {
			get: {
				tags: ["Payments & Monetization"],
				summary: "List available subscription packages",
				parameters: [
					{ name: "roleTarget", in: "query", schema: { type: "string", enum: ["dealership", "workshop", "mechanic", "user"] } },
				],
				responses: {
					200: {
						description: "Array of packages",
						content: {
							"application/json": {
								schema: { type: "array", items: { $ref: "#/components/schemas/SubscriptionPackage" } },
							},
						},
					},
				},
			},
		},
		"/v1/payments/checkout": {
			post: {
				tags: ["Payments & Monetization"],
				summary: "Initialize checkout intent for subscription or featured listing (Rate limited to 15 req/min)",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["purpose"],
								properties: {
									purpose: { type: "string", enum: ["subscription", "featured_listing"] },
									packageId: { type: "string", description: "Required if purpose is subscription" },
									listingId: { type: "string", description: "Required if purpose is featured_listing" },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "Pending payment intent created" },
					403: { description: "Ownership mismatch on listing" },
					429: { $ref: "#/components/responses/TooManyRequests" },
				},
			},
		},
		"/v1/payments/{id}/submit": {
			post: {
				tags: ["Payments & Monetization"],
				summary: "Submit Bankak payment transfer transaction ID for administrative review",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["transactionId"],
								properties: {
									transactionId: { type: "string", minLength: 4 },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Transaction ID submitted for verification" },
				},
			},
		},

		// ==========================================
		// FAVORITES
		// ==========================================
		"/v1/favorites": {
			get: {
				tags: ["Favorites"],
				summary: "Get user's bookmarked favorite listings",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "page", in: "query", schema: { type: "integer", default: 1 } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
				],
				responses: {
					200: { description: "Array of saved listings" },
					401: { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/v1/favorites/{listingId}": {
			post: {
				tags: ["Favorites"],
				summary: "Bookmark a listing",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "listingId", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Listing bookmarked" },
				},
			},
			delete: {
				tags: ["Favorites"],
				summary: "Remove listing from bookmarks",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "listingId", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Listing removed from favorites" },
				},
			},
		},

		// ==========================================
		// REVIEWS
		// ==========================================
		"/v1/reviews": {
			get: {
				tags: ["Reviews"],
				summary: "List reviews for a business profile (dealership, workshop, or mechanic)",
				parameters: [
					{ name: "dealershipId", in: "query", schema: { type: "string" } },
					{ name: "workshopId", in: "query", schema: { type: "string" } },
					{ name: "mechanicId", in: "query", schema: { type: "string" } },
					{ name: "userId", in: "query", schema: { type: "string" } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
				],
				responses: {
					200: { description: "Array of reviews", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } } },
				},
			},
			post: {
				tags: ["Reviews"],
				summary: "Submit a review and 1-5 star rating",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["rating"],
								properties: {
									dealershipId: { type: "string" },
									workshopId: { type: "string" },
									mechanicId: { type: "string" },
									rating: { type: "integer", minimum: 1, maximum: 5 },
									comment: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "Review submitted" },
				},
			},
		},
		"/v1/reviews/{id}/reply": {
			patch: {
				tags: ["Reviews"],
				summary: "Business owner reply to a customer review (Owner only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["reply"],
								properties: {
									reply: { type: "string", minLength: 1 },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Reply added to review" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},

		// ==========================================
		// REPORTS
		// ==========================================
		"/v1/reports": {
			post: {
				tags: ["Reports"],
				summary: "Report an offensive, fraudulent, or policy-violating listing",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["reason"],
								properties: {
									listingId: { type: "string" },
									reason: { type: "string" },
									description: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "Report submitted" },
				},
			},
			get: {
				tags: ["Reports"],
				summary: "List user reports for moderation (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "status", in: "query", schema: { type: "string", enum: ["pending", "resolved", "dismissed"] } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
				],
				responses: {
					200: { description: "Array of reports" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/reports/{id}/resolve": {
			patch: {
				tags: ["Reports"],
				summary: "Resolve or dismiss a report (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: { type: "string", enum: ["resolved", "dismissed"] },
									actionTaken: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Report resolved" },
				},
			},
		},

		// ==========================================
		// SAVED SEARCHES
		// ==========================================
		"/v1/saved-searches": {
			get: {
				tags: ["Saved Searches"],
				summary: "List user's saved search filters",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "Array of saved searches" },
				},
			},
			post: {
				tags: ["Saved Searches"],
				summary: "Create a saved search alert",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["title", "filters"],
								properties: {
									title: { type: "string" },
									filters: { type: "object" },
								},
							},
						},
					},
				},
				responses: {
					201: { description: "Saved search created" },
				},
			},
		},
		"/v1/saved-searches/{id}": {
			delete: {
				tags: ["Saved Searches"],
				summary: "Delete a saved search alert",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Saved search removed" },
				},
			},
		},

		// ==========================================
		// NOTIFICATIONS
		// ==========================================
		"/v1/notifications": {
			get: {
				tags: ["Notifications"],
				summary: "Get user's notifications list",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "Notifications array" },
				},
			},
		},
		"/v1/notifications/{id}/read": {
			patch: {
				tags: ["Notifications"],
				summary: "Mark a notification as read",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Notification marked read" },
				},
			},
		},
		"/v1/notifications/token": {
			post: {
				tags: ["Notifications"],
				summary: "Register device FCM push token",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["fcmToken", "deviceType"],
								properties: {
									fcmToken: { type: "string" },
									deviceType: { type: "string", enum: ["ios", "android", "web"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "FCM token saved" },
				},
			},
		},

		// ==========================================
		// CONTENT & CMS
		// ==========================================
		"/v1/content/banners": {
			get: {
				tags: ["Content & CMS"],
				summary: "Get currently active promotional banners",
				responses: {
					200: {
						description: "Active banners within valid date ranges",
						content: {
							"application/json": {
								schema: { type: "array", items: { $ref: "#/components/schemas/Banner" } },
							},
						},
					},
				},
			},
		},
		"/v1/content/pages": {
			get: {
				tags: ["Content & CMS"],
				summary: "List all published content pages",
				responses: {
					200: { description: "Array of published pages" },
				},
			},
		},
		"/v1/content/pages/{slug}": {
			get: {
				tags: ["Content & CMS"],
				summary: "Get content page by slug (Privacy Policy, Terms of Service, etc.)",
				parameters: [
					{ name: "slug", in: "path", required: true, schema: { type: "string" } },
				],
				responses: {
					200: { description: "Page content", content: { "application/json": { schema: { $ref: "#/components/schemas/Page" } } } },
					404: { description: "Page not found or inactive" },
				},
			},
		},

		// ==========================================
		// SEO
		// ==========================================
		"/v1/seo/metadata/{type}/{identifier}": {
			get: {
				tags: ["SEO"],
				summary: "Get OpenGraph tags, canonical URL, hreflang alternates, and JSON-LD structured data",
				parameters: [
					{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["listing", "dealer", "workshop", "mechanic", "category", "make", "page"] } },
					{ name: "identifier", in: "path", required: true, schema: { type: "string" }, description: "Slug or UUID per entity convention" },
					{ name: "locale", in: "query", schema: { type: "string", enum: ["en", "ar"], default: "en" } },
				],
				responses: {
					200: {
						description: "SEO metadata and schema.org markup",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										title: { type: "string" },
										description: { type: "string" },
										canonical: { type: "string" },
										alternates: { type: "array", items: { type: "object" } },
										og: { type: "object" },
										jsonLd: { type: "object" },
									},
								},
							},
						},
					},
					410: { description: "Sold/inactive resource (noindex header applied)" },
				},
			},
		},
		"/v1/seo/sitemap.xml": {
			get: {
				tags: ["SEO"],
				summary: "XML Sitemap index for search engine web crawlers",
				responses: {
					200: { description: "Sitemap XML", content: { "application/xml": { schema: { type: "string" } } } },
				},
			},
		},
		"/v1/seo/robots.txt": {
			get: {
				tags: ["SEO"],
				summary: "Robots exclusion directive file",
				responses: {
					200: { description: "Plain text robots.txt", content: { "text/plain": { schema: { type: "string" } } } },
				},
			},
		},

		// ==========================================
		// ADMIN MANAGEMENT
		// ==========================================
		"/v1/admin/create": {
			post: {
				tags: ["Admin"],
				summary: "Bootstrap initial admin account (Protected by secret key)",
				security: [{ adminSecret: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["email", "password", "name"],
								properties: {
									email: { type: "string", format: "email" },
									password: { type: "string" },
									name: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Admin user created" },
					401: { description: "Invalid x-secret-key header" },
				},
			},
		},
		"/v1/admin/users": {
			get: {
				tags: ["Admin"],
				summary: "List users with ban status and role (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "page", in: "query", schema: { type: "integer", default: 1 } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
				],
				responses: {
					200: { description: "Array of users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/users/{id}/ban": {
			patch: {
				tags: ["Admin"],
				summary: "Ban or unban a user and cascade status to their listings (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["banned"],
								properties: {
									banned: { type: "boolean" },
									banReason: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "User ban status updated" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/listings": {
			get: {
				tags: ["Admin"],
				summary: "List listings for moderation (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "page", in: "query", schema: { type: "integer", default: 1 } },
					{ name: "limit", in: "query", schema: { type: "integer", default: 20 } },
					{ name: "status", in: "query", schema: { type: "string", enum: ["available", "pending", "reserved", "sold", "banned"] } },
				],
				responses: {
					200: { description: "Listings list" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/listings/{id}/moderate": {
			patch: {
				tags: ["Admin"],
				summary: "Moderate a listing (approve, reject, ban) (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: { type: "string", enum: ["available", "pending", "rejected", "banned"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Listing moderated" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/profiles/{type}/{id}/verify": {
			patch: {
				tags: ["Admin"],
				summary: "Verify or revoke business badge for dealership, workshop, or mechanic (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["dealership", "workshop", "mechanic"] } },
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["isVerified"],
								properties: {
									isVerified: { type: "boolean" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Verification updated" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/payments/{id}/approve": {
			patch: {
				tags: ["Admin"],
				summary: "Approve or reject manual Bankak payment (Extends subscription or sets featured listing) (Admin only)",
				security: [{ cookieAuth: [] }],
				parameters: [
					{ name: "id", in: "path", required: true, schema: { type: "string" } },
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["status"],
								properties: {
									status: { type: "string", enum: ["completed", "failed"] },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Payment approved and subscription/feature activated" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/v1/admin/notifications/broadcast": {
			post: {
				tags: ["Admin"],
				summary: "Broadcast notification to all users or specific target roles (Admin only)",
				security: [{ cookieAuth: [] }],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								type: "object",
								required: ["target", "title", "body"],
								properties: {
									target: { type: "string", enum: ["all", "user", "dealership", "workshop", "mechanic"] },
									title: { type: "string" },
									body: { type: "string" },
								},
							},
						},
					},
				},
				responses: {
					200: { description: "Broadcast sent" },
					403: { $ref: "#/components/responses/Forbidden" },
					404: { description: "No users found for target role" },
				},
			},
		},
		"/v1/admin/metrics": {
			get: {
				tags: ["Admin"],
				summary: "Platform metrics: total users, active listings, payments volume, conversion rates (Admin only)",
				security: [{ cookieAuth: [] }],
				responses: {
					200: { description: "Platform aggregations" },
					403: { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
	},
};
