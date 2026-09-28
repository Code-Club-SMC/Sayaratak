# Trustworthy Listing-to-Conversation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a buyer inspect a real listing, trust its status and seller, save or report it, and
reach the seller — with the backend enforcing contact privacy and lifecycle rules, and the
frontend showing only what the data actually supports.

**Architecture:** Backend first — add per-listing contact consent, fix the public/managed field
allowlist and lifecycle gating, harden favorites/reports, then rebuild chat as one transactional
start-or-append operation with idempotent retries and a paginated inbox. Frontend consumes each
backend contract as it lands: contact-consent fields in the existing listing form, a rebuilt
public detail page with no fabricated data, real favorites, a real inbox, and a WebSocket client.

**Tech Stack:** Bun, Hono, Drizzle ORM, PostgreSQL, Zod, `@hono/zod-validator` (backend); TanStack
Start, TanStack Router (`$locale`), TanStack Query, Tailwind CSS, shadcn/ui, `better-auth`,
Bun's native WebSocket via Hono `upgradeWebSocket` (frontend/backend realtime).

**Spec:** `docs/superpowers/specs/2026-09-27-listing-conversation-flow-design.md`

## Global Constraints

- Backend commands (run from `api/`): `bun run dev`, `bun test`, `bun run db:generate`,
  `bun run db:migrate`, `bun run db:seed`. After any schema change, run `db:generate` then
  `db:migrate` before writing routes against it.
- Frontend commands (run from `web/`): `bun run check`, `bun run build`. There is no frontend
  test runner configured (`web/package.json` has no `test` script) — frontend verification is
  type/lint check, build, and manual browser testing.
- Error responses are always `{ error: string, code: string, details?: any }`, localized through
  the single `ERROR_DICTIONARY` in `api/src/lib/i18n.ts` (keyed by `code`, with `en`/`ar` text and
  optional interpolation params) via `handleAppError`. Never hardcode a new user-facing string in
  only one language.
- `resolveLocale()` in `api/src/lib/i18n.ts` is the only locale-resolution implementation. Do not
  add a second one.
- Public API responses and any JSON-LD/OpenGraph output use explicit field allowlists — never
  spread a full DB row or the raw `user` row. This plan's whole contact-privacy fix depends on
  this rule.
- Ownership must be verified whenever a request references another entity by ID.
- Redirect targets must be server-derived or validated against a same-origin allowlist, never
  trusted raw client input.
- A seller opts into each public contact number separately; existing listings expose neither
  number until edited. The account login phone (`user.phone`) is never copied into a listing and
  is dropped entirely from listing API responses (public and owner-facing) — it is unrelated to
  the new per-listing contact fields.
- A rental listing has one recorded price and one recorded period (`daily` | `weekly` |
  `monthly`). No currency conversion, booking, or payment promise is added anywhere in this plan.
- Search, map, directories, and the dealership/workshop/mechanic/admin dashboards are out of
  scope for this phase.
- **Confirmed interpretation:** the spec lists `draft`, `rejected`, and `banned` as publicly
  inaccessible, and `available`/`reserved`/`sold`/`rented` as viewable. It did not mention the
  owner-only `pending` status (awaiting admin moderation approval, per the existing
  `ownerListingStatusSchema` enum). Confirmed with the user: `pending` is treated the same as
  `draft` — publicly inaccessible — because it has not yet been approved for publication.
- After every completed task, append a new dated section to
  `docs/web-frontend-handoff-2026-09-24.md` recording what changed, what was verified, and what
  remains (same running handoff file the prior phase used — do not fork a new handoff doc).
- Run the **full** `cd api && bun test` suite before considering any backend task complete, not
  just the new/modified test file.

---

## File Structure

Backend:
- Modify `api/src/db/schemas/listing-schema.ts`: add per-listing contact-consent columns.
- Modify `api/src/db/schemas/communication-schema.ts`: add `clientMessageId` + partial unique
  index on `messages`.
- Modify `api/src/schemas/listings.ts`: add contact fields to `createListingSchema`
  (`updateListingSchema` inherits them via `.partial()`).
- Modify `api/src/schemas/chat.ts`: extend start/send schemas with `content`/`clientMessageId`,
  add a pagination query schema.
- Modify `api/src/schemas/favorites.ts`: no new schema needed (`listingIdParamSchema` is reused).
- Modify `api/src/services/listings.service.ts`: contact validation, public/managed allowlist
  split, lifecycle-gated detail reads, click-analytics gating.
- Modify `api/src/services/chat.service.ts`: transactional start-with-message, idempotent
  message insert, pagination, unread counts, safe summaries, read-marking.
- Modify `api/src/services/favorites.service.ts`: add `isFavorited`.
- Modify `api/src/routes/chat.ts`: wire new schemas/pagination into the two `POST` routes and
  the two `GET` routes.
- Modify `api/src/routes/favorites.ts`: add `GET /:listingId` membership check.
- Modify `api/src/lib/i18n.ts`: add new `ERROR_DICTIONARY` entries for the new failure codes.
- Modify `api/tests/listings.test.ts`, `api/tests/social.test.ts`, `api/tests/chat.test.ts`
  (or create `api/tests/chat.test.ts` if none exists — check first) with the new/changed
  coverage each task calls for.
- New Drizzle migrations generated by `bun run db:generate` (do not hand-write migration SQL).

Frontend:
- Create `web/src/lib/safe-redirect.ts`.
- Modify `web/src/routes/$locale/_auth/login.tsx`: validate `redirect` before navigating.
- Modify `web/src/lib/schemas/listing-form.ts`: add contact-consent fields + mapper updates.
- Modify `web/src/components/domain/listing-form/listing-form.tsx`: add contact-consent toggles.
- Modify `web/src/components/domain/listing-form/review-panel.tsx`: add a buyer-facing contact
  preview.
- Create `web/src/lib/query-options/favorites.ts`.
- Modify `web/src/lib/query-keys.ts`: add `favoriteKeys.status`, `reportKeys`, and paginated
  `chatKeys` variants.
- Modify `web/src/components/domain/share-sheet.tsx`: generate the QR code locally.
- Modify `web/package.json`: add the `qrcode` dependency (client-side QR rendering — see Task 13
  for why this is the minimal compliant fix).
- Modify `web/src/lib/query-options/listings.ts`: drop fabricated fields from `ListingDetail`
  and `listingDetailQueryOptions`; add the real `contact` allowlist shape.
- Modify `web/src/routes/$locale/_public/listings/$id.tsx`: strip every fabricated section, wire
  real favorite/contact/status/related-listings data, add category-specific groupings.
- Create `web/src/lib/query-options/chat.ts`.
- Create `web/src/lib/use-chat-socket.ts`.
- Modify `web/src/routes/$locale/_dashboard/dashboard/messages.tsx`: replace the mock inbox with
  the real paginated conversation list + thread + compose.
- Modify `docs/web-frontend-handoff-2026-09-24.md` after every task.

---

## Backend

### Task 1: Listing Contact-Consent Schema

**Files:**
- Modify: `api/src/db/schemas/listing-schema.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces columns: `listings.contactPhone`, `listings.contactPhoneEnabled`,
  `listings.contactWhatsapp`, `listings.contactWhatsappEnabled`
- Consumed by: Task 2 (validation), Task 3 (allowlist), listing-form frontend (Task 11)

- [ ] **Step 1: Add the columns**

In `api/src/db/schemas/listing-schema.ts`, add these fields to the `listings` table definition
(right after `rentalPeriod`, before the `status` line):

```ts
		// Per-listing contact consent. Nullable and off by default; never populated from
		// the account's login phone (user.phone) — a seller must opt in per listing.
		contactPhone: text("contactPhone"),
		contactPhoneEnabled: boolean("contactPhoneEnabled").notNull().default(false),
		contactWhatsapp: text("contactWhatsapp"),
		contactWhatsappEnabled: boolean("contactWhatsappEnabled").notNull().default(false),
```

- [ ] **Step 2: Generate and apply the migration**

Run:

```bash
cd api && bun run db:generate
cd api && bun run db:migrate
```

Expected: a new migration directory appears under `api/src/db/migrations/` adding the four
columns; both commands exit 0.

- [ ] **Step 3: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 1 Completed

- Added nullable per-listing `contactPhone`/`contactWhatsapp` and default-off
  `contactPhoneEnabled`/`contactWhatsappEnabled` consent flags to `listings`.
- Generated and applied the migration.
- Verification: `cd api && bun run db:generate`, `cd api && bun run db:migrate`.
```

---

### Task 2: Contact Consent Validation On Create/Update

**Files:**
- Modify: `api/src/schemas/listings.ts`
- Modify: `api/src/services/listings.service.ts`
- Modify: `api/src/lib/i18n.ts`
- Modify: `api/tests/listings.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: columns from Task 1
- Produces: `CreateListingInput.contactPhone/contactPhoneEnabled/contactWhatsapp/contactWhatsappEnabled`
- New error codes: `CONTACT_PHONE_REQUIRED`, `CONTACT_WHATSAPP_REQUIRED`

- [ ] **Step 1: Write the failing tests**

Add to `api/tests/listings.test.ts`:

```ts
test("POST /listings rejects contactPhoneEnabled=true with no phone", async () => {
	const res = await listingsApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: sellerCookie },
		body: JSON.stringify({
			...validListingPayload,
			contactPhoneEnabled: true,
		}),
	});
	expect(res.status).toBe(400);
	const json = await res.json();
	expect(json.code).toBe("CONTACT_PHONE_REQUIRED");
});

test("POST /listings accepts contactPhoneEnabled=true with a phone and never copies the account phone", async () => {
	const res = await listingsApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: sellerCookie },
		body: JSON.stringify({
			...validListingPayload,
			contactPhone: "+249911111111",
			contactPhoneEnabled: true,
		}),
	});
	expect(res.status).toBe(201);
	const json = await res.json();
	expect(json.contactPhone).toBe("+249911111111");
	// Seller's account login phone must never leak in here even implicitly.
	expect(json.contactPhone).not.toBe(sellerAccountPhone);
});

