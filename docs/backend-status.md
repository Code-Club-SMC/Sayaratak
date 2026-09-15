# Sayaratak Backend — Project Status & Task Tracker

> Last updated: 2026-08-25

---

## ✅ Done

- [x] **Runtime & Infra** — Bun + Hono, Docker Compose (Postgres 18), Drizzle ORM, CORS
- [x] **Auth: Email/Password** — With styled HTML verification emails (EN/AR)
- [x] **Auth: Password Reset** — Email flow
- [x] **Auth: Google OAuth**
- [x] **Auth: Facebook OAuth**
- [x] **Auth: Role System** — `user` / `admin` on `user.role`
- [x] **Auth: Account Types** — `user` / `dealership` / `workshop` / `mechanic`
- [x] **Auth: Middleware** — `requireRole()`, `requireAccountType()`, ban checks
- [x] **Auth: Admin Creation** — Secret-key-gated endpoint
- [x] **Auth: Auto Profile Creation** — Hook creates profile on signup
- [x] **Schema: Auth** — `user`, `session`, `account`, `verification`
- [x] **Schema: Profiles** — `dealerships`, `workshops`, `mechanics`
- [x] **Schema: Taxonomy** — `countries`, `cities`, `districts`, `categories`, `makes`, `models`
- [x] **Schema: Listings** — JSONB `specs` + `media`, `isFeatured`
- [x] **Schema: Social** — `favorites`, `reviews`, `reports`
- [x] **Schema: Monetization** — `subscription_packages`, `user_subscriptions`, `payments`
- [x] **API: Listings CRUD** — Create, Read, Update, Soft Delete with ownership checks
- [x] **API: Haversine Geo Search** — Radius filtering + distance in response
- [x] **API: Locations Public** — GET countries, cities, districts
- [x] **API: Locations Admin CRUD** — POST/PATCH/DELETE countries, cities, districts
- [x] **API: Taxonomy Public** — GET categories, makes, models
- [x] **API: Taxonomy Admin CRUD** — POST/PATCH/DELETE categories, makes, models
- [x] **API: Media Upload** — Signed Cloudinary URLs with strict upload presets and asset verification
- [x] **API: Favorites CRUD** — POST/DELETE/GET user's saved listings with pagination
- [x] **API: Reviews & Ratings** — Create, owner reply, list, auto-aggregate averages
- [x] **API: Reports CRUD** — Report listing, admin review/resolve/dismiss
- [x] **API: Profile CRUD** — Dealership/Workshop/Mechanic update, public view
- [x] **API: Listing Status Transitions** — Endpoints for reserved/rented states
- [x] **API: Listing Analytics** — Track views, phone, WhatsApp clicks
- [x] **API: SEO & Meta Tags** — JSON-LD, OpenGraph, dynamic sitemap XML, robots.txt
- [x] **API: Bilingual CMS Pages** — Admin-editable pages with XSS sanitization and bilingual enforcement
- [x] **API: Social Sharing & Deep Links** — Multi-platform intents, bot-aware analytics, short links
- [x] **Seed Data** — Sudan, 8 cities, 5 districts, 7 categories, 7 makes, 31 models
- [x] **Tests** — Full test suite across 12 test files (104 tests passing)

- [x] **API: Advanced Filtering** — Fast filtering on dedicated columns (year, transmission, price)
- [x] **API: Map Search (PostGIS)** — Cluster points via ST_SnapToGrid for map UI
- [x] **API: Saved Searches** — CRUD for user search queries with idempotent watermark notifications
- [x] **API: Nearby Profiles (PostGIS)** — Cluster points for Dealerships/Workshops/Mechanics
- [x] **Worker: Match Job** — Bun.cron matching new listings to saved searches

---

## 🟢 Platform Polish & Hardening

- [x] **Zod Validation** — Strict validation schemas on ALL route boundaries with localized error formatting
- [x] **Pagination** — Query validation and pagination on list endpoints
- [x] **Image Compression** — Cloudinary auto-format (WebP/AVIF), auto-quality, and dimensional tiers
- [x] **SEO Metadata API** — Meta tags and JSON-LD schema for SSR/SSG with PII allowlists
- [x] **Bilingual Content Pages** — About, Contact, Privacy, Terms (admin-editable, protected legal slugs)
- [x] **Share Listing** — Deep link generation with crawler unfurl vs human click tracking

---

## 📊 Progress: 100% (Backend MVP Hardened)

```
Done:      ████████████████████████████████████  100%
Remaining: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
```
