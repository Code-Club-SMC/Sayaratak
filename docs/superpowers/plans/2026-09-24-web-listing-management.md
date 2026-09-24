# Web Listing Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated, backend-backed listing creation and management flow for Sayaratak web.

**Architecture:** Implement a typed frontend listing domain layer, then compose it into a shared listing form workflow. Creation is draft-first because media signatures require a backend-owned listing id; media upload and verification happen after draft creation and before publish.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, React, TypeScript, Zod, Tailwind CSS, shadcn/ui, Cloudinary signed uploads through backend endpoints only.

**Spec:** `docs/superpowers/specs/2026-09-24-web-listing-management-design.md`

## Global Constraints

- Backend is Bun, Hono, Drizzle ORM, PostgreSQL.
- Frontend is TanStack Start, TanStack Router, Tailwind CSS, shadcn/ui, first-class RTL via `DirectionProvider`.
- Authentication is `better-auth`.
- Media must use Cloudinary signed uploads through existing backend helpers; do not introduce S3/R2 or direct unsigned upload paths.
- Public/client routes use ids for listings.
- Error responses are `{ error: string, code: string, details?: any }`.
- Do not show success on failed mutations.
- Preserve English/Arabic locale routing and RTL layouts.
- Public UI models must use explicit allowlists; never spread full backend rows.
- Run `cd web && bun run check` and `cd web && bun run build` before completion.
- After each completed implementation block, update `docs/web-frontend-handoff-2026-09-24.md`.

---

## File Structure

- Modify `web/src/lib/api.ts`: make JSON parsing safe for empty/non-JSON error responses.
- Modify `web/src/lib/query-keys.ts`: add listing management and media query/mutation key factories.
- Modify `web/src/lib/query-options/listings.ts`: add create/update/delete/status helpers and owner listing query helpers.
- Create `web/src/lib/query-options/media.ts`: add media signature/verify helpers and Cloudinary upload helper.
- Modify `api/src/schemas/listings.ts`: add authenticated owner-listing query schema.
- Modify `api/src/services/listings.service.ts`: add owner/admin management reads that include non-public statuses.
- Modify `api/src/routes/listings.ts`: add authenticated `GET /me` and `GET /manage/:id` before public `/:id`.
- Modify `api/tests/listings.test.ts`: cover auth, ownership, draft detail, and status-filtered owner list.
- Create `web/src/lib/schemas/listing-form.ts`: typed Zod form schema, default values, backend payload mapper.
- Create `web/src/components/domain/listing-form/listing-form.tsx`: reusable create/edit form shell.
- Create `web/src/components/domain/listing-form/media-uploader.tsx`: signed media upload/verify UI.
- Create `web/src/components/domain/listing-form/review-panel.tsx`: final review/publish panel.
- Create `web/src/routes/$locale/_dashboard/dashboard/listings/new.tsx`: authenticated create listing route.
- Create `web/src/routes/$locale/_dashboard/dashboard/listings/$id/edit.tsx`: authenticated edit listing route.
- Modify `web/src/routes/$locale/_dashboard/dashboard/listings.tsx`: replace mock listing table/cards with backend-backed management.
- Modify navigation files only where needed to point post-ad CTAs to the new route.
- Update `docs/web-frontend-handoff-2026-09-24.md` after every task.

---

### Task 1: Listing Domain API And Query Keys

**Files:**
- Modify: `web/src/lib/api.ts`
- Modify: `web/src/lib/query-keys.ts`
- Modify: `web/src/lib/query-options/listings.ts`
- Create: `web/src/lib/query-options/media.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces: `ListingMutationPayload`, `ListingManagementItem`, `ListingStatus`, `MediaUploadSignature`, `VerifiedMediaAsset`
- Produces helpers: `createListing`, `updateListing`, `deleteListing`, `updateListingStatus`, `mediaSignature`, `verifyMediaAsset`, `uploadToCloudinary`
- Consumed by later tasks: listing form, create route, edit route, dashboard management route

- [x] **Step 1: Harden API JSON parsing**

Replace the response parsing block in `api<T>()` with logic equivalent to:

```ts
const text = await response.text();
const data = text ? safeJsonParse(text) : undefined;