test("PUT /listings/:id rejects enabling whatsapp without ever having provided a number", async () => {
	const created = await createDraftListing(sellerCookie);
	const res = await listingsApp.request(`/${created.id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", cookie: sellerCookie },
		body: JSON.stringify({ contactWhatsappEnabled: true }),
	});
	expect(res.status).toBe(400);
	const json = await res.json();
	expect(json.code).toBe("CONTACT_WHATSAPP_REQUIRED");
});
```

Adapt `validListingPayload`, `sellerCookie`, `sellerAccountPhone`, and `createDraftListing` to
whatever helpers/fixtures the existing top of `api/tests/listings.test.ts` already defines for
the passing owner-listing tests (Task 1A tests in that same file already authenticate a seller
and create a draft listing — reuse that exact setup, do not duplicate it).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && bun test tests/listings.test.ts`
Expected: the three new tests FAIL (400 codes not yet produced / fields not yet accepted).

- [ ] **Step 3: Add the Zod fields**

In `api/src/schemas/listings.ts`, add to `createListingSchema` (any position among the other
optional fields):

```ts
	contactPhone: z.string().trim().min(6).max(20).optional(),
	contactPhoneEnabled: z.boolean().optional(),
	contactWhatsapp: z.string().trim().min(6).max(20).optional(),
	contactWhatsappEnabled: z.boolean().optional(),
```

**Do not add `.default(false)` to the two boolean fields.** `updateListingSchema` is
`createListingSchema.partial()` — under Zod v4, a `.default()` still fires when the key is
omitted even through `.partial()`, which would make every `PUT` that omits these keys parse them
as `false` and silently reset previously-granted consent (verified empirically; this bit a first
implementation of this task). Plain `.optional()` correctly yields `undefined` when omitted,
which is what `updateListing`'s `body.contactPhoneEnabled ?? existing.contactPhoneEnabled` merge
(Step 5 below) needs. `createListing`'s `insertData` already applies `body.contactPhoneEnabled ??
false` explicitly (Step 5 below), so create-time defaulting is unaffected.

- [ ] **Step 4: Add the ERROR_DICTIONARY entries**

In `api/src/lib/i18n.ts`, add two entries inside the existing `ERROR_DICTIONARY` object (place
them near the other listing-related codes):

```ts
	CONTACT_PHONE_REQUIRED: {
		code: "CONTACT_PHONE_REQUIRED",
		en: "Enter a phone number before making it publicly visible.",
		ar: "أدخل رقم هاتف قبل إظهاره للعامة.",
	},
	CONTACT_WHATSAPP_REQUIRED: {
		code: "CONTACT_WHATSAPP_REQUIRED",
		en: "Enter a WhatsApp number before making it publicly visible.",
		ar: "أدخل رقم واتساب قبل إظهاره للعامة.",
	},
```

- [ ] **Step 5: Wire validation and storage into the service**

In `api/src/services/listings.service.ts`, add `BadRequestError` to validation (it's already
imported) and add to `createListing`, right after the `checkListingLimit` check:

```ts
		if (body.contactPhoneEnabled && !body.contactPhone?.trim()) {
			throw new BadRequestError(
				"Enter a phone number before making it publicly visible.",
				"CONTACT_PHONE_REQUIRED",
			);
		}
		if (body.contactWhatsappEnabled && !body.contactWhatsapp?.trim()) {
			throw new BadRequestError(
				"Enter a WhatsApp number before making it publicly visible.",
				"CONTACT_WHATSAPP_REQUIRED",
			);
		}
```

and add to `insertData`:

```ts
			contactPhone: body.contactPhone?.trim() || null,
			contactPhoneEnabled: body.contactPhoneEnabled ?? false,
			contactWhatsapp: body.contactWhatsapp?.trim() || null,
			contactWhatsappEnabled: body.contactWhatsappEnabled ?? false,
```

In `updateListing`, right after the existing `existing.userId !== currentUser.id` ownership
check, add:

```ts
		const effectivePhoneEnabled = body.contactPhoneEnabled ?? existing.contactPhoneEnabled;
		const effectivePhone =
			body.contactPhone !== undefined
				? body.contactPhone?.trim() || null
				: existing.contactPhone;
		if (effectivePhoneEnabled && !effectivePhone) {
			throw new BadRequestError(
				"Enter a phone number before making it publicly visible.",
				"CONTACT_PHONE_REQUIRED",
			);
		}

		const effectiveWhatsappEnabled =
			body.contactWhatsappEnabled ?? existing.contactWhatsappEnabled;
		const effectiveWhatsapp =
			body.contactWhatsapp !== undefined
				? body.contactWhatsapp?.trim() || null
				: existing.contactWhatsapp;
		if (effectiveWhatsappEnabled && !effectiveWhatsapp) {
			throw new BadRequestError(
				"Enter a WhatsApp number before making it publicly visible.",
				"CONTACT_WHATSAPP_REQUIRED",
			);
		}
```

and, right after the existing `const { lat, lng, media, ...restBody } = body;` line in
`updateListing`, trim the two string fields if they were provided:

```ts
		if (updateData.contactPhone !== undefined) {
			updateData.contactPhone = (updateData.contactPhone as string | undefined)?.trim() || null;
		}
		if (updateData.contactWhatsapp !== undefined) {
			updateData.contactWhatsapp = (updateData.contactWhatsapp as string | undefined)?.trim() || null;
		}
```

Finally, add the four columns to `listingResponseFields` (the shared `.returning()` projection
used by create/update/status-patch — this is the owner-facing/mutation-safe projection, safe to
include here because these endpoints are always the listing's own owner):

```ts
	contactPhone: listings.contactPhone,
	contactPhoneEnabled: listings.contactPhoneEnabled,
	contactWhatsapp: listings.contactWhatsapp,
	contactWhatsappEnabled: listings.contactWhatsappEnabled,
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd api && bun test tests/listings.test.ts`
Expected: all tests pass, including the three new ones.

- [ ] **Step 7: Run the full suite**

Run: `cd api && bun test`
Expected: exits 0.

- [ ] **Step 8: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 2 Completed

- Added Zod validation requiring a non-empty number whenever its consent flag is enabled, on
  both create and update (update merges against the existing stored value so enabling consent
  without resubmitting the number still validates correctly).
- Added `CONTACT_PHONE_REQUIRED`/`CONTACT_WHATSAPP_REQUIRED` to `ERROR_DICTIONARY` (en/ar).
- Confirmed no code path copies `user.phone` (the account login number) into a new listing.
- Verification: `cd api && bun test tests/listings.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 3: Public/Managed Field Allowlist + Lifecycle-Gated Detail Reads

This is the core privacy and lifecycle fix. It replaces the old "any non-available listing
returns 410" behavior and removes the raw `user.phone` leak from every listing read path.

**Files:**
- Modify: `api/src/services/listings.service.ts`
- Modify: `api/tests/listings.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: a `contact: { phone: string | null; whatsapp: string | null; canMessage: boolean }`
  field on every public listing response (list items and detail), replacing `user.phone`.
- Produces: `getListingById` now returns `available`/`reserved`/`sold`/`rented` listings (200)
  and throws `NotFoundError` (404) for `draft`/`pending`/`rejected`/`banned`/anything else,
  instead of throwing `GoneError` (410) for every non-`available` status.
- Consumed by: Task 4 (click gating), Task 7/8 (chat lifecycle gate reads listing status the
  same way), frontend Task 14.

- [ ] **Step 1: Update the existing test that encodes the old behavior**

`api/tests/listings.test.ts` currently has a Task-1A test asserting "public `/:id` still returns
410 for non-available listing." Find it and replace it — the lifecycle rule is intentionally
changing in this task. Replace that single test with:

```ts
test("GET /listings/:id is 404 for draft/pending/rejected/banned listings", async () => {
	for (const status of ["draft", "pending", "rejected", "banned"]) {
		const listing = await createListingWithStatus(sellerCookie, status);
		const res = await listingsApp.request(`/${listing.id}`);
		expect(res.status).toBe(404);
	}
});

test("GET /listings/:id returns 200 and a marked, contact-closed detail for reserved/sold/rented", async () => {
	for (const status of ["reserved", "sold", "rented"]) {
		const listing = await createListingWithStatus(sellerCookie, status);
		const res = await listingsApp.request(`/${listing.id}`);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.status).toBe(status);
		expect(json.contact.canMessage).toBe(false);
		expect(json.contact.phone).toBeNull();
		expect(json.contact.whatsapp).toBeNull();
	}
});

test("GET /listings/:id never returns the account login phone, only opted-in listing contact fields", async () => {
	const listing = await createListingWithStatus(sellerCookie, "available", {
		contactPhone: "+249900000001",
		contactPhoneEnabled: true,
	});
	const res = await listingsApp.request(`/${listing.id}`);
	const json = await res.json();
	expect(json.contact.phone).toBe("+249900000001");
	expect(json.contact.whatsapp).toBeNull(); // whatsapp was never enabled
	expect(json.user.phone).toBeUndefined();
	expect(json.contactPhone).toBeUndefined(); // raw field must not leak on the public path
	expect(json.contactPhoneEnabled).toBeUndefined();
});
```

Add a small `createListingWithStatus(cookie, status, overrides = {})` test helper near the top
of the file (next to the existing `createDraftListing`-style helpers) that creates a listing via
the authenticated create endpoint, then patches its status directly through
`listingsService.updateListingStatus` or the admin/status route already used elsewhere in this
test file for setting non-standard statuses like `pending`/`rejected`/`banned` — follow whatever
existing pattern the Task-1A tests already use to get a listing into those states (they already
had to do this to test `/manage/:id` and `/me` across the full owner-status enum).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && bun test tests/listings.test.ts`
Expected: FAIL (old 410 behavior and raw `user.phone` still present).

- [ ] **Step 3: Split the selection and add the allowlist mapper**

In `api/src/services/listings.service.ts`, remove `phone: user.phone` from the `user` object
inside `publicListingSelection` (it currently reads `user: { id, name, image, accountType,
phone, isVerified }` inline in `getListingById`/`getManagedListingById` — see below) and add a
mapper function right after `publicListingSelection`'s declaration:

```ts
const PUBLIC_STATUSES = ["available", "reserved", "sold", "rented"] as const;

type ContactableRow = {
	status: string;
	contactPhone: string | null;
	contactPhoneEnabled: boolean;
	contactWhatsapp: string | null;
	contactWhatsappEnabled: boolean;
};

function withPublicContact<T extends ContactableRow>(
	row: T,
): Omit<T, "contactPhone" | "contactPhoneEnabled" | "contactWhatsapp" | "contactWhatsappEnabled"> & {
	contact: { phone: string | null; whatsapp: string | null; canMessage: boolean };
} {
	const {
		contactPhone,
		contactPhoneEnabled,
		contactWhatsapp,
		contactWhatsappEnabled,
		...rest
	} = row;
	const canMessage = row.status === "available";
	return {
		...rest,
		contact: {
			phone: canMessage && contactPhoneEnabled && contactPhone ? contactPhone : null,
			whatsapp:
				canMessage && contactWhatsappEnabled && contactWhatsapp ? contactWhatsapp : null,
			canMessage,
		},
	};
}
```

Note: `publicListingSelection` already spreads `...listingResponseFields`, and Task 2 already
added the four raw contact columns to `listingResponseFields` — so `publicListingSelection`
already includes them and needs no separate edit here. Do not add them a second time (that would
be a duplicate object key).

- [ ] **Step 4: Remove `user.phone` and fix the lifecycle gate in `getListingById`**

Replace the whole `getListingById` method body with:

```ts
	async getListingById(id: string) {
		const [listing] = await db
			.select({
				...publicListingSelection,
				user: {
					id: user.id,
					name: user.name,
					image: user.image,
					accountType: user.accountType,
					isVerified: dealerships.isVerified,
				},
			})
			.from(listings)
			.leftJoin(cities, eq(listings.cityId, cities.id))
			.leftJoin(districts, eq(listings.districtId, districts.id))
			.leftJoin(user, eq(listings.userId, user.id))
			.leftJoin(dealerships, eq(listings.userId, dealerships.userId))
			.where(eq(listings.id, id));

		if (!listing || !PUBLIC_STATUSES.includes(listing.status as (typeof PUBLIC_STATUSES)[number])) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}

		return withPublicContact(listing);
	},
```

(This drops the `GoneError` import usage here — leave the `GoneError` class import alone even
if it becomes unused by this file; `share.ts`/other files may still reference the shared error
module. If a lint pass flags an actually-unused import in this specific file, remove it there.)

- [ ] **Step 5: Apply the same allowlist to `findListings` and `findMyListings`**

In `findListings`, after `results` is populated (both the geo and non-geo branches already
assign to the same `results` variable before the `return`), map it:

```ts
		return {
			items: results.map(withPublicContact),
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
```

`findMyListings` is the owner's own list — keep it returning raw `contactPhone`/
`contactPhoneEnabled`/etc. (the owner needs to see and edit them), but still drop `user.phone`:
in `getManagedListingById`, change the `user` object the same way `getListingById` was changed
above (drop `phone`, keep `isVerified`). `findMyListings` doesn't currently join `user` for
phone at all, so it needs no change beyond already using `publicListingSelection` — leave its
raw contact fields as-is in the response (they're the owner's own draft data).

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd api && bun test tests/listings.test.ts`
Expected: all pass.

- [ ] **Step 7: Run the full suite**

Run: `cd api && bun test`
Expected: exits 0.

- [ ] **Step 8: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 3 Completed

- Removed `user.phone` (account login phone) from every listing read path — public list,
  public detail, and managed detail no longer expose it.
- Added a `contact: { phone, whatsapp, canMessage }` allowlisted field to public listing
  responses, computed from the listing's own opted-in contact fields and gated on
  `status === "available"`.
- Changed public detail lifecycle: available/reserved/sold/rented now return 200 (closed
  statuses read-only, `contact.canMessage: false`); draft/pending/rejected/banned now return
  404 instead of the old blanket 410-for-anything-non-available behavior.
- Owner-facing reads (`/listings/me`, `/listings/manage/:id`) keep the raw contact fields for
  editing, but also no longer expose the account login phone.
- Verification: `cd api && bun test tests/listings.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 4: Gate Phone/WhatsApp Click Analytics On Permitted Contact

**Files:**
- Modify: `api/src/services/listings.service.ts`
- Modify: `api/tests/listings.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `PUBLIC_STATUSES`/contact-consent columns from Task 3
- Changes: `trackListingClick` now throws `ForbiddenError` (`CONTACT_METHOD_NOT_PERMITTED`) for
  `phone`/`whatsapp` clicks when that method isn't currently permitted; `view` is unaffected.

- [ ] **Step 1: Write the failing tests**

```ts
test("POST /listings/:id/clicks rejects a phone click when the listing doesn't permit it", async () => {
	const listing = await createListingWithStatus(sellerCookie, "available", {
		contactPhoneEnabled: false,
	});
	const res = await listingsApp.request(`/${listing.id}/clicks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "phone" }),
	});
	expect(res.status).toBe(403);
	const json = await res.json();
	expect(json.code).toBe("CONTACT_METHOD_NOT_PERMITTED");
});

test("POST /listings/:id/clicks rejects a whatsapp click on a closed (sold) listing even if the number is enabled", async () => {
	const listing = await createListingWithStatus(sellerCookie, "sold", {
		contactWhatsapp: "+249900000002",
		contactWhatsappEnabled: true,
	});
	const res = await listingsApp.request(`/${listing.id}/clicks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "whatsapp" }),
	});
	expect(res.status).toBe(403);
});

