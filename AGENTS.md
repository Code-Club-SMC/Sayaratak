# Agent Rules for Sayaratak

Please follow these strict guidelines when writing code or making architectural decisions for this project. These rules apply to both backend and frontend environments.

## 0. Commands (Backend — `/api`)

Run these exactly as written. Do not substitute `npm`/`yarn`/`node` equivalents.

```bash
bun run dev          # dev server, hot reload (bun run --hot src/index.ts)
bun test             # run full test suite
bun run db:generate  # generate a new migration from schema changes (drizzle-kit generate)
bun run db:migrate   # apply pending migrations (drizzle-kit migrate)
bun run db:seed      # seed the database
```

- After any schema change under `db/schemas/`, run `db:generate` then `db:migrate` before writing routes against it.
- Run `bun test` (full suite) before considering any finding/PR complete — not just the new test file in isolation, per Section 7.

*(Frontend commands — add once the TanStack Start app is scaffolded.)*

## 1. Type Definitions & Schemas

- **Always use `type` instead of `interface`.** Example: Use `type User = { ... }` rather than `interface User { ... }`.
- Validate all incoming data using Zod at the route/controller boundary.
- For Drizzle ORM, ensure schemas are well-commented and use standard timestamps (`createdAt`, `updatedAt`).
- **Deletion policy is explicit per table, not assumed.** Every table needs a stated choice: hard delete, soft delete (`isActive`), or protected-from-delete (specific rows blocked entirely, e.g. legal pages). Don't default to hard delete without recording the decision in a schema comment.
- **Accountability field on admin-editable content.** Tables editable via the admin dashboard should include `updatedBy` (FK to `users.id`), populated from session on every write.
- **Bilingual fields need a stated completeness policy.** Any table with nullable `*Ar` columns alongside required English columns must document, in a schema comment, what happens when Arabic is missing (block publish, or fallback-with-notice) — never leave this implicit.

## 2. Simplicity First (Pragmatic Engineering)

- **Avoid complex code — but this applies to architecture, not to correctness or security.** Don't over-engineer solutions, don't add unnecessary abstraction layers (heavy Service/Repository patterns) unless route-handler logic becomes truly unmanageable, and don't reach for heavy infrastructure (e.g. PostGIS) before a simple approach (e.g. Haversine SQL) is proven insufficient.
- **This rule is never a reason to skip:** ownership/authorization checks, input sanitization, edge-case handling (missing/null fields, race conditions), or tests for the above. "Simple" means fewer moving parts, not fewer safety checks. If a feature seems to need a validation or auth check that feels like it's adding complexity, add it anyway and flag it for review rather than omitting it.

## 3. Tech Stack & Environment

- **Backend:** Bun, Hono, Drizzle ORM, PostgreSQL.
- **Frontend:** TanStack Start (React), TanStack Router (`{-$locale}` based routing), Tailwind CSS, shadcn/ui (with first-class RTL support via `DirectionProvider`).
- **Authentication:** `better-auth`.
- **Media:** Cloudinary (signed uploads, not S3/R2 presigned URLs) — see `lib/cloudinary.ts` for the shared signing/verification/delivery helpers. Do not introduce a parallel S3/R2 upload path for images.
- **Database:** Keep schema lean. Use `JSONB` for polymorphic data (like vehicle specifications) to avoid table explosion.
- **Scheduled jobs:** cron-style jobs (e.g. media cleanup) must be idempotent (safe to run twice, no-op gracefully on already-handled records) and must run on a single instance/trigger, not per-replica `setInterval`, to avoid duplicate execution once horizontally scaled.

## 4. API Design, i18n & Error Handling