if (!response.ok) {
	const errorObject =
		data && typeof data === "object" && !Array.isArray(data)
			? (data as Record<string, unknown>)
			: {};

	throw new ApiRequestError({
		error:
			typeof errorObject.error === "string"
				? errorObject.error
				: "An unexpected error occurred",
		code:
			typeof errorObject.code === "string"
				? errorObject.code
				: "UNKNOWN_ERROR",
		details: errorObject.details,
		status: response.status,
	});
}

return data as T;
```

Add:

```ts
function safeJsonParse(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}
```

- [x] **Step 2: Add query keys**

Add listing management keys:

```ts
managementLists: (locale: string) =>
	[...listingKeys.all(locale), "management"] as const,
managementList: (locale: string, filters: ListingFilters) =>
	[...listingKeys.managementLists(locale), filters] as const,
```

Add media keys:

```ts
export const mediaKeys = {
	all: () => ["media"] as const,
	signature: (entityType: string, entityId: string) =>
		[...mediaKeys.all(), "signature", entityType, entityId] as const,
};
```

- [x] **Step 3: Add listing mutation types and helpers**

Add these exact union types:

```ts
export type ListingStatus = "draft" | "available" | "reserved" | "sold" | "rented";

export type ListingMediaInput = string | {
	url: string;
	publicId?: string;
	isPrimary?: boolean;
};

export type ListingMutationPayload = {
	categoryId: string;
	makeId?: string;
	modelId?: string;
	countryId: string;
	cityId: string;
	districtId?: string;
	title: string;
	description: string;
	price: number;
	currency?: string;
	status?: ListingStatus;
	lat?: number;
	lng?: number;
	year?: number;
	mileage?: number;
	transmission?: string;
	fuelType?: string;
	condition?: string;
	specs?: Record<string, unknown>;
	media?: ListingMediaInput[];
	rentalPeriod?: "daily" | "weekly" | "monthly";
};
```

Add helpers:

```ts
export const createListing = (locale: string, payload: ListingMutationPayload) =>
	apiPost<ListingDetail>("/api/v1/listings", payload, { locale });

export const updateListing = (
	locale: string,
	id: string,
	payload: Partial<ListingMutationPayload>,
) => apiPut<ListingDetail>(`/api/v1/listings/${id}`, payload, { locale });

export const updateListingStatus = (
	locale: string,
	id: string,
	status: ListingStatus,
) => apiPatch<ListingDetail>(`/api/v1/listings/${id}/status`, { status }, { locale });

export const deleteListing = (locale: string, id: string) =>
	apiDelete<{ success: boolean }>(`/api/v1/listings/${id}`, { locale });
```

- [x] **Step 4: Add management list query helper**

Add:

```ts
export function managementListingsQueryOptions(
	locale: string,
	filters: ListingFilters = { page: 1, limit: 20 },
) {
	return queryOptions({
		queryKey: listingKeys.managementList(locale, filters),
		queryFn: () =>
			apiGet<BackendListingsResponse>("/api/v1/listings", {
				locale,
				params: filters,
			}).then((data) => ({
				...data,
				items: data.items.map((item) => mapBackendListing(item, locale)),
			})),
		staleTime: 30 * 1000,
	});
}
```

- [x] **Step 5: Add media helpers**

Create `web/src/lib/query-options/media.ts`:

```ts
import { apiPost } from "@/lib/api";

export type MediaEntityType = "listing" | "profile" | "page";

export type MediaUploadSignature = {
	apiKey?: string;
	cloudName?: string;
	timestamp?: number;
	signature?: string;
	folder?: string;
	publicId?: string;
	uploadPreset?: string;
	params?: Record<string, string | number | boolean>;
};

export type VerifiedMediaAsset = {
	url: string;
	publicId?: string;
	isPrimary?: boolean;
};

export type CloudinaryUploadResult = {
	secure_url?: string;
	url?: string;
	public_id?: string;
};

export const mediaSignature = (
	entityType: MediaEntityType,
	entityId: string,
) =>
	apiPost<MediaUploadSignature>("/api/v1/media/signature", {
		entityType,
		entityId,
	});

export const verifyMediaAsset = (
	entityType: MediaEntityType,
	entityId: string,
	publicId: string,
) =>
	apiPost<VerifiedMediaAsset>("/api/v1/media/verify", {
		entityType,
		entityId,
		publicId,
	});