test("POST /listings/:id/clicks accepts a permitted phone click and increments the counter", async () => {
	const listing = await createListingWithStatus(sellerCookie, "available", {
		contactPhone: "+249900000003",
		contactPhoneEnabled: true,
	});
	const res = await listingsApp.request(`/${listing.id}/clicks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "phone" }),
	});
	expect(res.status).toBe(200);
});

test("POST /listings/:id/clicks still accepts view clicks regardless of contact permission", async () => {
	const listing = await createListingWithStatus(sellerCookie, "sold");
	const res = await listingsApp.request(`/${listing.id}/clicks`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "view" }),
	});
	expect(res.status).toBe(200);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && bun test tests/listings.test.ts`

- [ ] **Step 3: Add the error entry**

In `api/src/lib/i18n.ts`, add:

```ts
	CONTACT_METHOD_NOT_PERMITTED: {
		code: "CONTACT_METHOD_NOT_PERMITTED",
		en: "This contact method is not available for this listing.",
		ar: "وسيلة التواصل هذه غير متاحة لهذا الإعلان.",
	},
```

- [ ] **Step 4: Gate `trackListingClick`**

Replace the body of `trackListingClick` in `api/src/services/listings.service.ts`:

```ts
	async trackListingClick(
		id: string,
		type: "view" | "phone" | "whatsapp",
		userAgent?: string,
	) {
		if (isBotUserAgent(userAgent)) {
			return { success: true };
		}

		if (type !== "view") {
			const [listing] = await db
				.select({
					status: listings.status,
					contactPhoneEnabled: listings.contactPhoneEnabled,
					contactWhatsappEnabled: listings.contactWhatsappEnabled,
				})
				.from(listings)
				.where(eq(listings.id, id));

			if (!listing) {
				throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
			}

			const permitted =
				listing.status === "available" &&
				(type === "phone" ? listing.contactPhoneEnabled : listing.contactWhatsappEnabled);

			if (!permitted) {
				throw new ForbiddenError(
					"This contact method is not available for this listing.",
					"CONTACT_METHOD_NOT_PERMITTED",
				);
			}
		}

		if (type === "view") {
			await db
				.update(listings)
				.set({ viewCount: sql`${listings.viewCount} + 1` })
				.where(eq(listings.id, id));
		} else if (type === "phone") {
			await db
				.update(listings)
				.set({ phoneClickCount: sql`${listings.phoneClickCount} + 1` })
				.where(eq(listings.id, id));
		} else if (type === "whatsapp") {
			await db
				.update(listings)
				.set({ whatsappClickCount: sql`${listings.whatsappClickCount} + 1` })
				.where(eq(listings.id, id));
		}

		return { success: true };
	},
```

- [ ] **Step 5: Run tests to verify they pass, then the full suite**

Run: `cd api && bun test tests/listings.test.ts`, then `cd api && bun test`.

- [ ] **Step 6: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 4 Completed

- `POST /listings/:id/clicks` now rejects (403 `CONTACT_METHOD_NOT_PERMITTED`) phone/whatsapp
  clicks unless the listing is `available` and that specific method is enabled with a number.
  `view` clicks are unaffected.
- Verification: `cd api && bun test tests/listings.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 5: Favorites Membership Check + Auth Test Hardening

**Files:**
- Modify: `api/src/routes/favorites.ts`
- Modify: `api/src/services/favorites.service.ts`
- Modify: `api/tests/social.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `GET /api/v1/favorites/:listingId` → `{ favorited: boolean }`
- Produces: `favoritesService.isFavorited(userId, listingId): Promise<boolean>`

- [ ] **Step 1: Write the failing tests**

Add to `api/tests/social.test.ts`:

```ts
test("GET /favorites/:listingId requires auth", async () => {
	const res = await favoritesApp.request(`/${someListingId}`);
	expect(res.status).toBe(401);
});

test("GET /favorites/:listingId reflects membership state", async () => {
	const before = await favoritesApp.request(`/${someListingId}`, {
		headers: { cookie: buyerCookie },
	});
	expect((await before.json()).favorited).toBe(false);

	await favoritesApp.request(`/${someListingId}`, {
		method: "POST",
		headers: { cookie: buyerCookie },
	});

	const after = await favoritesApp.request(`/${someListingId}`, {
		headers: { cookie: buyerCookie },
	});
	expect((await after.json()).favorited).toBe(true);
});

test("POST /favorites/:listingId requires auth", async () => {
	const res = await favoritesApp.request(`/${someListingId}`, { method: "POST" });
	expect(res.status).toBe(401);
});
```

Reuse whatever `someListingId`/`buyerCookie` fixtures the existing favorite tests in this file
already set up.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && bun test tests/social.test.ts`

- [ ] **Step 3: Add the service method**

In `api/src/services/favorites.service.ts`, add:

```ts
	async isFavorited(userId: string, listingId: string) {
		const [row] = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
		return Boolean(row);
	},
```

(`and`/`eq` are already imported in this file per its existing `addFavorite`/`removeFavorite`
implementations.)

- [ ] **Step 4: Add the route**

In `api/src/routes/favorites.ts`, add (auth is already applied globally via
`favoritesApp.use("/*", requireAuth())`, so no extra middleware is needed):

```ts
favoritesApp.get(
	"/:listingId",
	zValidator("param", listingIdParamSchema),
	async (c) => {
		const user = c.get("user");
		const { listingId } = c.req.valid("param");
		const favorited = await favoritesService.isFavorited(user.id, listingId);
		return c.json({ favorited });
	},
);
```

Place it before the existing `DELETE /:listingId` route (method differs, so ordering doesn't
matter for routing, but keep related routes grouped for readability).

- [ ] **Step 5: Run tests to verify they pass, then the full suite**

Run: `cd api && bun test tests/social.test.ts`, then `cd api && bun test`.

- [ ] **Step 6: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 5 Completed

- Added `GET /api/v1/favorites/:listingId` membership check (`{ favorited: boolean }`),
  authenticated, for the detail page to load real favorite state instead of guessing from a
  full list.
- Added missing 401 tests for the favorites endpoints.
- Verification: `cd api && bun test tests/social.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 6: Reports Auth/Invalid-Input Test Hardening

The reports implementation (`api/src/routes/reports.ts`, `api/src/services/reports.service.ts`)
is already correct — `POST /` requires auth, `GET /` and `PATCH /:id` are admin-only. This task
only closes a test-coverage gap; per Section 7 of AGENTS.md every endpoint needs an auth-boundary
and invalid-input test, and these two are currently missing.

**Files:**
- Modify: `api/tests/social.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

- [ ] **Step 1: Write the tests**

```ts
test("POST /reports requires auth", async () => {
	const res = await reportsApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ listingId: someListingId, reason: "spam" }),
	});
	expect(res.status).toBe(401);
});

test("POST /reports rejects a missing reason", async () => {
	const res = await reportsApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: buyerCookie },
		body: JSON.stringify({ listingId: someListingId }),
	});
	expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run to verify they pass already or fail correctly**

Run: `cd api && bun test tests/social.test.ts`
Expected: PASS (this task is pure test coverage — if either fails, that means the
already-reviewed implementation summary was wrong and the underlying route/service needs the
matching fix before these pass; investigate against `api/src/routes/reports.ts` before changing
test expectations).

- [ ] **Step 3: Run the full suite**

Run: `cd api && bun test`

- [ ] **Step 4: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 6 Completed

- Added the missing 401 (no session) and 400 (missing `reason`) tests for `POST /reports`,
  closing an AGENTS.md §7 coverage gap. No implementation change was needed — the existing
  `requireAuth()` + `createReportSchema` already enforced both.
