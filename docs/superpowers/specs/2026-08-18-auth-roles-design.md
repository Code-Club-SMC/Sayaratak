# Authentication & Roles Management — Design

**Project:** Sayaratak
**Date:** 2026-08-18
**Scope:** Auth milestone (web + admin dashboard). Covers identity, sessions, roles, account types, email verification, OAuth, password reset, admin bootstrap. Does NOT cover listings, messaging, subscriptions, payments.

## Context

Sayaratak is a Sudan automotive marketplace (cars, trucks, tuk-tuks, motorcycles, rickshaws, spare parts, workshops, mechanics). Platforms in scope for this project: responsive web + admin dashboard (shared TanStack Start app). Android/iOS out of scope for now.

Stack: Bun + Hono.js + PostgreSQL + Drizzle (API), TanStack Start (web/admin).

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Role model | Single role per user, chosen at signup, admin-only change. `role` NOT NULL. |
| 2 | Profile storage | Separate `dealerships`, `workshops`, `mechanics` tables, 1:1 to user, created at signup. General users have no profile table (the `user` row is their seller identity). |
| 3 | Admin creation | `POST /api/admin/create` gated by `x-secret-key` header (env var). Only way to make an admin. No admin-creates-admin. |
| 4 | Phone login | Out of scope. Phone is a profile field only. OTP login deferred. |
| 5 | OAuth role flow | Account type chosen before OAuth redirect, carried as state. Role never null. |
| 6 | Email verification | Block login until verified (`requireEmailVerification: true`). |
| 7 | Email transport | Nodemailer (SMTP creds in `.env`). Resend unused. |
| 8 | Role approach | Better Auth `admin` plugin manages `role` (admin\|user); frontend-settable `accountType` custom field handles marketplace type (user\|dealership\|workshop\|mechanic). |

## Approach

Better Auth `admin` plugin + `accountType` custom field.

- `admin` plugin gives: `role` (admin|user), `banned`/`banReason`/`banExpires` columns, and admin endpoints (`createUser`, `listUsers`, `setRole`, `banUser`/`unbanUser`, `removeUser`, `impersonateUser`). Matches admin dashboard needs (SCR-075 user management + ban).
- `accountType` is a frontend-settable `additionalFields` column on `user`. Holds the marketplace account type chosen at signup (SCR-026). Decides which profile table (if any) gets created.
- The plugin's `role` is NOT frontend-settable (sign-up uses `defaultRole: "user"`); only server-side `setRole` can change it. This is why `accountType` is a separate field — it lets users self-select their marketplace type at signup without needing a post-signup admin call.

## Data Model

### Better Auth tables (generated via `@better-auth/cli generate`)

**user**
- id, name, email, emailVerified, image
- role (admin|user, default "user")  ← admin plugin
- banned (bool), banReason, banExpires  ← admin plugin
- accountType (user|dealership|workshop|mechanic, NOT NULL, default "user")  ← custom field
- phone (nullable), cityId (nullable FK→cities), preferredLanguage (default "en"), preferredCurrency (default "SDG")  ← custom fields
- createdAt, updatedAt

**session**
- id, userId, token, expiresAt, ipAddress, userAgent, impersonatedBy (admin plugin), createdAt, updatedAt

**account**
- id, userId, providerId (google|facebook|credential), accountId, accessToken, refreshToken, expiresAt, createdAt, updatedAt

**verification**
- id, identifier, value/token, expiresAt, createdAt

### Profile tables (drizzle, 1:1 to user)

Created at signup via `databaseHooks.user.create.after` when `accountType` ≠ `user`. Skeleton rows — user fills details later.

**dealerships**
- id, userId (unique FK), name, logoUrl, coverUrl, description, phone, cityId (FK), districtId (FK), lat, lng
- isVerified (default false), ratingAvg (default 0), ratingCount (default 0)
- createdAt, updatedAt

**workshops**
- id, userId (unique FK), name, logoUrl, cityId (FK), districtId (FK), address, lat, lng, phone, workingHours (json)
- isVerified (default false), ratingAvg (default 0), ratingCount (default 0)
- createdAt, updatedAt

**mechanics**
- id, userId (unique FK), name, profilePicUrl, phone, whatsapp, cityId (FK), yearsExperience, specialization, bio
- isVerified (default false), ratingAvg (default 0), ratingCount (default 0)
- createdAt, updatedAt

General users (`accountType = "user"`) have no profile table — phone/city/language/currency live on the `user` row. General users can buy and sell; their `user` row is the seller identity.

