# Sayaratak API — Complete Endpoints Reference

| Module | Method | Endpoint | Auth Required | Description / Key Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/sign-up/email` | Public | Register new account (`email`, `password`, `name`, `accountType`) |
| **Auth** | `POST` | `/api/auth/sign-in/email` | Public | Log in with credentials; sets `better-auth.session_token` cookie |
| **Auth** | `GET` | `/api/auth/get-session` | Session Cookie | Return authenticated user details and active session |
| **Auth** | `POST` | `/api/auth/sign-out` | Session Cookie | Log out user and invalidate session cookie |
| **Auth** | `POST` | `/api/auth/send-verification-email` | Public | Send or re-send verification link to email (`email`, `callbackURL?`) |
| **Auth** | `GET` | `/api/auth/verify-email` | Public | Verify email from token link (`?token=...`, `?callbackURL=...`) |
| **Auth** | `POST` | `/api/auth/request-password-reset` | Public | Send password reset email (`email`, `redirectTo?`) |
| **Auth** | `POST` | `/api/auth/reset-password` | Public | Submit new password using reset token (`token`, `newPassword`) |
| **Auth** | `POST` | `/api/auth/change-password` | Session Cookie | Update password (`currentPassword`, `newPassword`, `revokeOtherSessions?`) |
| **Auth** | `POST` | `/api/auth/change-email` | Session Cookie | Request email address update (`newEmail`, `callbackURL?`) |
| **Auth** | `POST` | `/api/auth/sign-in/social` | Public | Initiate OAuth login (`provider: "google" \| "facebook"`, `callbackURL?`) |
| **Listings** | `GET` | `/api/v1/listings` | Public | Search/filter listings (`makeId`, `modelId`, `cityId`, `minPrice`, `maxPrice`, `year`, `lat`, `lng`, `radiusKm`, `page`, `limit`) |
| **Listings** | `POST` | `/api/v1/listings` | Session Cookie | Create new vehicle listing (`title`, `price`, `makeId`, `modelId`, `cityId`, `year`, `media[]`, etc.) |
| **Listings** | `GET` | `/api/v1/listings/:id` | Public | Get single listing details with seller profile |
| **Listings** | `PUT` | `/api/v1/listings/:id` | Owner Only | Update listing fields (price, description, specs, media) |
| **Listings** | `DELETE` | `/api/v1/listings/:id` | Owner Only | Delete listing and clean associated Cloudinary assets |
| **Listings** | `PATCH` | `/api/v1/listings/:id/status` | Owner Only | Update status (`available`, `reserved`, `sold`) |
| **Listings** | `POST` | `/api/v1/listings/:id/clicks` | Public | Track view or contact click (`type: "view" \| "phone" \| "whatsapp"`); filters bots |
| **Listings** | `GET` | `/api/v1/listings/map` | Public | PostGIS spatial clusters (`zoom`, `bounds: minLng,minLat,maxLng,maxLat`) |
| **Profiles** | `GET` | `/api/v1/profiles/:type/:id` | Public | Get business profile (`type: "dealership" \| "workshop" \| "mechanic"`, `id`) |
| **Profiles** | `PATCH` | `/api/v1/profiles/:type` | Owner Only | Update profile; automatically cleans replaced Cloudinary images |
| **Taxonomy** | `GET` | `/api/v1/taxonomy/categories` | Public | List vehicle categories (Sedan, SUV, Pickup, etc.) |
| **Taxonomy** | `GET` | `/api/v1/taxonomy/makes` | Public | List vehicle manufacturers (Toyota, Hyundai, Nissan, etc.) |
| **Taxonomy** | `GET` | `/api/v1/taxonomy/makes/:makeId/models` | Public | List models belonging to a specific make |
| **Taxonomy** | `GET` | `/api/v1/taxonomy/models` | Public | List all models, with optional filter by `makeId` or `vehicleType` |
| **Locations** | `GET` | `/api/v1/locations/countries` | Public | List supported countries |
| **Locations** | `GET` | `/api/v1/locations/cities` | Public | List cities, optionally filtered by `?countryId=` |
| **Locations** | `GET` | `/api/v1/locations/districts` | Public | List districts, optionally filtered by `?cityId=` |
| **Media** | `POST` | `/api/v1/media/signature` | Session Cookie | Get signed Cloudinary upload params (`entityType`, `entityId`); Rate limited: 30/min |
| **Media** | `POST` | `/api/v1/media/verify` | Session Cookie | Verify uploaded asset public ID and attach to entity |
| **Chat** | `GET` | `/api/v1/chat` | Session Cookie | List conversations for authenticated user |
| **Chat** | `POST` | `/api/v1/chat` | Session Cookie | Start conversation on a listing (`listingId`); blocks self-messaging |
| **Chat** | `GET` | `/api/v1/chat/:id/messages` | Participant Only | Get chat message history for conversation |
| **Chat** | `POST` | `/api/v1/chat/:id/messages` | Participant Only | Send message (`content`); triggers FCM push; Rate limited: 60/min |
| **Chat** | `GET` | `/api/v1/chat/ws` | Public / Upgrade | Real-time WebSocket connection for live messages and typing |
| **Social & Share** | `POST` | `/api/v1/share/generate` | Public / User | Generate short link & share intents (`entityType`, `entityId`, `platform?`, `locale?`); Rate limited: 30/min |
| **Social & Share** | `GET` | `/api/s/:code` | Public | Short URL redirect handler (tracks human clicks, ignores bots, redirects 302 with UTM) |
| **Social & Share** | `GET` | `/api/v1/share/stats/:code` | Creator / Admin | View click count and impression metrics for short link |
| **Payments** | `GET` | `/api/v1/payments/packages` | Public | List subscription packages (`?roleTarget=dealership \| workshop \| mechanic \| user`) |
| **Payments** | `POST` | `/api/v1/payments/checkout` | Session Cookie | Initialize checkout intent (`purpose: "subscription" \| "featured_listing"`, `packageId?`, `listingId?`); Rate limited: 15/min |
| **Payments** | `POST` | `/api/v1/payments/:id/submit` | Owner Only | Submit manual Bankak transaction transfer ID (`transactionId`) |
| **Favorites** | `GET` | `/api/v1/favorites` | Session Cookie | List user's saved favorite listings with full listing details |
| **Favorites** | `POST` | `/api/v1/favorites/:listingId` | Session Cookie | Bookmark a listing |
| **Favorites** | `DELETE` | `/api/v1/favorites/:listingId` | Session Cookie | Remove listing from bookmarks |
| **Saved Searches**| `GET` | `/api/v1/saved-searches` | Session Cookie | List user's active search alerts |
| **Saved Searches**| `POST` | `/api/v1/saved-searches` | Session Cookie | Create saved search alert with criteria filters (`title`, `filters`) |
| **Saved Searches**| `DELETE` | `/api/v1/saved-searches/:id` | Owner Only | Delete a saved search alert |
| **Reviews** | `GET` | `/api/v1/reviews` | Public | List reviews (`?dealershipId=`, `?workshopId=`, `?mechanicId=`, `?userId=`) |
| **Reviews** | `POST` | `/api/v1/reviews` | Session Cookie | Submit 1–5 star rating and comment (`targetId`, `rating`, `comment?`) |
| **Reviews** | `PATCH` | `/api/v1/reviews/:id/reply` | Profile Owner | Merchant reply to customer review (`reply`) |
| **Reports** | `POST` | `/api/v1/reports` | Session Cookie | Report listing policy violation (`listingId?`, `reason`, `description?`) |
| **Reports** | `GET` | `/api/v1/reports` | Admin Only | List filed reports (`?status=pending \| resolved \| dismissed`) |
| **Reports** | `PATCH` | `/api/v1/reports/:id/resolve` | Admin Only | Resolve or dismiss report (`status`, `actionTaken?`) |
| **Notifications**| `GET` | `/api/v1/notifications` | Session Cookie | List user's notifications |
| **Notifications**| `PATCH` | `/api/v1/notifications/:id/read` | Owner Only | Mark notification as read |
| **Notifications**| `POST` | `/api/v1/notifications/token` | Session Cookie | Register Firebase Cloud Messaging (FCM) push token (`fcmToken`, `deviceType`) |
| **Content & CMS** | `GET` | `/api/v1/content/banners` | Public | Get currently active promotional banners within valid date range |
| **Content & CMS** | `GET` | `/api/v1/content/pages` | Public | List all active CMS pages |
| **Content & CMS** | `GET` | `/api/v1/content/pages/:slug` | Public | Fetch CMS page content by slug (e.g. `privacy-policy`, `terms`) |
| **SEO** | `GET` | `/api/v1/seo/metadata/:type/:identifier` | Public | Get canonical URL, OpenGraph tags, hreflang alternates, and JSON-LD schema (`?locale=`) |
| **SEO** | `GET` | `/api/v1/seo/sitemap.xml` | Public | XML sitemap index for search engines |
| **SEO** | `GET` | `/api/v1/seo/robots.txt` | Public | Crawler exclusion directives and sitemap link |
| **Admin** | `POST` | `/api/v1/admin/create` | Secret Header | Provision initial admin account (`Header: x-secret-key`, `email`, `password`, `name`) |
| **Admin** | `GET` | `/api/v1/admin/users` | Admin Only | List users with ban status and role |
| **Admin** | `PATCH` | `/api/v1/admin/users/:id/ban` | Admin Only | Ban/unban user and cascade banned status to their listings (`banned`, `banReason?`) |
| **Admin** | `GET` | `/api/v1/admin/listings` | Admin Only | List listings for moderation queue (`?status=`) |
| **Admin** | `PATCH` | `/api/v1/admin/listings/:id/moderate` | Admin Only | Moderate listing (`status: "available" \| "pending" \| "rejected" \| "banned"`) |
| **Admin** | `PATCH` | `/api/v1/admin/profiles/:type/:id/verify` | Admin Only | Grant or revoke verification badge for dealership/workshop/mechanic (`isVerified`) |
| **Admin** | `PATCH` | `/api/v1/admin/payments/:id/approve` | Admin Only | Approve Bankak payment; extends user subscription or activates featured listing |
| **Admin** | `POST` | `/api/v1/admin/notifications/broadcast` | Admin Only | Send system broadcast (`target: "all" \| "user" \| "dealership" \| "workshop" \| "mechanic"`, `title`, `body`) |
| **Admin** | `GET` | `/api/v1/admin/metrics` | Admin Only | Aggregated metrics: user counts, active listings, payment volumes, conversion rates |
| **Admin CRUD** | `GET/POST/PUT/DELETE` | `/api/v1/admin/banners[/:id]` | Admin Only | Full CRUD management for promotional banners |
| **Admin CRUD** | `GET/POST/PUT/DELETE` | `/api/v1/admin/pages[/:id]` | Admin Only | Full CRUD management for CMS pages; protects legal pages from hard deletion |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/locations/admin/countries[/:id]` | Admin Only | CRUD management for countries |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/locations/admin/cities[/:id]` | Admin Only | CRUD management for cities |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/locations/admin/districts[/:id]` | Admin Only | CRUD management for districts |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/taxonomy/admin/categories[/:id]` | Admin Only | CRUD management for categories; enforces Arabic name on active |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/taxonomy/admin/makes[/:id]` | Admin Only | CRUD management for vehicle makes; enforces Arabic name on active |
| **Admin CRUD** | `POST/PATCH/DELETE` | `/api/v1/taxonomy/admin/models[/:id]` | Admin Only | CRUD management for vehicle models; enforces Arabic name on active |
| **Docs** | `GET` | `/api/docs` | Public | Interactive Swagger UI in browser |
| **Docs** | `GET` | `/api/openapi.json` | Public | Raw OpenAPI 3.0 JSON specification for Postman / Swagger |