- Verification: `cd api && bun test tests/social.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 7: Transactional First-Message Chat Start + Idempotent Retries + Lifecycle Gate

This replaces the current `POST /api/chat` ("start or get a conversation" with no message) with
one atomic start-with-first-message operation, so a failed send can never leave behind an empty
conversation, and makes both starting and replying safe to retry.

**Files:**
- Modify: `api/src/db/schemas/communication-schema.ts`
- Modify: `api/src/schemas/chat.ts`
- Modify: `api/src/services/chat.service.ts`
- Modify: `api/src/routes/chat.ts`
- Modify: `api/src/lib/i18n.ts`
- Create or modify: `api/tests/chat.test.ts` (check `api/tests/` first — if no chat test file
  exists yet, create one following the same request-helper pattern as `api/tests/social.test.ts`)
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `chatService.startConversationWithMessage(userId, listingId, content,
  clientMessageId?)` → `{ conversation, message, isNewConversation }`
- Changes: `POST /api/chat` now requires `content` (was previously message-less) and accepts an
  optional `clientMessageId`.
- Changes: `POST /api/chat/:id/messages` also accepts an optional `clientMessageId`.
- New error code: `LISTING_NOT_CONTACTABLE` (403, only blocks a *new* conversation on a
  non-`available` listing — existing conversations and all replies are unaffected).

- [ ] **Step 1: Add the `clientMessageId` column + partial unique index**

In `api/src/db/schemas/communication-schema.ts`, add `uniqueIndex` and `sql` to the existing
`drizzle-orm`/`drizzle-orm/pg-core` imports, then add a column to `messages` and a table config:

```ts
import { pgTable, text, timestamp, boolean, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
```

```ts
export const messages = pgTable(
	"messages",
	{
		id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
		conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
		senderId: text("sender_id").notNull().references(() => user.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		clientMessageId: text("client_message_id"),
		isRead: boolean("is_read").default(false),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(t) => ({
		uniqueConversationClientMessage: uniqueIndex(
			"messages_conversation_client_message_idx",
		)
			.on(t.conversationId, t.clientMessageId)
			.where(sql`${t.clientMessageId} IS NOT NULL`),
	}),
);
```

- [ ] **Step 2: Generate and apply the migration**

Run:

```bash
cd api && bun run db:generate
cd api && bun run db:migrate
```

- [ ] **Step 3: Write the failing tests**

Create/extend `api/tests/chat.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { chatApp } from "../src/routes/chat";
// ...import/auth helpers matching this repo's existing test-setup convention (see social.test.ts)

describe("POST /chat — transactional first message", () => {
	test("requires auth", async () => {
		const res = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ listingId: availableListingId, content: "Hi" }),
		});
		expect(res.status).toBe(401);
	});

	test("rejects starting a new conversation on a non-available listing", async () => {
		const closedListing = await createListingWithStatus(sellerCookie, "sold");
		const res = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({ listingId: closedListing.id, content: "Still available?" }),
		});
		expect(res.status).toBe(403);
		const json = await res.json();
		expect(json.code).toBe("LISTING_NOT_CONTACTABLE");
	});

	test("creates exactly one conversation and one message on first contact", async () => {
		const res = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({
				listingId: availableListingId,
				content: "Is this still for sale?",
				clientMessageId: "client-msg-1",
			}),
		});
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.isNewConversation).toBe(true);
		expect(json.message.content).toBe("Is this still for sale?");

		const messages = await chatApp.request(`/${json.conversation.id}/messages`, {
			headers: { cookie: buyerCookie },
		});
		const messagesJson = await messages.json();
		expect(messagesJson.items).toHaveLength(1);
	});

	test("retrying the same clientMessageId does not duplicate the message", async () => {
		const first = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({
				listingId: availableListingId2,
				content: "Retry test",
				clientMessageId: "retry-1",
			}),
		});
		const firstJson = await first.json();

		const retry = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({
				listingId: availableListingId2,
				content: "Retry test",
				clientMessageId: "retry-1",
			}),
		});
		expect(retry.status).toBe(200); // existing conversation, not newly created
		const retryJson = await retry.json();
		expect(retryJson.message.id).toBe(firstJson.message.id);

		const messages = await chatApp.request(`/${firstJson.conversation.id}/messages`, {
			headers: { cookie: buyerCookie },
		});
		expect((await messages.json()).items).toHaveLength(1);
	});

	test("existing conversation stays usable after the listing closes", async () => {
		const listing = await createListingWithStatus(sellerCookie, "available");
		const start = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({ listingId: listing.id, content: "Hello" }),
		});
		const conversationId = (await start.json()).conversation.id;

		await listingsService.updateListingStatus(listing.id, sellerSessionUser, "sold");

		const reply = await chatApp.request(`/${conversationId}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: buyerCookie },
			body: JSON.stringify({ content: "Still interested?" }),
		});
		expect(reply.status).toBe(201);
	});

	test("cannot message your own listing", async () => {
		const listing = await createListingWithStatus(sellerCookie, "available");
		const res = await chatApp.request("/", {
			method: "POST",
			headers: { "Content-Type": "application/json", cookie: sellerCookie },
			body: JSON.stringify({ listingId: listing.id, content: "Hi" }),
		});
		expect(res.status).toBe(400);
	});
});
```

Adapt imports/fixtures (`sellerCookie`, `buyerCookie`, `availableListingId`,
`sellerSessionUser`, `createListingWithStatus`) to match this repo's existing test-auth-fixture
pattern already established in `api/tests/social.test.ts` and `api/tests/listings.test.ts`.

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd api && bun test tests/chat.test.ts`

- [ ] **Step 5: Add the error entry**

In `api/src/lib/i18n.ts`, add:

```ts
	LISTING_NOT_CONTACTABLE: {
		code: "LISTING_NOT_CONTACTABLE",
		en: "This listing is closed and cannot start a new conversation.",
		ar: "هذا الإعلان مغلق ولا يمكن بدء محادثة جديدة عليه.",
	},
```

- [ ] **Step 6: Extend the Zod schemas**

Replace `api/src/schemas/chat.ts` with:

```ts
import { z } from "zod";

export const startChatSchema = z.object({
	listingId: z.string().min(1, "listingId is required"),
	content: z.string().min(1, "content required"),
	clientMessageId: z.string().min(1).max(100).optional(),
});

export const sendMessageSchema = z.object({
	content: z.string().min(1, "content required"),
	clientMessageId: z.string().min(1).max(100).optional(),
});

export const chatPaginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatPaginationQuery = z.infer<typeof chatPaginationQuerySchema>;
```

- [ ] **Step 7: Implement the transactional service method**

In `api/src/services/chat.service.ts`, `ForbiddenError` is already in the existing error import
(`import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors";`) — no import
change needed there. Add near the top of the file (after the `BunServerWithPublish` type):

```ts
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertMessageIdempotent(
	executor: Executor,
	conversationId: string,
	senderId: string,
	content: string,
	clientMessageId?: string,
) {
	if (!clientMessageId) {
		const [inserted] = await executor
			.insert(messages)
			.values({ conversationId, senderId, content })
			.returning();
		return inserted;
	}

	const [inserted] = await executor
		.insert(messages)
		.values({ conversationId, senderId, content, clientMessageId })
		.onConflictDoNothing({
			target: [messages.conversationId, messages.clientMessageId],
		})
		.returning();

	if (inserted) return inserted;

	const [existing] = await executor
		.select()
		.from(messages)
		.where(
			and(
				eq(messages.conversationId, conversationId),
				eq(messages.clientMessageId, clientMessageId),
			),
		);
	return existing;
}

function safeMessage(msg: typeof messages.$inferSelect) {
	return {
		id: msg.id,
		conversationId: msg.conversationId,
		senderId: msg.senderId,
		content: msg.content,
		isRead: msg.isRead,
		createdAt: msg.createdAt,
	};
}

function safeConversation(conv: typeof conversations.$inferSelect) {
	return {
		id: conv.id,
		listingId: conv.listingId,
		buyerId: conv.buyerId,
		sellerId: conv.sellerId,
		lastMessageAt: conv.lastMessageAt,
		createdAt: conv.createdAt,
	};
}
```

Replace `startConversation` with `startConversationWithMessage`:

```ts
	async startConversationWithMessage(
		userId: string,
		listingId: string,
		content: string,
		clientMessageId?: string,
	) {
		const [listing] = await db
			.select()
			.from(listings)
			.where(eq(listings.id, listingId));

		if (!listing) {
			throw new NotFoundError("Listing not found", "LISTING_NOT_FOUND");
		}
		if (listing.userId === userId) {
			throw new BadRequestError("Cannot message yourself", "CANNOT_MESSAGE_SELF");
		}

		const [existingConversation] = await db
			.select()
			.from(conversations)
			.where(
				and(eq(conversations.listingId, listingId), eq(conversations.buyerId, userId)),
			);

		if (!existingConversation && listing.status !== "available") {
			throw new ForbiddenError(
				"This listing is closed and cannot start a new conversation.",
				"LISTING_NOT_CONTACTABLE",
			);
		}

		return db.transaction(async (tx) => {
			let conversation = existingConversation;

			if (!conversation) {
				const [inserted] = await tx
					.insert(conversations)
					.values({ listingId, buyerId: userId, sellerId: listing.userId })
					.onConflictDoNothing({
						target: [conversations.listingId, conversations.buyerId],
					})
					.returning();

				conversation = inserted;
				if (!conversation) {
					[conversation] = await tx
						.select()
						.from(conversations)
						.where(
							and(
								eq(conversations.listingId, listingId),
								eq(conversations.buyerId, userId),
							),
						);
				}
			}

			const message = await insertMessageIdempotent(
				tx,
				conversation.id,
				userId,
				content,
				clientMessageId,
			);

			await tx
				.update(conversations)
				.set({ lastMessageAt: new Date() })
				.where(eq(conversations.id, conversation.id));

			return {
				conversation: safeConversation(conversation),
				message: safeMessage(message),
				isNewConversation: !existingConversation,
			};
		});
	},
```

Update `sendMessage` to accept `clientMessageId` and use the same idempotent insert, wrapped in
a transaction with the `lastMessageAt` update (no listing-status check — replies always work):

```ts
	async sendMessage(
		conversationId: string,
		senderId: string,
		content: string,
		clientMessageId: string | undefined,
		server?: any,
	) {
		const [conv] = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId));

		if (!conv) {
			throw new NotFoundError("Not found", "CONVERSATION_NOT_FOUND");
		}
		if (conv.buyerId !== senderId && conv.sellerId !== senderId) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		const msg = await db.transaction(async (tx) => {
			const inserted = await insertMessageIdempotent(
				tx,
				conversationId,
				senderId,
				content,
				clientMessageId,
			);
			await tx
				.update(conversations)
				.set({ lastMessageAt: new Date() })
				.where(eq(conversations.id, conversationId));
			return inserted;
		});

		const msgResponse = safeMessage(msg);

		const receiverId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;

		let deliveredViaWs = false;
		const wsServer = server as BunServerWithPublish | undefined;
		if (wsServer && typeof wsServer.publish === "function") {
			const recipientCount = wsServer.publish(
				`user_${receiverId}`,
				JSON.stringify({ type: "chat_message", data: msgResponse }),
			);
			if (typeof recipientCount === "number" && recipientCount > 0) {
				deliveredViaWs = true;
			}
		}

		if (!deliveredViaWs) {
			await sendPushNotification(receiverId, "New Message", content, {
				type: "chat",
				conversationId,
			});
		}

		return msgResponse;
	},
```

Remove the now-unused old `startConversation` method entirely (replaced above).

- [ ] **Step 8: Wire the route**

In `api/src/routes/chat.ts`, replace the `POST /` handler:

```ts
chatApp.post("/", requireAuth(), zValidator("json", startChatSchema), async (c) => {
	const user = c.get("user");
	const { listingId, content, clientMessageId } = c.req.valid("json");
	const result = await chatService.startConversationWithMessage(
		user.id,
		listingId,
		content,
		clientMessageId,
	);
	return c.json(result, result.isNewConversation ? 201 : 200);
});
```

and update the `POST /:id/messages` handler to pass `clientMessageId` through:

```ts
chatApp.post(
	"/:id/messages",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("json", sendMessageSchema),
	async (c) => {
		const user = c.get("user");

		if (!chatMessageRateLimiter.check(user.id)) {
			throw new RateLimitError(
				"Too Many Requests. Message rate limit exceeded.",
				"RATE_LIMIT_EXCEEDED",
			);
		}

		const { id } = c.req.valid("param");
		const { content, clientMessageId } = c.req.valid("json");

		const server =
			(c.env as Record<string, unknown> | undefined)?.server ||
			(globalThis as Record<string, unknown>).server;

		const msgResponse = await chatService.sendMessage(
			id,
			user.id,
			content,
			clientMessageId,
			server,
		);
		return c.json(msgResponse, 201);
	},
);
```

- [ ] **Step 9: Run tests to verify they pass, then the full suite**

Run: `cd api && bun test tests/chat.test.ts`, then `cd api && bun test`.

- [ ] **Step 10: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 7 Completed

- `POST /api/chat` now requires the first message's `content` and creates the conversation and
  the message in a single DB transaction — a failed insert can no longer leave an empty
  conversation behind.
- Both `POST /api/chat` and `POST /api/chat/:id/messages` accept an optional `clientMessageId`;
  retries with the same id are safe (`onConflictDoNothing` against a partial unique index on
  `(conversation_id, client_message_id)`), and concurrent conversation starts are safe via
  `onConflictDoNothing` on the existing `(listing_id, buyer_id)` unique constraint.
- Starting a *new* conversation now requires `listing.status === "available"`
  (`LISTING_NOT_CONTACTABLE`, 403); existing conversations and all replies remain usable
  regardless of listing status.
- Verification: `cd api && bun test tests/chat.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 8: Paginated Inbox — Conversations, Messages, Unread, Safe Summaries

**Files:**
- Modify: `api/src/services/chat.service.ts`
- Modify: `api/src/routes/chat.ts`
- Modify: `api/tests/chat.test.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `chatService.listConversations(userId, page, limit)` →
  `{ items: ConversationSummary[], total, page, limit, totalPages }` where
  `ConversationSummary = { id, listingId, lastMessageAt, createdAt, unreadCount, listing:
  { id, title, status, price, currency, primaryImage } | null, participant: { id, name, image } }`
- Produces: `chatService.getMessages(conversationId, userId, page, limit)` →
  `{ items: SafeMessage[], total, page, limit, totalPages }`, ascending by `createdAt`, and
  marks the other participant's unread messages as read as a side effect of the fetch.

- [ ] **Step 1: Write the failing tests**

```ts
test("GET /chat paginates and includes safe listing/participant summaries and unread counts", async () => {
	// ...seed 3 conversations for buyerCookie's user via startConversationWithMessage...
	const res = await chatApp.request("/?page=1&limit=2", { headers: { cookie: buyerCookie } });
	expect(res.status).toBe(200);
	const json = await res.json();
	expect(json.items).toHaveLength(2);
	expect(json.total).toBeGreaterThanOrEqual(3);
	expect(json.items[0].listing).toHaveProperty("title");
	expect(json.items[0].listing).not.toHaveProperty("description"); // allowlisted, not full row
	expect(json.items[0].participant).toHaveProperty("name");
	expect(typeof json.items[0].unreadCount).toBe("number");
});

test("GET /chat/:id/messages paginates ascending and marks the other participant's messages read", async () => {
	const start = await chatApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: buyerCookie },
		body: JSON.stringify({ listingId: availableListingId3, content: "First" }),
	});
	const conversationId = (await start.json()).conversation.id;

	await chatApp.request(`/${conversationId}/messages`, {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: sellerCookie },
		body: JSON.stringify({ content: "Reply from seller" }),
	});

	const asBuyer = await chatApp.request(`/${conversationId}/messages`, {
		headers: { cookie: buyerCookie },
	});
	const buyerJson = await asBuyer.json();
	expect(buyerJson.items[0].content).toBe("First");
	expect(buyerJson.items[1].content).toBe("Reply from seller");
	expect(buyerJson.items[1].isRead).toBe(true); // just marked read by the buyer's fetch

	const list = await chatApp.request("/", { headers: { cookie: buyerCookie } });
	const conv = (await list.json()).items.find((c: any) => c.id === conversationId);
	expect(conv.unreadCount).toBe(0);
});

test("participant isolation: a third user cannot read another pair's conversation", async () => {
	const start = await chatApp.request("/", {
		method: "POST",
		headers: { "Content-Type": "application/json", cookie: buyerCookie },
		body: JSON.stringify({ listingId: availableListingId4, content: "Hi" }),
	});
	const conversationId = (await start.json()).conversation.id;

	const res = await chatApp.request(`/${conversationId}/messages`, {
		headers: { cookie: thirdPartyCookie },
	});
	expect(res.status).toBe(403);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && bun test tests/chat.test.ts`

- [ ] **Step 3: Implement pagination + unread + safe summaries**

In `api/src/services/chat.service.ts`: `listings` is already imported
(`import { listings } from "../db/schemas/listing-schema";`) — do not add it again. The existing
`import { and, desc, eq, or } from "drizzle-orm";` line is missing `sql`, which the code below
needs — change it to `import { and, desc, eq, or, sql } from "drizzle-orm";`. Also add a new
import line for `alias`:

```ts
import { alias } from "drizzle-orm/pg-core";
```

Add near the top of the file:

```ts
const buyerUser = alias(user, "buyer_user");
const sellerUser = alias(user, "seller_user");
```

Replace `listConversations`:

```ts
	async listConversations(userId: string, page = 1, limit = 20) {
		const offset = (page - 1) * limit;
		const whereClause = or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId));

		const rows = await db
			.select({
				id: conversations.id,
				listingId: conversations.listingId,
				buyerId: conversations.buyerId,
				sellerId: conversations.sellerId,
				lastMessageAt: conversations.lastMessageAt,
				createdAt: conversations.createdAt,
				listingTitle: listings.title,
				listingStatus: listings.status,
				listingPrice: listings.price,
				listingCurrency: listings.currency,
				listingMedia: listings.media,
				buyerName: buyerUser.name,
				buyerImage: buyerUser.image,
				sellerName: sellerUser.name,
				sellerImage: sellerUser.image,
				unreadCount: sql<number>`(
					select count(*)::int from ${messages}
					where ${messages.conversationId} = ${conversations.id}
						and ${messages.senderId} != ${userId}
						and ${messages.isRead} = false
				)`,
			})
			.from(conversations)
			.leftJoin(listings, eq(conversations.listingId, listings.id))
			.leftJoin(buyerUser, eq(conversations.buyerId, buyerUser.id))
			.leftJoin(sellerUser, eq(conversations.sellerId, sellerUser.id))
			.where(whereClause)
			.orderBy(desc(conversations.lastMessageAt))
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(conversations)
			.where(whereClause);

		return {
			items: rows.map((row) => {
				const media = Array.isArray(row.listingMedia) ? row.listingMedia : [];
				const primary = media.find((m: any) => m?.isPrimary) ?? media[0];
				return {
					id: row.id,
					listingId: row.listingId,
					lastMessageAt: row.lastMessageAt,
					createdAt: row.createdAt,
					unreadCount: Number(row.unreadCount),
					listing: row.listingTitle
						? {
								id: row.listingId,
								title: row.listingTitle,
								status: row.listingStatus,
								price: row.listingPrice,
								currency: row.listingCurrency,
								primaryImage:
									primary && typeof primary === "object" ? primary.url : primary ?? null,
							}
						: null,
					participant:
						row.buyerId === userId
							? { id: row.sellerId, name: row.sellerName, image: row.sellerImage }
							: { id: row.buyerId, name: row.buyerName, image: row.buyerImage },
				};
			}),
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},
```

Replace `getMessages`:

```ts
	async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
		const [conv] = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId));

		if (!conv) {
			throw new NotFoundError("Not found", "CONVERSATION_NOT_FOUND");
		}
		if (conv.buyerId !== userId && conv.sellerId !== userId) {
			throw new ForbiddenError("Forbidden", "FORBIDDEN");
		}

		await db
			.update(messages)
			.set({ isRead: true })
			.where(
				and(
					eq(messages.conversationId, conversationId),
					sql`${messages.senderId} != ${userId}`,
					eq(messages.isRead, false),
				),
			);

		const offset = (page - 1) * limit;
		const items = await db
			.select({
				id: messages.id,
				conversationId: messages.conversationId,
				senderId: messages.senderId,
				content: messages.content,
				isRead: messages.isRead,
				createdAt: messages.createdAt,
			})
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(desc(messages.createdAt))
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)` })
			.from(messages)
			.where(eq(messages.conversationId, conversationId));

		return {
			items: items.reverse(),
			total: Number(total),
			page,
			limit,
			totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
		};
	},