## Better Auth Config (`api/lib/auth.ts`)

- `database: db` (drizzle adapter)
- `trustedOrigins: ["http://localhost:3000"]`
- `emailAndPassword: { enabled: true, requireEmailVerification: true }`
- `emailVerification: { sendOnSignUp: true, sendVerificationEmail }` → nodemailer transport
- `emailAndPassword.sendResetPassword` → nodemailer transport
- `socialProviders: { google, facebook }` (creds from env)
- `plugins: [admin({ defaultRole: "user" })]`
- `user.additionalFields: { accountType, phone, cityId, preferredLanguage, preferredCurrency }`
- `emailAndPassword.customSyntheticUser` includes admin-plugin fields (`role:"user"`, `banned:false`, `banReason:null`, `banExpires:null`) per docs (needed because `requireEmailVerification` uses synthetic-user protection)
- `databaseHooks.user.create.after` inserts skeleton business row based on `accountType`

### Nodemailer transport

Shared mailer (`api/src/lib/mailer.ts`):
```ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
```
`sendVerificationEmail` and `sendResetPassword` callbacks build a nodemailer message with the verification/reset URL pointing at the web app.

## Authentication Flows

### Admin creation (header-gated)

`POST /api/admin/create` — custom Hono route, outside Better Auth's `/auth/*`.
- Checks `x-secret-key` header against `ADMIN_CREATE_SECRET` env var → 401 if missing/wrong
- Body: `{ email, password, name }`
- Calls `auth.api.createUser({ body: { email, ...requiredFields } })` (server API, no session needed) with `role: "admin"` and forced `accountType: "user"`
- Returns `{ id, email, name, role: "admin" }` or maps Better Auth errors to 4xx
- Only admin creation path. No admin-creates-admin.

### Email+password signup (frontend)

Flow: SCR-026 (pick accountType) → SCR-028 (fill form) → submit.
- `authClient.signUp.email({ email, password, name, accountType, phone, cityId })`
- Better Auth creates user; `databaseHooks.user.create.after` inserts skeleton business row if `accountType` ∈ {dealership, workshop, mechanic}
- `sendOnSignUp` → nodemailer sends verification email
- `requireEmailVerification: true` blocks login until verified
- `customSyntheticUser` includes admin-plugin fields (per docs)

### OAuth signup (Google/Facebook)

Flow: SCR-026 (pick accountType) → click Google/Facebook → callback.
- accountType carried as OAuth `state` param (signed/encoded) from the frontend before redirect
- On callback, `databaseHooks.user.create.before` reads accountType from state and stamps it on the new user; `.after` hook inserts business row if needed
- OAuth users: `emailVerified` set by provider (Google/Facebook emails trusted) → no verification email, can log in immediately
- If email already exists with a different accountType → error "account exists, sign in instead" (no silent overwrite)

### Sign in

- `authClient.signIn.email({ email, password })` or `authClient.signIn.social({ provider })`
- Better Auth checks `emailVerified` (email users), `banned` (admin plugin) → returns ban message if banned
- Session cookie set; `useSession()` on frontend reads role + accountType

### Forgot / reset password

- `authClient.forgetPassword({ email })` → Better Auth calls `sendResetPassword` → nodemailer sends reset link with token
- `authClient.resetPassword({ newPassword, token })` → verifies token, updates password, revokes sessions
- Email users only. OAuth users trying forgot-password get "use your Google/Facebook sign-in".

## Authorization (RBAC middleware)

Small Hono middleware factories in `api/src/middleware/auth.ts`:

- `requireRole(...roles: ("admin"|"user")[])`
- `requireAccountType(...types: ("user"|"dealership"|"workshop"|"mechanic")[])`

Behavior:
- Reads session via `auth.api.getSession({ headers })`
- No session → 401
- Session user `banned` → 403
- `role` not in allowed → 403
- `accountType` not in allowed → 403
- Otherwise `c.set("user", session.user)` for handlers

Route protection examples:
- `/api/admin/*` (Better Auth admin endpoints) → wrapped so only `role:"admin"` passes
- Future listing routes: `requireAccountType("user","dealership")` for creating sale listings
- Dealership workspace routes → `requireAccountType("dealership")`
- Workshop/mechanic routes → `requireAccountType("workshop","mechanic")`

## CORS + basePath