export async function uploadToCloudinary(
	file: File,
	signature: MediaUploadSignature,
): Promise<CloudinaryUploadResult> {
	const cloudName = signature.cloudName;
	if (!cloudName) {
		throw new Error("Cloudinary cloud name is missing from upload signature");
	}

	const formData = new FormData();
	formData.set("file", file);

	for (const [key, value] of Object.entries(signature.params ?? {})) {
		formData.set(key, String(value));
	}

	if (signature.apiKey) formData.set("api_key", signature.apiKey);
	if (signature.timestamp) formData.set("timestamp", String(signature.timestamp));
	if (signature.signature) formData.set("signature", signature.signature);
	if (signature.folder) formData.set("folder", signature.folder);
	if (signature.publicId) formData.set("public_id", signature.publicId);
	if (signature.uploadPreset) formData.set("upload_preset", signature.uploadPreset);

	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
		{ method: "POST", body: formData },
	);

	const data = (await response.json()) as CloudinaryUploadResult & {
		error?: { message?: string };
	};

	if (!response.ok) {
		throw new Error(data.error?.message ?? "Cloudinary upload failed");
	}

	return data;
}
```

- [x] **Step 6: Verify task**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected:
- both commands exit 0
- existing warnings may remain

- [x] **Step 7: Record task**

Append to the handoff:

```md
### Phase 2 - Task 1 Completed

- Added typed listing mutation helpers and management query keys.
- Added media signing, Cloudinary upload, and backend verify helper types.
- Hardened API JSON parsing for empty/non-JSON responses.
- Verification: `cd web && bun run check`, `cd web && bun run build`.
```

---

### Task 1A: Authenticated Owner Listing Reads

**Files:**
- Modify: `api/src/schemas/listings.ts`
- Modify: `api/src/services/listings.service.ts`
- Modify: `api/src/routes/listings.ts`
- Modify: `api/tests/listings.test.ts`
- Modify: `web/src/lib/query-options/listings.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Produces backend endpoints: `GET /api/v1/listings/me`, `GET /api/v1/listings/manage/:id`
- Produces frontend helper: `managedListingDetailQueryOptions(locale, id)`
- Consumed by later tasks: edit route and My Listings dashboard

- [x] **Step 1: Add owner query schema**

Add an owner-visible lifecycle status enum containing:

```ts
["draft", "available", "reserved", "sold", "rented", "pending", "rejected", "banned"]
```

Add `getMyListingsQuerySchema` with `page`, `limit`, and optional `status`.

- [x] **Step 2: Add service reads**

Add `findMyListings(currentUser, query)` and `getManagedListingById(id, currentUser)`.

Rules:
- `findMyListings` always filters by `listings.userId === currentUser.id`.
- `getManagedListingById` returns `404` when missing.
- `getManagedListingById` returns `403` when the listing is owned by another user and current user is not admin.
- Neither method applies public `available` status filtering.
- Both methods use explicit field selection.

- [x] **Step 3: Add routes before public `/:id`**

Add:

```ts
listingsApp.get("/me", requireAuth(), zValidator("query", getMyListingsQuerySchema), ...)
listingsApp.get("/manage/:id", requireAuth(), zValidator("param", idParamSchema), ...)
```

These must be registered before `listingsApp.get("/:id", ...)`.

- [x] **Step 4: Add tests**

Test:
- no session on `/me` returns `401`
- owner can list their own draft
- owner can fetch their own draft via `/manage/:id`
- non-owner cannot fetch another user's managed listing
- public `/:id` still returns `410` for non-available listing

- [x] **Step 5: Update frontend helper**

Add `managedListingDetailQueryOptions(locale, id)` using `/api/v1/listings/manage/:id`.
Change `managementListingsQueryOptions` to read from `/api/v1/listings/me`.

- [x] **Step 6: Verify task**

Run:

```bash
cd api && bun test
cd web && bun run check
cd web && bun run build
```

- [x] **Step 7: Record task**

Append backend owner-read completion and verification notes to the handoff.

---

### Task 2: Shared Listing Form Schema And Mapper

**Files:**
- Create: `web/src/lib/schemas/listing-form.ts`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `ListingMutationPayload`, `ListingStatus`, `ListingMediaInput`
- Produces: `listingFormSchema`, `ListingFormValues`, `defaultListingFormValues`, `toListingMutationPayload`, `fromListingDetail`

- [x] **Step 1: Create schema file**

Create a Zod schema with these validations:

```ts
import { z } from "zod";
import type {
	ListingDetail,
	ListingMediaInput,
	ListingMutationPayload,
	ListingStatus,
} from "@/lib/query-options/listings";

export const listingStatusSchema = z.enum([
	"draft",
	"available",
	"reserved",
	"sold",
	"rented",
]);

export const listingFormSchema = z.object({
	categoryId: z.string().min(1),
	makeId: z.string().optional(),
	modelId: z.string().optional(),
	countryId: z.string().min(1),
	cityId: z.string().min(1),
	districtId: z.string().optional(),
	title: z.string().trim().min(3),
	description: z.string().trim().min(10),
	price: z.coerce.number().nonnegative(),
	currency: z.string().default("SDG"),
	status: listingStatusSchema.default("draft"),
	lat: z.coerce.number().optional(),
	lng: z.coerce.number().optional(),
	year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
	mileage: z.coerce.number().int().min(0).optional(),
	transmission: z.string().optional(),
	fuelType: z.string().optional(),
	condition: z.string().optional(),
	trim: z.string().optional(),
	engineSize: z.string().optional(),
	exteriorColor: z.string().optional(),
	interiorColor: z.string().optional(),
	media: z.array(z.union([
		z.string(),
		z.object({
			url: z.string().url(),
			publicId: z.string().optional(),
			isPrimary: z.boolean().optional(),
		}),
	])).default([]),
	rentalPeriod: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;
```

- [x] **Step 2: Add defaults and mapper helpers**

Add:

```ts
export const defaultListingFormValues: ListingFormValues = {
	categoryId: "",
	countryId: "",
	cityId: "",
	title: "",
	description: "",
	price: 0,
	currency: "SDG",
	status: "draft",
	media: [],
};

function emptyToUndefined(value: string | undefined): string | undefined {
	return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function toListingMutationPayload(
	values: ListingFormValues,
	status: ListingStatus = values.status,
): ListingMutationPayload {
	const specs: Record<string, unknown> = {};
	for (const [key, value] of Object.entries({
		trim: values.trim,
		engineSize: values.engineSize,
		exteriorColor: values.exteriorColor,
		interiorColor: values.interiorColor,
	})) {
		if (typeof value === "string" && value.trim().length > 0) {
			specs[key] = value.trim();
		}
	}

	return {
		categoryId: values.categoryId,
		makeId: emptyToUndefined(values.makeId),
		modelId: emptyToUndefined(values.modelId),
		countryId: values.countryId,
		cityId: values.cityId,
		districtId: emptyToUndefined(values.districtId),
		title: values.title.trim(),
		description: values.description.trim(),
		price: values.price,
		currency: values.currency || "SDG",
		status,
		lat: values.lat,
		lng: values.lng,
		year: values.year,
		mileage: values.mileage,
		transmission: emptyToUndefined(values.transmission),
		fuelType: emptyToUndefined(values.fuelType),
		condition: emptyToUndefined(values.condition),
		specs,
		media: values.media as ListingMediaInput[],
		rentalPeriod: values.rentalPeriod,
	};
}
```

- [x] **Step 3: Add detail-to-form mapper**

Add:

```ts
export function fromListingDetail(listing: ListingDetail): ListingFormValues {
	return {
		...defaultListingFormValues,
		categoryId: listing.categoryId ?? "",
		makeId: listing.makeId,
		modelId: listing.modelId,
		countryId: "",
		cityId: listing.cityId ?? "",
		districtId: listing.districtId,
		title: listing.title,
		description: listing.description ?? "",
		price: listing.price,
		currency: listing.currency ?? "SDG",
		status: (listing.status as ListingStatus | undefined) ?? "draft",
		year: listing.year,
		mileage: listing.mileage,
		transmission: listing.transmission,
		fuelType: listing.fuelType,
		condition: listing.condition,
		trim: typeof listing.specs?.trim === "string" ? listing.specs.trim : undefined,
		engineSize:
			typeof listing.specs?.engineSize === "string"
				? listing.specs.engineSize
				: undefined,
		exteriorColor:
			typeof listing.specs?.exteriorColor === "string"
				? listing.specs.exteriorColor
				: undefined,
		interiorColor:
			typeof listing.specs?.interiorColor === "string"
				? listing.specs.interiorColor
				: undefined,
		media: Array.isArray(listing.media)
			? listing.media.map((item) =>
					typeof item === "string"
						? item
						: {
								url: item.url,
								publicId: item.publicId,
								isPrimary: item.isPrimary,
							},
				)
			: [],
	};
}
```