```

- [ ] **Step 4: Wire pagination query params into the routes**

In `api/src/routes/chat.ts`, add `chatPaginationQuerySchema` to the schema import, then update:

```ts
chatApp.get(
	"/",
	requireAuth(),
	zValidator("query", chatPaginationQuerySchema),
	async (c) => {
		const user = c.get("user");
		const { page, limit } = c.req.valid("query");
		const convs = await chatService.listConversations(user.id, page, limit);
		return c.json(convs);
	},
);
```

```ts
chatApp.get(
	"/:id/messages",
	requireAuth(),
	zValidator("param", idParamSchema),
	zValidator("query", chatPaginationQuerySchema),
	async (c) => {
		const user = c.get("user");
		const { id } = c.req.valid("param");
		const { page, limit } = c.req.valid("query");
		const msgs = await chatService.getMessages(id, user.id, page, limit);
		return c.json(msgs);
	},
);
```

- [ ] **Step 5: Run tests to verify they pass, then the full suite**

Run: `cd api && bun test tests/chat.test.ts`, then `cd api && bun test`.

- [ ] **Step 6: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 8 Completed

- `GET /chat` and `GET /chat/:id/messages` are now paginated (`page`/`limit`) instead of
  returning full history.
- Conversation list rows include an allowlisted `listing` summary (id/title/status/price/
  currency/primaryImage — never the full row) and the other participant's allowlisted summary
  (id/name/image), plus a real `unreadCount`.
- Fetching a thread's messages marks the other participant's unread messages as read.
- Confirmed participant isolation: a user who is neither buyer nor seller on a conversation
  gets 403 from both the messages and (implicitly, via absence) the list endpoint.
- Verification: `cd api && bun test tests/chat.test.ts`, `cd api && bun test` (full suite).
```

---

### Task 9: Full Backend Verification

**Files:**
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

- [ ] **Step 1: Run the full suite one more time**

Run: `cd api && bun test`
Expected: exits 0, all tests pass (not just the files touched in this plan).

- [ ] **Step 2: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Backend Verified

- Full backend test suite passes after Tasks 1–8 (contact consent, public/managed allowlist
  and lifecycle gate, click-analytics gating, favorites membership check, reports test
  hardening, transactional chat start with idempotent retries, paginated inbox).
- Backend contract for the frontend to consume: `contact: { phone, whatsapp, canMessage }` on
  every public listing response; `POST /chat` requires `{ listingId, content, clientMessageId?
  }`; `GET /chat` and `GET /chat/:id/messages` are paginated; `GET /favorites/:listingId` is the
  membership check.
- Verification: `cd api && bun test` (full suite, N tests passing — record actual count here
  when you run it).
```

---

## Frontend

### Task 10: Safe-Redirect Helper + Fix The Login Open Redirect

**Files:**
- Create: `web/src/lib/safe-redirect.ts`
- Modify: `web/src/routes/$locale/_auth/login.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `getSafeRedirectPath(raw: string | undefined, fallback: string): string`
- Consumed by: `login.tsx` now, and by Task 15's "sign-in to reach the intended listing/
  conversation" requirement.

- [ ] **Step 1: Create the helper**

```ts
/**
 * Only same-origin, root-relative paths are ever honored as a post-login redirect target.
 * Anything else (absolute URL, protocol-relative `//host`, javascript: scheme, etc.) falls
 * back to a safe default — this is the only place that decides what "safe" means here.
 */
export function getSafeRedirectPath(
	raw: string | null | undefined,
	fallback: string,
): string {
	if (!raw) return fallback;
	if (!raw.startsWith("/")) return fallback;
	if (raw.startsWith("//")) return fallback;
	if (raw.includes("\\")) return fallback;
	return raw;
}
```

- [ ] **Step 2: Use it in the login route**

In `web/src/routes/$locale/_auth/login.tsx`, wherever `redirectTo` is currently read from the
validated search params and used as `window.location.href = redirectTo ?? \`/${locale}/dashboard\`;`,
change it to:

```ts
import { getSafeRedirectPath } from "@/lib/safe-redirect";
```

```ts
window.location.href = getSafeRedirectPath(redirectTo, `/${locale}/dashboard`);
```

- [ ] **Step 3: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Manual check: log in with `?redirect=https://evil.example.com` in the URL and confirm you land
on `/dashboard`, not the external site; log in with `?redirect=/en/listings/some-id` and confirm
you land on that listing.

- [ ] **Step 4: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 10 Completed

- Added `getSafeRedirectPath()` and used it in the login route, closing an open-redirect gap
  where `?redirect=` was trusted as raw client input straight into `window.location.href`.
- Verification: `cd web && bun run check`, `cd web && bun run build`; manual check that an
  external `?redirect=` value falls back to `/dashboard` and an internal one is honored.
```

---

### Task 11: Seller Contact-Consent Fields In The Listing Form

**Files:**
- Modify: `web/src/lib/schemas/listing-form.ts`
- Modify: `web/src/components/domain/listing-form/listing-form.tsx`
- Modify: `web/src/components/domain/listing-form/review-panel.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `contactPhone`/`contactPhoneEnabled`/`contactWhatsapp`/`contactWhatsappEnabled` on
  `ListingMutationPayload` and on `ListingDetail`/`managedListingDetailQueryOptions` — both added
  in Task 14, Step 1. **Execution order note: run Task 14 before this task**, even though this
  task is numbered earlier — `fromListingDetail` below reads fields Task 14 introduces, and
  writing this task first would not type-check.
- Produces: the same four fields on `ListingFormValues`, `defaultListingFormValues`,
  `toListingMutationPayload`, and `fromListingDetail`.

- [ ] **Step 1: Extend the form schema and mapper**

In `web/src/lib/schemas/listing-form.ts`, add to `listingFormSchema`:

```ts
	contactPhone: z.string().trim().min(6).max(20).optional(),
	contactPhoneEnabled: z.boolean().default(false),
	contactWhatsapp: z.string().trim().min(6).max(20).optional(),
	contactWhatsappEnabled: z.boolean().default(false),
```

Add to `defaultListingFormValues`:

```ts
	contactPhoneEnabled: false,
	contactWhatsappEnabled: false,
```

In `toListingMutationPayload`, add to the returned object:

```ts
		contactPhone: emptyToUndefined(values.contactPhone),
		contactPhoneEnabled: values.contactPhoneEnabled,
		contactWhatsapp: emptyToUndefined(values.contactWhatsapp),
		contactWhatsappEnabled: values.contactWhatsappEnabled,
```

In `fromListingDetail`, add:

```ts
		contactPhone: listing.contactPhone ?? undefined,
		contactPhoneEnabled: Boolean(listing.contactPhoneEnabled),
		contactWhatsapp: listing.contactWhatsapp ?? undefined,
		contactWhatsappEnabled: Boolean(listing.contactWhatsappEnabled),
```