- Keep Hono routes flat and modular.
- Always return clean JSON payloads (e.g., flatten joined relational data so the frontend doesn't have to untangle it).
- **Structured Error Contracts:** Error responses (`status >= 400`) must return `{ error: string, code: string, details?: any }`.
- **Multi-Language (i18n):**
  - Respect RFC 9110 `Accept-Language` headers and query parameter overrides (`?lang=`, `?locale=`) via a single, centralized `resolveLocale()` — this must be the *only* locale-resolution implementation in the codebase. No route may implement its own separate locale check.
  - System error strings are localized via `ERROR_DICTIONARY`.
  - **Zod validation errors are localized by issue type, not by literal message.** Use a custom Zod `errorMap` keyed on `issue.code` (`too_small`, `invalid_type`, `invalid_string`, etc.), not a lookup of hardcoded English strings — validation messages are generated per-schema and can't be pre-enumerated in a static dictionary.
  - Localized error/success messages that need embedded data (slug names, retry timers, counts) must support interpolation (e.g. `{slug}`, `{seconds}` placeholders) — a static string dictionary alone can't express this.
- Use proper HTTP status codes (201 for created, 400 for validation errors, 401/403 for auth, 404/410 for missing/sold resources).

## 5. Shared Conventions (Do Not Reimplement Per-Feature)

- **Entity identifier convention:** Public and client-facing routes use slugs for `page`, `category`, `make` and IDs for `listing`, `dealership`, `workshop`, `mechanic`. Any new route resolving entities by type (SEO metadata, share links, public lookups, etc.) must branch on this same convention via a shared resolver — don't reimplement slug-vs-id logic per feature. *(Intentional exception: Admin management/mutation routes like `/admin/pages/:id` use immutable primary key IDs rather than slugs to avoid self-inflicted mutation hazards when updating slug values).*
- **Canonical/public URL construction is a single shared helper.** Anything that needs to build a public-facing URL for an entity (SEO `canonical`, `hreflang` alternates, share-link redirect targets, sitemap entries) must use one shared URL-building function. Divergent implementations will eventually disagree with each other.
- **Ownership verification is required whenever a user references another entity by ID**, not just authentication. Examples: a signed upload request scoped to `listings/{id}/` must confirm the requester owns that listing; an attach/verify step must confirm the reported asset belongs to the requesting user. Authenticated ≠ authorized to act on a specific resource.
- **Redirect targets must always be server-derived**, never accepted as raw client input, to avoid open-redirect vulnerabilities on any tracked-link or callback endpoint.

## 6. Security & Performance

- Never return sensitive data (passwords, tokens) in API responses.
- **Public API responses and structured data (JSON-LD, OpenGraph, etc.) must use explicit field allowlists — never spread or serialize a full DB row.** This is how internal-only fields (personal phone/address, internal notes, other PII) accidentally leak into public output.
- Rely on database-level constraints (foreign keys, cascading deletes) for data integrity **between tables in this database** — but note DB constraints cannot clean up state in external services. Any entity with associated Cloudinary assets (or other third-party resources) needs an explicit application-level cascade-delete call on entity removal, plus a scheduled cleanup job for orphaned/abandoned uploads that were never attached.
- Filter crawler/bot pre-fetches (WhatsApp, Facebookexternalhit, TelegramBot, Twitterbot, etc.) on tracking/redirect endpoints to prevent engagement metrics from being inflated by link-preview unfurling rather than real clicks.
- **Rate-limit any endpoint that triggers real cost** (external API calls, signed upload generation, translation calls) per-user, not just per-IP.
- Keep dependencies minimal to ensure low data consumption and fast performance.

## 7. Testing Standards

Every new endpoint's test suite must cover, at minimum:
- **Happy path** (valid input, expected success response)
- **Auth boundary** (no session → `401`; wrong role → `403`)
- **Ownership boundary**, if the endpoint references another user's resource by ID (mismatched owner → `403`)
- **Invalid input** (`400` — missing required fields, wrong format/type)
- **Not-found / gone** (`404`/`410` for missing or deactivated resources)
- Any security constraint stated in that feature's design (sanitization, PII allowlist, rate limit, bot filtering) — if a hardening requirement exists, it needs a corresponding test, not just an implementation.

Passing tests for the happy path alone is not sufficient to consider a finding complete.

## 8. Visual Explanations & Diagrams (Mermaid)

- **Proactively use Mermaid diagrams** to explain architectures, complex logic, data flows, and state transitions to the user:
  - **Flowcharts (`flowchart TD` / `flowchart LR`):** For decision logic, user journeys, and routing workflows.
  - **Sequence Diagrams (`sequenceDiagram`):** For Frontend <-> Backend <-> Database interactions and auth flows.
  - **ER Diagrams (`erDiagram`):** For database tables, column relationships, and foreign keys.
  - **State Diagrams (`stateDiagram-v2`):** For entity lifecycles (e.g., listing status: `draft` → `available` → `reserved` → `sold`).