- [x] **Step 4: Verify task**

Run:

```bash
cd web && bun run check
```

Expected: exits 0.

- [x] **Step 5: Record task**

Append to the handoff with schema, mapper, and verification notes.

---

### Task 3: Reusable Listing Form Components

**Files:**
- Create: `web/src/components/domain/listing-form/listing-form.tsx`
- Create: `web/src/components/domain/listing-form/media-uploader.tsx`
- Create: `web/src/components/domain/listing-form/review-panel.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `ListingFormValues`, `listingFormSchema`, taxonomy/location query options, media helpers
- Produces: `ListingForm`, `MediaUploader`, `ReviewPanel`

- [x] **Step 1: Build controlled form shell**

Implement `ListingForm` as a controlled component:

```ts
type ListingFormProps = {
	locale: string;
	values: ListingFormValues;
	onChange: (next: ListingFormValues) => void;
	onSubmit: () => void;
	submitLabel: string;
	isSubmitting: boolean;
	error?: string;
	mode: "create" | "edit";
};
```

Use existing UI primitives: `Button`, `Input`, `Textarea`, `Label`, `Select`, `Tabs`, `Alert`.

Required behavior:
- load categories, makes, models, countries, cities, districts through query options
- disable model select until make is selected
- disable district select until city is selected
- preserve values while option queries are loading
- show validation errors only after submit attempt or field blur
- no nested cards

- [x] **Step 2: Build media uploader**

Implement `MediaUploader`:

```ts
type MediaUploaderProps = {
	listingId: string;
	value: ListingMediaInput[];
	onChange: (next: ListingMediaInput[]) => void;
	disabled?: boolean;
};
```

Required behavior:
- accept images only
- request `mediaSignature("listing", listingId)` per selected file
- call `uploadToCloudinary(file, signature)`
- require `public_id` from Cloudinary result
- call `verifyMediaAsset("listing", listingId, public_id)`
- append verified media only
- mark the first media item as primary if none exists
- show per-file pending/success/error state

- [x] **Step 3: Build review panel**

Implement `ReviewPanel`:

```ts
type ReviewPanelProps = {
	values: ListingFormValues;
	onBack: () => void;
	onPublish: () => void;
	isPublishing: boolean;
	error?: string;
};
```

Required behavior:
- display title, price, location ids/names where available, description, specs, and media count
- publish button disabled while publishing
- no success state unless backend mutation succeeds

- [x] **Step 4: Verify task**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: both exit 0.

- [x] **Step 5: Record task**

Append component completion and verification notes to the handoff.

---

### Task 4: Create Listing Route

**Files:**
- Create: `web/src/routes/$locale/_dashboard/dashboard/listings/new.tsx`
- Modify: post-ad CTAs in header/mobile/dashboard navigation if they currently point to dashboard instead of new listing
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `ListingForm`, `MediaUploader`, `ReviewPanel`, `createListing`, `updateListing`, `updateListingStatus`
- Produces: `/dashboard/listings/new`

- [x] **Step 1: Add route**

Route state:

```ts
type CreateStep = "details" | "media" | "review" | "success";
```

Required mutation flow:

```ts
const draft = await createListing(locale, toListingMutationPayload(values, "draft"));
setDraftId(draft.id);
```

Then media step uploads against `draft.id`.

Then:

```ts
await updateListing(locale, draftId, {
	media: values.media,
});
await updateListingStatus(locale, draftId, "available");
```

- [x] **Step 2: Cache invalidation**

On successful draft/create/publish, invalidate:

```ts
queryClient.invalidateQueries({ queryKey: listingKeys.lists(locale) });
queryClient.invalidateQueries({ queryKey: listingKeys.managementLists(locale) });
```

- [x] **Step 3: Failure behavior**

Required behavior:
- draft creation failure keeps user on details step
- media failure keeps user on media step
- publish failure keeps user on review step
- draft id is preserved after media/publish failure
- success page links to public listing and My Listings

- [x] **Step 4: Verify route generation**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: route tree generation succeeds as part of build/check.

- [x] **Step 5: Record task**

Append create route completion and verification notes to the handoff.

---

### Task 5: Edit Listing Route

**Files:**
- Create: `web/src/routes/$locale/_dashboard/dashboard/listings/$id/edit.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `ListingForm`, `MediaUploader`, `listingDetailQueryOptions`, `updateListing`
- Produces: `/dashboard/listings/:id/edit`