(`listing.contactPhone`/etc. come from the managed-detail read, wired in Task 14's
`managedListingDetailQueryOptions` update — do not read these off the public `ListingDetail`
type's `contact` object, which is a different, derived shape.)

- [ ] **Step 2: Add the toggles to the form**

In `web/src/components/domain/listing-form/listing-form.tsx`, add a "Contact options" section
(after the location fields, before media) with two toggle+input pairs:

Required behavior:
- Two `Switch` + `Input` pairs: "Show a phone number for this listing" /
  "Show a WhatsApp number for this listing", each defaulting **off**.
- Each input is disabled until its switch is on, and is cleared (not pre-filled) when off —
  never read from or pre-fill with the seller's account/session phone number.
- When a switch is turned on with an empty input, show the same inline validation message the
  backend would return (`CONTACT_PHONE_REQUIRED`/`CONTACT_WHATSAPP_REQUIRED`), sourced from
  `web/src/lib/i18n` (add two new keys there, e.g. `listing.contactPhoneRequired` /
  `listing.contactWhatsappRequired`, EN + AR).
- On submit, both fields flow through the existing `onChange`/`values` controlled-component
  pattern already used by every other field in this form.

- [ ] **Step 3: Add the buyer-facing preview to the review panel**

In `web/src/components/domain/listing-form/review-panel.tsx`, add a "What buyers will see"
block:

Required behavior:
- Shows exactly the phone number if `contactPhoneEnabled && contactPhone`, else "Not shown".
- Shows exactly the WhatsApp number if `contactWhatsappEnabled && contactWhatsapp`, else
  "Not shown".
- Always shows "Buyers can message you through Sayaratak" (the in-app chat option is never
  gated by these two toggles — messaging is always available on an `available` listing
  regardless of phone/WhatsApp consent).
- This preview must reflect the *current* form values live, not the last-saved listing, so a
  seller toggling a switch sees the preview change before publishing.

- [ ] **Step 4: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

- [ ] **Step 5: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 11 Completed

- Added phone/WhatsApp consent toggles (default off, never pre-filled from the account phone)
  to the listing create/edit form, plus a live "what buyers will see" preview in the review
  step, satisfying the spec's "consent choices and a public-preview step" requirement.
- Verification: `cd web && bun run check`, `cd web && bun run build`.
```

---

### Task 12: Favorites Query-Options + Real Favorite Button

**Files:**
- Create: `web/src/lib/query-options/favorites.ts`
- Modify: `web/src/lib/query-keys.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `favoriteStatusQueryOptions(locale, listingId)`, `addFavorite(listingId)`,
  `removeFavorite(listingId)`
- Consumed by: Task 14 (listing detail page)

- [ ] **Step 1: Add the query key**

In `web/src/lib/query-keys.ts`, extend `favoriteKeys`:

```ts
export const favoriteKeys = {
	all: (locale: string) => ["favorites", locale] as const,
	list: (locale: string, page?: number) =>
		[...favoriteKeys.all(locale), "list", page ?? 1] as const,
	status: (locale: string, listingId: string) =>
		[...favoriteKeys.all(locale), "status", listingId] as const,
};
```

- [ ] **Step 2: Create the query-options file**

```ts
import { queryOptions } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { favoriteKeys } from "@/lib/query-keys";

export function favoriteStatusQueryOptions(locale: string, listingId: string) {
	return queryOptions({
		queryKey: favoriteKeys.status(locale, listingId),
		queryFn: () =>
			apiGet<{ favorited: boolean }>(`/api/v1/favorites/${listingId}`, { locale }),
		staleTime: 10 * 1000,
	});
}

export const addFavorite = (locale: string, listingId: string) =>
	apiPost<{ success: boolean }>(`/api/v1/favorites/${listingId}`, undefined, { locale });

export const removeFavorite = (locale: string, listingId: string) =>
	apiDelete<{ success: boolean }>(`/api/v1/favorites/${listingId}`, { locale });
```

Check `web/src/lib/api.ts`'s exact `apiPost`/`apiDelete` signatures first (the existing
`web/src/lib/query-options/listings.ts` shows the pattern — match it exactly, including whether
`apiPost` requires a body argument or accepts `undefined`).

- [ ] **Step 3: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

- [ ] **Step 4: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 12 Completed

- Added `favoriteStatusQueryOptions`/`addFavorite`/`removeFavorite` backed by the real
  `/api/v1/favorites/:listingId` endpoints from backend Task 5.
- Verification: `cd web && bun run check`, `cd web && bun run build`.
```

---

### Task 13: Local QR Generation In The Share Sheet

The current `ShareSheet` sends the full listing URL to `https://api.qrserver.com/...` to render
a QR code — an external service seeing every shared listing URl. The spec forbids this. The
minimal compliant fix is to render the QR code entirely client-side, with no network call: add
the small, single-purpose `qrcode` package (no runtime dependencies of its own) and render to a
data URL locally. This is a deliberate, flagged exception to "keep dependencies minimal" because
the alternative (hand-rolling a QR encoder) is far more code than one dependency, and there is no
existing QR capability anywhere in this repo to reuse.

**Files:**
- Modify: `web/package.json`
- Modify: `web/src/components/domain/share-sheet.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

- [ ] **Step 1: Add the dependency**

Run:

```bash
cd web && bun add qrcode
cd web && bun add -d @types/qrcode
```

- [ ] **Step 2: Replace the external QR `<img>`**

In `web/src/components/domain/share-sheet.tsx`, remove the
`<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=..." />` element and
replace it with a locally generated data URL:

```ts
import { useEffect, useState } from "react";
import QRCode from "qrcode";
```

```ts
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		QRCode.toDataURL(shareUrl, { width: 150, margin: 1 })
			.then((url) => {
				if (!cancelled) setQrDataUrl(url);
			})
			.catch(() => {
				if (!cancelled) setQrDataUrl(null);
			});
		return () => {
			cancelled = true;
		};
	}, [shareUrl]);
```

```tsx
{qrDataUrl ? (
	<img src={qrDataUrl} alt="QR code" width={150} height={150} />
) : (
	<div className="size-[150px] rounded-lg bg-muted animate-pulse" />
)}
```

Adapt variable names (`shareUrl`) to whatever the existing component already computes for the
share link — do not change what URL gets encoded, only how the image is produced.

- [ ] **Step 3: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Manual check: open the share sheet, confirm a QR code renders, and confirm (via browser
devtools network tab) that no request to `api.qrserver.com` (or any third party) fires.

- [ ] **Step 4: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 13 Completed

- Replaced the external `api.qrserver.com` QR code call in the share sheet with local
  client-side generation via the `qrcode` package — no listing URL is ever sent to a third
  party for this feature anymore.
- Verification: `cd web && bun run check`, `cd web && bun run build`; confirmed no network
  request to a QR service fires when the share sheet opens.
```

---

### Task 14: Rebuild The Public Listing Detail Page

This is the largest frontend task: remove every fabricated field, wire real contact/status/
favorite data, add category-specific groupings without forking the route into separate files,
and use live listings for alternatives.

**Files:**
- Modify: `web/src/lib/query-options/listings.ts`
- Modify: `web/src/routes/$locale/_public/listings/$id.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: backend `contact` allowlist (Task 3), `favoriteStatusQueryOptions`/`addFavorite`/
  `removeFavorite` (Task 12)
- Changes: `ListingDetail.seller` drops `phone`/`whatsapp`/`rating`/`reviewCount`/`bio`;
  `ListingDetail` gains `contact: { phone: string | null; whatsapp: string | null; canMessage:
  boolean }`.

- [ ] **Step 1: Fix the query-options layer — stop fabricating, wire the real contact object**

In `web/src/lib/query-options/listings.ts`:

Change the `ListingDetail` type's `seller` field (remove `phone`, `whatsapp`, `rating`,
`reviewCount`, `bio` — none of these have a real backing data source for an arbitrary seller
today) and add `contact`:

```ts
export type ListingDetail = ListingItem & {
	description: string;
	specs?: {
		trim?: string;
		[key: string]: any;
	};
	seller: {
		name: string;
		isVerified: boolean;
		accountType: "dealership" | "workshop" | "mechanic" | "user";
		avatarUrl?: string;
	};
	contact: { phone: string | null; whatsapp: string | null; canMessage: boolean };
	status: ListingLifecycleStatus;
	media: { url: string; publicId?: string; isPrimary?: boolean }[];
	// Owner-only fields, present only from managedListingDetailQueryOptions:
	contactPhone?: string | null;
	contactPhoneEnabled?: boolean;
	contactWhatsapp?: string | null;
	contactWhatsappEnabled?: boolean;
};
```

Rewrite `listingDetailQueryOptions`'s success-path mapping (the block that currently runs when
`data?.id` is truthy) to stop inventing data:

```ts
export function listingDetailQueryOptions(locale: string, id: string) {
	return queryOptions({
		queryKey: listingKeys.detail(locale, id),
		queryFn: async (): Promise<ListingDetail> => {
			const data = await apiGet<any>(`/api/v1/listings/${id}`, { locale });

			const city =
				locale === "ar"
					? data.city?.nameAr || data.city?.nameEn
					: data.city?.nameEn || data.city?.nameAr;
			const district =
				locale === "ar"
					? data.district?.nameAr || data.district?.nameEn
					: data.district?.nameEn || data.district?.nameAr;

			return {
				id: data.id,
				title: data.title,
				trim: typeof data.specs?.trim === "string" ? data.specs.trim : undefined,
				price: Number(data.price),
				currency: data.currency || "SDG",
				year: data.year ?? undefined,
				mileage: data.mileage ?? undefined,
				transmission: data.transmission ?? undefined,
				fuelType: data.fuelType ?? undefined,
				condition: data.condition ?? undefined,
				categoryId: data.categoryId ?? undefined,
				makeId: data.makeId ?? undefined,
				modelId: data.modelId ?? undefined,
				cityId: data.cityId ?? undefined,
				districtId: data.districtId ?? undefined,
				city,
				district,
				status: data.status,
				rentalPeriod: data.rentalPeriod ?? undefined,
				description: data.description || "",
				specs: data.specs || {},
				media: Array.isArray(data.media)
					? data.media.map((m: any) => (typeof m === "string" ? { url: m } : m))
					: [],
				images: Array.isArray(data.media)
					? data.media.map((m: any) => (typeof m === "string" ? m : m.url))
					: [],
				isFeatured: Boolean(data.isFeatured),
				seller: {
					name: data.user?.name || "Seller",
					isVerified: Boolean(data.user?.isVerified),
					accountType: data.user?.accountType || "user",
				},
				contact: {
					phone: data.contact?.phone ?? null,
					whatsapp: data.contact?.whatsapp ?? null,
					canMessage: Boolean(data.contact?.canMessage),
				},
				createdAt: data.createdAt,
			};
		},
		staleTime: 60 * 1000,
	});
}
```

Delete the old mock-fallback branch entirely (the `isMockListingFallbackEnabled()` /
`MOCK_SEARCH_LISTINGS.find` / `MOCK_DETAIL_LAND_CRUISER` fallback block that used to run when
the real fetch failed) — a listing detail page must never silently render fabricated content in
place of a real error; let the fetch error propagate to the route's existing loading/error
handling. Leave `MOCK_DETAIL_LAND_CRUISER` and `MOCK_SEARCH_LISTINGS` themselves in the file
only if `listingsQueryOptions`/`managementListingsQueryOptions` still reference them behind the
`VITE_ENABLE_MOCK_DATA` flag (they do, for the list view) — do not delete those, only stop
`listingDetailQueryOptions` from using them.

Also update `managedListingDetailQueryOptions` to carry the four raw contact fields through
(for the edit form, per Task 11):

```ts
				contactPhone: data.contactPhone ?? undefined,
				contactPhoneEnabled: Boolean(data.contactPhoneEnabled),
				contactWhatsapp: data.contactWhatsapp ?? undefined,
				contactWhatsappEnabled: Boolean(data.contactWhatsappEnabled),
```

and drop its `phone`/`whatsapp` lines under `seller` (same reasoning — `user.phone` no longer
exists in any backend response).

- [ ] **Step 2: Strip fabricated content from the route component**

In `web/src/routes/$locale/_public/listings/$id.tsx`:

Remove the hardcoded 5-image Unsplash fallback (lines ~76-82) — if `listing.images` is empty,
show a single neutral placeholder graphic (reuse whatever placeholder pattern
`ListingCard`/`listing-card.tsx` already uses for a missing image, for visual consistency), not
stock photos of a car that isn't this listing.

Remove `sellerPhone`/`sellerWhatsapp` derived from `listing.seller?.phone`/`whatsapp` (that
field no longer exists) and replace every use of them with `listing.contact.phone` /
`listing.contact.whatsapp` respectively (the `Call`/`WhatsApp` buttons' `disabled`/`href`
conditions, in both the main content seller card and the sticky sidebar card).

Remove the hardcoded "Negotiable" badge (both occurrences) entirely — there is no field
recording negotiability.

Replace the hardcoded "Available"/"متاح" badge (both occurrences — main header and sticky
sidebar) with a status-driven badge:

```ts
const STATUS_BADGE: Record<
	string,
	{ en: string; ar: string; className: string }
> = {
	available: {
		en: "Available",
		ar: "متاح",
		className: "bg-emerald-50 text-emerald-700",
	},
	reserved: {
		en: "Reserved",
		ar: "محجوز",
		className: "bg-amber-50 text-amber-700",
	},
	sold: { en: "Sold", ar: "مباع", className: "bg-slate-200 text-slate-600" },
	rented: {
		en: "Rented",
		ar: "مؤجر",
		className: "bg-slate-200 text-slate-600",
	},
};
```

```tsx
const statusBadge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.available;
```

```tsx
<Badge className={`${statusBadge.className} border-0 px-2 py-0.5 rounded`}>
	{locale === "ar" ? statusBadge.ar : statusBadge.en}
</Badge>
```

When `listing.status !== "available"`, additionally show a one-line banner directly under the
title: "This listing is closed" / "هذا الإعلان مغلق" (new keys under `t.listing`, EN+AR), and
disable the `Call`/`WhatsApp`/`Send Message` buttons regardless of `listing.contact` values
(defense in depth — `contact.canMessage`/`phone`/`whatsapp` are already `null`/`false` from the
backend in this state, but the buttons should visibly communicate why, not just silently do
nothing).