- `app.basePath("/api")`; auth handler at `/auth/*` → final path `/api/auth/*`
- CORS middleware with credentials on `/api/auth/*`, `/api/admin/*`, and custom routes

## Frontend Auth Wiring (TanStack Start)

### Auth client (`web/src/lib/auth-client.ts`)

```ts
createAuthClient<typeof auth>({
  baseURL: "http://localhost:3001/api",
  plugins: [adminClient()],
});
```
Typed against server `auth` via `createAuthClient<typeof auth>()`. Methods: `signUp.email`, `signIn.email`, `signIn.social`, `signOut`, `useSession`, `forgetPassword`, `resetPassword`, `admin.*` (admin dashboard only).

### Routes (TanStack Router file-based)

Auth screens — layout `routes/(auth)/`:
- `select-account-type.tsx` → SCR-026
- `login.tsx` → SCR-027
- `register.tsx` → SCR-028 (reads accountType from search param; fields vary by type)
- `forgot-password.tsx` → SCR-030
- `reset-password.tsx` → SCR-031 (reads token from search param)
- `verify-email.tsx` → post-signup "check your email" landing; link in email points here with token, calls `verifyEmail`, redirects to login on success
- `oauth-callback.tsx` → reads accountType from sessionStorage, lets Better Auth finish, redirects by accountType

Public marketing — layout `routes/(public)/`:
- `index.tsx` → SCR-001 homepage (later milestone)
- `about.tsx`, `contact.tsx`, `privacy.tsx`, `terms.tsx` → SCR-021/022/024/025 (static, later)

Protected — layout `routes/(protected)/`:
- `account/index.tsx` → SCR-041 user overview
- `account/profile.tsx` → SCR-042
- `account/settings.tsx` → SCR-052
- `dealership/...` → SCR-053+ (later)
- `workshop/...`, `mechanic/...` → SCR-064+ (later)

Admin — layout `routes/admin/`:
- `index.tsx` → SCR-074 overview
- `users.tsx` → SCR-075 (uses `authClient.admin.listUsers`)
- `users/$id.tsx` → OVR-021 (uses `authClient.admin.getUser`)
- More admin pages stubbed, built in later milestones

### Route guards (beforeLoad)

- `(auth)` layout → redirect to home if already sessioned
- `(protected)` layout → `useSession()`; no session → throw redirect to `/login`; `banned` → redirect to a "banned" page
- `admin` layout → no session → `/login`; `role !== "admin"` → redirect to SCR-092 Access Denied
- `(protected)/dealership|workshop|mechanic` → also check `accountType` matches, else Access Denied

### OAuth state handling

- `select-account-type.tsx` stores chosen type in `sessionStorage` + URL search param
- `login.tsx`/`register.tsx` social buttons call `authClient.signIn.social({ provider, callbackURL: "/auth/oauth-callback" })`
- `oauth-callback.tsx` reads accountType from sessionStorage, lets Better Auth finish, then redirects based on accountType (user → `/account`, dealership → `/dealership`, etc.)
- If user dropped mid-flow (no accountType in sessionStorage) → redirect back to `select-account-type`

### Session context

`useSession()` from `authClient` provides `{ user: { id, name, email, role, accountType, ... } }` across the app. Account-type-specific layouts render different sidebars/nav (user vs dealership vs workshop/mechanic vs admin).

### Admin creation tool (no UI)

No UI for admin creation per spec. Usage documented in README:
```sh
curl -X POST http://localhost:3001/api/admin/create \
  -H "x-secret-key: $ADMIN_CREATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sayaratak.sd","password":"...","name":"Ahmed"}'
```

## Environment Variables

Existing in `api/.env`:
- `DATABASE_URL` — postgres connection
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — NOTE: `BETTER_AUTH_URL` currently points at the web app (`http://localhost:3000`); it should be the **API server's** base URL (e.g. `http://localhost:3001`) since Better Auth uses it to build OAuth callback URLs on the API side. To be corrected during implementation.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — nodemailer transport
- `NODE_ENV`

To add:
- `ADMIN_CREATE_SECRET` — secret for admin creation endpoint
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` — Facebook OAuth

Unused (remove or leave):
- `RESEND_API_KEY` — not used (nodemailer chosen)

## Out of Scope (this milestone)

- Listings, messaging, favorites, saved searches, notifications
- Subscriptions, payments (Bankak)
- Reviews, ratings, verification badges (UI/logic beyond the `isVerified` column)
- Banners, admin content pages
- Phone OTP login
- Mobile apps (Android/iOS)