- [ ] **Step 1: Add loader/query**

Use `listingDetailQueryOptions(locale, id)` in the route loader and `useQuery` in the component.

- [ ] **Step 2: Initialize form from backend detail**

Use `fromListingDetail(data)` once data is available. Do not overwrite dirty local edits after initialization.

- [ ] **Step 3: Save edits**

On submit:

```ts
await updateListing(locale, id, toListingMutationPayload(values, values.status));
```

Invalidate detail and management list:

```ts
queryClient.invalidateQueries({ queryKey: listingKeys.detail(locale, id) });
queryClient.invalidateQueries({ queryKey: listingKeys.managementLists(locale) });
```

- [ ] **Step 4: Verify task**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: both exit 0.

- [ ] **Step 5: Record task**

Append edit route completion and verification notes to the handoff.

---

### Task 6: My Listings Dashboard Management

**Files:**
- Modify: `web/src/routes/$locale/_dashboard/dashboard/listings.tsx`
- Modify: `web/src/components/domain/dashboard/listing-actions-menu.tsx`
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: `managementListingsQueryOptions`, `updateListingStatus`, `deleteListing`
- Produces: backend-backed list management view

- [ ] **Step 1: Replace mock list source**

Use:

```ts
const { data, isLoading, isError, refetch } = useQuery(
	managementListingsQueryOptions(locale, { page, limit: 20 }),
);
```

Do not fall back to mock authenticated listing data in production.

- [ ] **Step 2: Add status actions**

Actions call:

```ts
await updateListingStatus(locale, listingId, nextStatus);
```

Allowed frontend actions:
- draft -> available
- available -> reserved
- reserved -> available
- available -> sold
- reserved -> sold
- available -> rented

Backend rejection remains authoritative.

- [ ] **Step 3: Add delete confirmation**

Use existing alert dialog primitives. On confirm:

```ts
await deleteListing(locale, listingId);
await queryClient.invalidateQueries({
	queryKey: listingKeys.managementLists(locale),
});
```

No optimistic delete in this phase.

- [ ] **Step 4: Wire edit action**

Edit action navigates to:

```ts
/$locale/dashboard/listings/$id/edit
```

- [ ] **Step 5: Verify task**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: both exit 0.

- [ ] **Step 6: Record task**

Append dashboard management completion and verification notes to the handoff.

---

### Task 7: Browser Verification And Final Handoff

**Files:**
- Modify: `docs/web-frontend-handoff-2026-09-24.md`

**Interfaces:**
- Consumes: all completed tasks
- Produces: final verified Phase 2 notes

- [ ] **Step 1: Run full frontend checks**

Run:

```bash
cd web && bun run check
cd web && bun run build
```

Expected: both exit 0.

- [ ] **Step 2: Run manual browser verification**

With backend and frontend running, verify:
- `/en/dashboard/listings/new`
- `/ar/dashboard/listings/new`
- create draft
- upload and verify image
- publish listing
- listing appears in My Listings
- edit listing
- change status
- delete listing
- failed mutation displays error instead of success

- [ ] **Step 3: Update handoff**

Record:
- completed files/features
- exact commands run
- manual browser results
- remaining warnings
- any backend contract mismatch found during integration

- [ ] **Step 4: Commit guidance**

Before committing, inspect diff because Phase 1 Biome formatting touched many files. Prefer separate commits:
- tooling/format cleanup
- listing domain data layer
- listing form/create/edit
- dashboard management

---

## Self-Review

Spec coverage:
- Draft-first create flow: Task 4.
- Cloudinary signing and verify: Tasks 1 and 3.
- Create/edit/status/delete: Tasks 4, 5, and 6.
- TanStack Query keys/invalidation: Tasks 1, 4, 5, and 6.
- EN/AR and RTL verification: Task 7.
- Handoff recording: every task.

Placeholder scan:
- No `TBD`, `TODO`, or deferred unspecified task remains.

Type consistency:
- `ListingStatus`, `ListingMutationPayload`, `ListingMediaInput`, `ListingFormValues`, and mutation helper names are defined before use.