Remove every fabricated spec cell that has no backing listing field: Trim's `"VX.R 4.0L"`
fallback (keep the field, just render nothing/`"—"` when `listing.trim` is empty, do not
fallback to a fake trim), Drivetrain `"4WD"` (remove the row entirely — no such field exists),
Engine Size `"4.0L V6"` (remove the row — no such field exists unless it comes from
`listing.specs.engineSize`, which does exist per the earlier listing-form `specs` bag; render
`listing.specs?.engineSize` and hide the row if absent, don't hardcode a value), Exterior/
Interior Color (same — render `listing.specs?.exteriorColor`/`interiorColor` if present, hide
the row otherwise, no hardcoded "White Pearl"/"Beige"), VIN Status `"Verified"` (remove the row
entirely — there is no VIN verification system), Registered City `"Khartoum"` (remove the row —
redundant with the real `listing.city` already shown at the top), Service History `"Full
Service History"` (remove the row — no such field), Posted On (replace the hardcoded `"May 24,
2025"` with a real formatted `listing.createdAt` date, or remove the row if `createdAt` is
absent — never hardcode a date), Listing ID (replace the hardcoded `"STK-2025-0524-00178"` with
the real `listing.id`, or remove the row).

Remove the hardcoded description fallback paragraph about a "Toyota Land Cruiser" — if
`listing.description` is empty, show nothing (an empty description section, or hide the section
entirely) rather than fabricated prose about a different vehicle.

Remove the seller rating stars block entirely (`listing.seller?.rating`/`reviewCount` no longer
exist on the type) — keep the `isVerified` badge (that one is real, backed by
`dealerships.isVerified`), remove the `bio` paragraph (no real field backs it).

Remove the `6-pill` "Body Type" cell's `"SUV"` fallback (`listing.vehicleType?.toUpperCase() ||
"SUV"`) — hide the cell if `vehicleType` is absent, don't guess.

Remove the "Mileage" 6-pill fallback of `"60,000 km"` and the "Year" fallback of `"2020"` — show
"—" (or hide the cell) when the real field is absent, never substitute a plausible-looking fake
number.

- [ ] **Step 3: Add category-specific groupings in the same file**

Add a small helper near the top of the component (not a separate route or page file — one file,
branching render output):

```ts
function getListingKind(listing: ListingDetail): "rental" | "parts" | "vehicle" {
	if (listing.rentalPeriod) return "rental";
	if (listing.categoryId === "cat-spare-parts") return "parts";
	return "vehicle";
}
```

Required behavior for the Specifications section based on `getListingKind(listing)`:
- `"vehicle"`: keep the existing year/make/model/mileage/transmission/fuel-type/condition grid
  (with the fabricated cells already removed in Step 2).
- `"rental"`: same vehicle grid, plus one additional real-data row showing
  `${listing.price} ${listing.currency} / ${listing.rentalPeriod}` (e.g. "SDG 50,000 / daily")
  directly in the price block instead of a bare price — do not add booking dates, availability
  calendars, or a security-deposit figure; the spec's assumption is one recorded price and
  period, nothing more.
- `"parts"`: a smaller grid appropriate to a part (condition, compatible make/model if present
  in `specs`, price) — omit vehicle-only fields like mileage/transmission/fuel-type/year
  entirely rather than showing them empty.

Verify the actual `categoryId` value used for spare parts against
`web/src/lib/query-options/taxonomy.ts` or the taxonomy seed data (the mock catalog in this same
file uses `"cat-spare-parts"` — confirm that matches the real seeded category slug/id before
relying on it, and adjust `getListingKind` if the real id differs).

- [ ] **Step 4: Wire the real favorite button**

Replace the `useState(isFavorited)` local toggle with:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addFavorite,
	favoriteStatusQueryOptions,
	removeFavorite,
} from "@/lib/query-options/favorites";
import { favoriteKeys } from "@/lib/query-keys";
import { authClient } from "@/lib/auth-client";
```

```ts
	const { data: session } = authClient.useSession();
	const { data: favoriteStatus } = useQuery({
		...favoriteStatusQueryOptions(locale, id),
		enabled: Boolean(session?.user),
	});
	const queryClient = useQueryClient();
	const favoriteMutation = useMutation({
		mutationFn: () =>
			favoriteStatus?.favorited ? removeFavorite(locale, id) : addFavorite(locale, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: favoriteKeys.status(locale, id) });
		},
	});

	function handleFavoriteClick() {
		if (!session?.user) {
			navigate({
				to: "/$locale/login",
				params: { locale },
				search: { redirect: `/${locale}/listings/${id}` },
			});
			return;
		}
		favoriteMutation.mutate();
	}
```

Replace both `onClick={() => setIsFavorited(!isFavorited)}` call sites with
`onClick={handleFavoriteClick}`, and both `isFavorited ? ... : ...` render branches with
`favoriteStatus?.favorited ? ... : ...`. Disable the button while `favoriteMutation.isPending`.

Confirm the exact `authClient.useSession()` import/usage shape against
`web/src/lib/auth-client.ts` and the exact login route path/search-param name against Task 10's
`login.tsx` before finalizing this snippet — adjust names to match if they differ from the
guess above.

- [ ] **Step 5: Real related listings, remove Recently Viewed**

Replace the `MOCK_SEARCH_LISTINGS.filter(...)` related-listings line with a real query:

```ts
	const { data: relatedData } = useQuery(
		listingsQueryOptions(locale, {
			categoryId: listing.categoryId,
			status: "available",
			limit: 5,
			page: 1,
		}),
	);
	const relatedListings = (relatedData?.items ?? [])
		.filter((l) => l.id !== id)
		.slice(0, 4);
```

Delete the entire "4. Recently Viewed" `<section>` (the one rendering
`MOCK_SEARCH_LISTINGS.slice(0, 2)`) — the spec calls for removing this, not replacing it with a
real recently-viewed tracking feature (that would be new scope beyond this plan).

- [ ] **Step 6: Wire the Send Message CTA to depend on real contact/status state**

Both "Send Message" buttons currently just `navigate({ to: `/${locale}/messages` })` with no
listing context. Change both to:

```ts
navigate({
	to: "/$locale/messages",
	params: { locale },
	search: { startListingId: id },
});
```

(if unauthenticated, use the same `getSafeRedirectPath`-driven login redirect pattern as the
favorite button first). For this to type-check now (TanStack Router validates `search` against
the target route's schema at the call site), also add the search-param declaration to the
messages route in this same step:

```ts
import { z } from "zod";
```

```ts
export const Route = createFileRoute("/$locale/_dashboard/dashboard/messages")({
	validateSearch: z.object({ startListingId: z.string().optional() }),
	component: MessagesPage,
});
```

This is only the typed param declaration — the actual compose-and-send behavior that reads
`startListingId` is built in Task 16 (which builds on this same `validateSearch`, not a second
one — Task 16 must not re-declare it).

- [ ] **Step 7: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Manual check across an `available`, a `reserved`/`sold`/`rented`, and (as an authenticated
owner via `/manage/:id` — not this public route) a `draft` listing: confirm no fabricated field
renders anywhere, the status badge and closed-listing banner are correct, Call/WhatsApp buttons
only enable when `contact.phone`/`contact.whatsapp` are non-null, and related listings are real
available listings in the same category.

- [ ] **Step 8: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 14 Completed

- Rebuilt the public listing detail page: removed every fabricated field (gallery fallback,
  negotiable badge, fake specs cells, fake description fallback, fake rating/reviewCount/bio,
  hardcoded availability badge, Recently Viewed mock section).
- Wired real `contact`, `status`, and `favorite` state; added a status-driven badge and a
  closed-listing banner for reserved/sold/rented.
- Added vehicle/rental/parts-specific spec groupings inside the same route file (no forked page
  implementations).
- Related listings now come from a real `listingsQueryOptions` call scoped to the same category
  and `status: "available"`.
- Verification: `cd web && bun run check`, `cd web && bun run build`; manual pass across
  available/closed/draft listings.
```

---

### Task 15: Chat Query-Options + WebSocket Client Hook

**Files:**
- Create: `web/src/lib/query-options/chat.ts`
- Create: `web/src/lib/use-chat-socket.ts`
- Modify: `web/src/lib/query-keys.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `conversationsQueryOptions(locale, page, limit)`,
  `conversationMessagesQueryOptions(locale, conversationId, page, limit)`,
  `startConversation(locale, { listingId, content, clientMessageId })`,
  `sendMessage(locale, conversationId, { content, clientMessageId })`
- Produces: `useChatSocket(onMessage: (msg: ChatMessage) => void)` — connects to
  `/api/chat/ws`, reconnects with backoff, and exposes `connected: boolean`.

- [ ] **Step 1: Update `chatKeys`**

In `web/src/lib/query-keys.ts`, replace `chatKeys` with a locale/page-aware version:

```ts
export const chatKeys = {
	all: (locale: string) => ["chat", locale] as const,
	conversations: (locale: string, page = 1) =>
		[...chatKeys.all(locale), "conversations", page] as const,
	messages: (locale: string, conversationId: string, page = 1) =>
		[...chatKeys.all(locale), "messages", conversationId, page] as const,
};
```

- [ ] **Step 2: Create the query-options file**

```ts
import { queryOptions } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { chatKeys } from "@/lib/query-keys";

export type ConversationSummary = {
	id: string;
	listingId: string;
	lastMessageAt: string;
	createdAt: string;
	unreadCount: number;
	listing: {
		id: string;
		title: string;
		status: string;
		price: number;
		currency: string;
		primaryImage: string | null;
	} | null;
	participant: { id: string; name: string | null; image: string | null };
};

export type ConversationsResponse = {
	items: ConversationSummary[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	isRead: boolean;
	createdAt: string;
};

export type MessagesResponse = {
	items: ChatMessage[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export function conversationsQueryOptions(locale: string, page = 1, limit = 20) {
	return queryOptions({
		queryKey: chatKeys.conversations(locale, page),
		queryFn: () =>
			apiGet<ConversationsResponse>("/api/chat", {
				locale,
				params: { page, limit },
			}),
		staleTime: 10 * 1000,
	});
}

export function conversationMessagesQueryOptions(
	locale: string,
	conversationId: string,
	page = 1,
	limit = 30,
) {
	return queryOptions({
		queryKey: chatKeys.messages(locale, conversationId, page),
		queryFn: () =>
			apiGet<MessagesResponse>(`/api/chat/${conversationId}/messages`, {
				locale,
				params: { page, limit },
			}),
		staleTime: 5 * 1000,
	});
}

export const startConversation = (
	locale: string,
	payload: { listingId: string; content: string; clientMessageId?: string },
) =>
	apiPost<{
		conversation: { id: string };
		message: ChatMessage;
		isNewConversation: boolean;
	}>("/api/chat", payload, { locale });

export const sendMessage = (
	locale: string,
	conversationId: string,
	payload: { content: string; clientMessageId?: string },
) => apiPost<ChatMessage>(`/api/chat/${conversationId}/messages`, payload, { locale });
```

Check `web/src/lib/api.ts`'s exact `apiGet` params signature (does it take `{ locale, params }`
like `listings.ts` shows, and does it serialize nested objects the same way) before finalizing —
match the established pattern exactly.

- [ ] **Step 3: Create the WebSocket hook**

```ts
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/query-options/chat";

type ChatSocketEvent = { type: "chat_message"; data: ChatMessage };

export function useChatSocket(onMessage: (msg: ChatMessage) => void) {
	const [connected, setConnected] = useState(false);
	const onMessageRef = useRef(onMessage);
	onMessageRef.current = onMessage;

	useEffect(() => {
		let socket: WebSocket | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let closedByCleanup = false;
		let attempt = 0;

		function connect() {
			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			socket = new WebSocket(`${protocol}//${window.location.host}/api/chat/ws`);

			socket.onopen = () => {
				attempt = 0;
				setConnected(true);
			};

			socket.onmessage = (event) => {
				try {
					const parsed = JSON.parse(event.data) as ChatSocketEvent;
					if (parsed.type === "chat_message") {
						onMessageRef.current(parsed.data);
					}
				} catch {
					// Ignore malformed frames.
				}
			};

			socket.onclose = () => {
				setConnected(false);
				if (closedByCleanup) return;
				attempt += 1;
				const delay = Math.min(1000 * 2 ** attempt, 15000);
				reconnectTimer = setTimeout(connect, delay);
			};

			socket.onerror = () => {
				socket?.close();
			};
		}

		connect();

		return () => {
			closedByCleanup = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			socket?.close();
		};
	}, []);

	return { connected };
}
```

Note: the backend's `/api/chat/ws` upgrade route authenticates via the session cookie already
attached to same-origin requests (see `api/src/routes/chat.ts`'s `GET /ws` handler) — this hook
relies on the browser sending that cookie automatically on the WebSocket handshake, so it must
be used only on same-origin deployments (true for this app's TanStack Start setup). If the
frontend and API are ever split across origins, this hook needs a token-based auth query param
instead — out of scope for this plan.

- [ ] **Step 4: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

- [ ] **Step 5: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 15 Completed

- Added `web/src/lib/query-options/chat.ts` (paginated conversations/messages,
  `startConversation`, `sendMessage`) and `web/src/lib/use-chat-socket.ts` (reconnect with
  exponential backoff, capped at 15s).
- Verification: `cd web && bun run check`, `cd web && bun run build`.
```

---

### Task 16: Wire "Send Message" Into A Real Compose Flow

**Files:**
- Modify: `web/src/routes/$locale/_public/listings/$id.tsx` (only if Task 14's Step 6 needs a
  follow-up once this task's inbox contract is final — check before editing)
- Modify: `web/src/routes/$locale/_dashboard/dashboard/messages.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

This task and Task 17 both land in the same file; they're split because this task is "arrives
from a listing with something to say" and Task 17 is "the general inbox experience," but do them
in the same sitting since Task 17 depends on this task's route shape.

- [ ] **Step 1: Confirm the `startListingId` route search param is in place**

Task 14, Step 6 already added `validateSearch: z.object({ startListingId: z.string().optional()
})` to this route (needed there so the listing detail page's typed `navigate()` call would
compile). Confirm it's present — do not declare `validateSearch` a second time.

- [ ] **Step 2: When `startListingId` is present and no conversation exists yet, show a compose box**

Required behavior:
- On mount, if `startListingId` is set, look up whether a conversation for that listing already
  exists in the loaded `conversationsQueryOptions` list (matching `item.listingId ===
  startListingId`); if found, select that thread immediately (skip straight to Task 17's thread
  view).
- If not found, show a small compose panel (listing title/price fetched via
  `listingDetailQueryOptions(locale, startListingId)` for context, a textarea, and a "Send"
  button) instead of the "select a conversation" empty state.
- On submit, call `startConversation(locale, { listingId: startListingId, content,
  clientMessageId: crypto.randomUUID() })`. Generate the `clientMessageId` once per compose
  attempt (store it in component state before the first submit) and reuse the same value on
  retry after a failure, so a retried submit cannot double-send.
- On success, invalidate `chatKeys.conversations(locale)` and select the newly returned
  `conversation.id` as the active thread.
- On failure with `code === "LISTING_NOT_CONTACTABLE"`, show "This listing is closed and can no
  longer start a new conversation" / the Arabic equivalent inline, and do not clear the
  composed text (so the user doesn't lose it, even though it can't be sent).
- On any other failure, show a generic inline retry-safe error (same `clientMessageId`, so
  retrying is safe) — never show a success state for a failed send.

- [ ] **Step 3: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Manual check: from an available listing's detail page, click "Send Message" while logged out
(confirm redirect-to-login-then-back works via Task 10's helper), then while logged in (confirm
compose panel appears, send works, and a second click of the listing's message CTA re-opens the
same existing thread instead of composing again).

- [ ] **Step 4: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 16 Completed

- The inbox route now accepts `?startListingId=`, reuses an existing conversation for that
  listing if one exists, and otherwise shows a compose panel that calls the new transactional
  `startConversation` with a stable `clientMessageId` (safe to retry).
- `LISTING_NOT_CONTACTABLE` failures show an inline explanation instead of a generic error.
- Verification: `cd web && bun run check`, `cd web && bun run build`; manual compose flow from
  a real listing, logged out and logged in.
```

---

### Task 17: Rebuild The Inbox — Paginated List, Thread View, Unread, Live Updates

**Files:**
- Modify: `web/src/routes/$locale/_dashboard/dashboard/messages.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

- [ ] **Step 1: Replace `mockConversations` with the real paginated query**

Remove the `mockConversations` array entirely. Use:

```ts
const [page, setPage] = useState(1);
const { data, isLoading, isError } = useQuery(conversationsQueryOptions(locale, page));
```

Required behavior for the conversation list:
- Render `data.items` (each a `ConversationSummary` from Task 15) instead of the mock shape —
  map `participant.name`/`participant.image` to the avatar block, `listing.title`/
  `listing.primaryImage`/`listing.price`+`listing.currency` to the listing-preview snippet
  (formatting the price the same way the listing detail page already does), `unreadCount` to
  the unread pill (hide the pill when `0`, matching the existing conditional-render pattern
  already in this file), and `lastMessageAt` to the timestamp (format via whatever date-util the
  rest of this codebase already uses — check `web/src/lib` for an existing relative-time
  helper before adding a new one).
- When `listing` is `null` (listing was hard-deleted), show a neutral "Listing no longer
  available" placeholder in that slot instead of erroring.
- Loading/empty/error states follow the same pattern already established in
  `web/src/routes/$locale/_dashboard/dashboard/listings.tsx` (Task 6 of the prior phase) —
  reuse that pattern rather than inventing a new one.
- Replace the static "Showing 1 to 5 of 28 conversations" / "Load more ↓" footer with real
  values from `data.total`/`data.page`/`data.totalPages`, and wire "Load more" (or pagination
  controls) to `setPage`.

- [ ] **Step 2: Add the thread view**

Required behavior:
- Selecting a conversation from the list loads
  `conversationMessagesQueryOptions(locale, conversationId, page)` and renders messages
  ascending (already ordered that way by the backend), grouping consecutive messages from the
  same sender loosely (simple visual grouping, not a new data concept).
- A reply compose box at the bottom calls `sendMessage(locale, conversationId, { content,
  clientMessageId: crypto.randomUUID() })`, generating a fresh `clientMessageId` per send
  attempt (reused only on retry of that same attempt, same pattern as Task 16).
- After a successful send, invalidate both
  `chatKeys.messages(locale, conversationId, page)` and
  `chatKeys.conversations(locale, page)` (to refresh `lastMessageAt`/ordering).
- If the conversation's `listing.status !== "available"`, show a small banner above the compose
  box — "This listing is closed, but you can still reply" / Arabic equivalent — reply must stay
  enabled (the backend already allows it unconditionally).
- Replying while `!connected` (from Task 15's `useChatSocket`) still works over plain HTTP —
  the socket only affects live receipt of the *other* participant's messages, never sending.

- [ ] **Step 3: Wire the WebSocket for the active thread + fallback refresh**

```ts
const queryClient = useQueryClient();
const { connected } = useChatSocket((message) => {
	if (message.conversationId === activeConversationId) {
		queryClient.setQueryData(
			chatKeys.messages(locale, message.conversationId, 1),
			(old: MessagesResponse | undefined) =>
				old
					? { ...old, items: [...old.items, message] }
					: old,
		);
	}
	queryClient.invalidateQueries({ queryKey: chatKeys.conversations(locale) });
});
```

Required behavior:
- When `connected` is `false` for more than a few seconds (the socket is reconnecting), fall
  back to periodically refetching the active thread's messages (e.g. `refetchInterval: 5000`
  only while `!connected && activeConversationId`, otherwise disabled) so messages still arrive
  without a live socket — the spec's "visible-thread refresh fallback."
- Only refetch/poll the currently *visible* thread, not every conversation in the list.

- [ ] **Step 4: Verify**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Manual check with two browser sessions (or one normal + one incognito) logged in as the buyer
and seller from Task 16's compose test: send a message from one side, confirm it appears on the
other side live (socket connected) and confirm unread counts update after the recipient opens
the thread; then simulate a closed-listing conversation and confirm replying still works with
the "closed, but you can still reply" banner shown.

- [ ] **Step 5: Record task**

Append to the handoff:

```md
### Listing-Conversation Flow — Task 17 Completed

- Replaced the mock inbox with the real paginated conversation list, thread view, and reply
  compose, wired to the backend from Tasks 7–8.
- Live updates via `useChatSocket`; falls back to a 5s poll of the visible thread only when the
  socket isn't connected.
- Closed-listing conversations show a "closed, but you can still reply" banner and remain fully
  usable for replies.
- Verification: `cd web && bun run check`, `cd web && bun run build`; manual two-session live
  message test.
```

---

### Task 18: Frontend Verification And Handoff

**Files:**
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

- [ ] **Step 1: Run full frontend checks**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: both exit 0 (record any pre-existing, unrelated warnings/failures separately from
anything this plan introduced).

- [ ] **Step 2: Manual browser verification**

With backend and frontend running, walk through, as one seller account and one separate buyer
account, in both `en` and `ar`, at phone/tablet/desktop widths:
- Publish an available listing with phone consent on, WhatsApp consent off.
- As the buyer: view the detail page, confirm only the phone contact option is live, favorite
  it, report it (confirm validation + success state), share it (confirm the QR renders with no
  third-party network call), send a first message.
- As the seller: reply from the inbox; confirm the buyer sees it live via the socket.
- As the seller: mark the listing `sold`; as the buyer, reload the detail page and confirm the
  closed banner, disabled contact buttons, and that the existing conversation still opens and
  accepts replies from both sides.
- Confirm RTL layout correctness in Arabic throughout (contact buttons, badges, compose box).

- [ ] **Step 3: Update the handoff**

Record: completed files/features, exact commands run, manual browser results, remaining
warnings, and any backend contract mismatch found during integration.

- [ ] **Step 4: Commit guidance**

Before committing, inspect the diff — this plan touches schema, services, routes, and several
frontend files across two unrelated concerns (listing/lifecycle and chat). Prefer separate
commits along those lines:
- Backend: listing contact-consent + allowlist + lifecycle (Tasks 1–4)
- Backend: favorites/reports test hardening (Tasks 5–6)
- Backend: chat rebuild (Tasks 7–8)
- Frontend: login redirect fix + listing form contact fields (Tasks 10–11)
- Frontend: listing detail rebuild + favorites + QR fix (Tasks 12–14)
- Frontend: chat/inbox rebuild (Tasks 15–17)

---

## Self-Review

**Spec coverage:**
- "Establish the data contract" (contact fields, consent, never-copy-account-phone, public
  allowlist): Tasks 1, 2, 3, 11.
- "Fix lifecycle behavior" (available/reserved/sold/rented/draft/rejected/banned visibility,
  no-new-contact-when-closed): Task 3 (detail reads), Task 4 (click gating), Task 7 (chat start
  gating). Sitemap/noindex-for-closed-listings from the spec's bullet 2 is **not** covered by
  this plan — `api/src/services/seo.service.ts`'s sitemap generation already filters to
  `status = "available"` only (confirmed during research), so closed listings already leave the
  sitemap with no code change needed; explicit `noindex` metadata for a closed-but-viewable
  listing's `<meta>` tag was not found to exist yet and is not added here — flagging this as a
  gap for a follow-up rather than silently expanding this plan's scope further.
- "Rebuild the detail experience" (real media/price/rental-period/status/location/seller,
  category groupings, remove fabrication, live alternatives, keep gallery/share/report, no
  external QR): Tasks 12, 13, 14.
- "Connect buyer actions" (favorite membership check, report validation/success, gated
  analytics, validated redirect): Tasks 4, 5, 6 (report dialog was already correct, verified,
  not rebuilt), 10, 12, 14.
- "Make messaging real" (transactional first message, uniqueness + client id, replies survive
  closure, paginated inbox, unread, safe summaries, WebSocket + reconnect + fallback): Tasks 7,
  8, 15, 16, 17.

**Explicitly out of scope / flagged, not silently dropped:**
- `pending` status treated as publicly-inaccessible (same as `draft`) — see Global Constraints.
- `noindex` metadata for closed listings — sitemap exclusion already existed; explicit
  `<meta name="robots">` handling was not found and is not added in this plan.
- A media-signature ownership gap found during research (`api/src/services/media.service.ts`
  allows signing for a non-existent `entityId` without a 404) is unrelated to this feature's
  data path (media upload isn't touched by this plan) and is not fixed here — worth a separate,
  small follow-up.

**Placeholder scan:** no `TBD`/`TODO`/"add appropriate handling" remain; every step has literal
code or an explicit, concrete behavior list.

**Type consistency:** `ListingDetail.contact`, `ConversationSummary`, `ChatMessage`,
`MessagesResponse`, `ConversationsResponse` are defined once (Tasks 14–15) and referenced by
name in every later task that consumes them; backend `contact`/`isClosed` shape from Task 3
matches the frontend mapping in Task 14 field-for-field
(`phone`/`whatsapp`/`canMessage`).
