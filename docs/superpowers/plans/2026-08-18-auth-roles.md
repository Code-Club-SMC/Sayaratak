# Authentication & Roles Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication and roles system for Sayaratak — email+password, Google/Facebook OAuth, email verification, password reset, 5 marketplace roles, admin bootstrap via secret-key endpoint, and the frontend auth screens with route guards.

**Architecture:** Better Auth (with `admin` plugin + custom `accountType` field) on Hono API. Drizzle/PostgreSQL for storage. Three separate business-profile tables (dealerships, workshops, mechanics) created at signup. TanStack Start frontend with file-based routes, `useSession` for auth state, `beforeLoad` guards for role/account-type protection.

**Tech Stack:** Bun, Hono.js, drizzle-orm (pg), postgres-js, better-auth (admin plugin), nodemailer (SMTP), TanStack Start, TanStack Router, shadcn/ui, Tailwind v4.

## Global Constraints

- API runs on port 3001 (`bun run --hot src/index.ts`), web on port 3000 (`vite dev --port 3000`)
- Drizzle schema files live in `api/src/db/schemas/*-schema.ts` (drizzle-config glob pattern)
- Better Auth model names are lowercase defaults: `user`, `session`, `account`, `verification`
- Table names match model names (drizzle quotes the `user` reserved word automatically)
- All column names are camelCase (Better Auth convention)
- IDs are text (Better Auth generates them); profile table IDs use `crypto.randomUUID()` via `$defaultFn`
- `BETTER_AUTH_URL` must point to the API server (`http://localhost:3001`), not the web app
- Email transport is nodemailer (SMTP creds already in `.env`); Resend is unused
- Admin creation is endpoint-only (no UI), gated by `x-secret-key` header against `ADMIN_CREATE_SECRET` env var
- `accountType` values: `"user" | "dealership" | "workshop" | "mechanic"`
- `role` values (admin plugin): `"admin" | "user"`
- No git repo at project root; `web/` has its own git repo — commit web changes there, leave api uncommitted unless user asks

---

## File Structure

### API (`/home/abdul-rehman/Desktop/Sayaratak/api/`)

| File | Responsibility |
|------|---------------|
| `src/db/schemas/index.ts` | Re-exports all schema tables for drizzle import |
| `src/db/schemas/auth-schema.ts` | Better Auth tables: user, session, account, verification |
| `src/db/schemas/profile-schema.ts` | Business profile tables: dealerships, workshops, mechanics |
| `src/db/index.ts` | Drizzle instance (modify import source) |
| `src/lib/mailer.ts` | Nodemailer transport + `sendVerificationEmail` / `sendResetPassword` helpers |
| `src/lib/profiles.ts` | `createProfileForUser(userId, accountType)` helper (DRY: used by hook + endpoint) |
| `lib/auth.ts` | Better Auth config: plugins, additionalFields, hooks, email callbacks |
| `src/middleware/auth.ts` | `requireRole()` and `requireAccountType()` Hono middleware |
| `src/routes/admin.ts` | `POST /admin/create` — header-gated admin bootstrap |
| `src/routes/account.ts` | `PATCH /me/account-type` — set accountType post-OAuth |
| `src/index.ts` | Hono app: CORS, mount auth handler + route groups |
| `tests/middleware.test.ts` | Unit tests for RBAC middleware |
| `tests/admin.test.ts` | Unit tests for admin creation route |
| `tests/account.test.ts` | Unit tests for account-type endpoint |
| `package.json` | Add `nodemailer`, `@types/nodemailer` deps; add `test` script |
| `.env` | Add `ADMIN_CREATE_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET`; fix `BETTER_AUTH_URL` |

### Web (`/home/abdul-rehman/Desktop/Sayaratak/web/`)

| File | Responsibility |
|------|---------------|
| `src/lib/auth-client.ts` | Better Auth client (`createAuthClient` + `adminClient` plugin) |
| `src/lib/account-type.ts` | sessionStorage helpers for OAuth accountType round-trip |
| `src/routes/__root.tsx` | Root route (update title) |
| `src/routes/select-account-type.tsx` | SCR-026 — choose account type |
| `src/routes/login.tsx` | SCR-027 — login form + social buttons |
| `src/routes/register.tsx` | SCR-028 — register form (reads accountType from search) |
| `src/routes/forgot-password.tsx` | SCR-030 — request reset email |
| `src/routes/reset-password.tsx` | SCR-031 — set new password with token |
| `src/routes/verify-email.tsx` | Post-signup "check email" + verify-on-click |
| `src/routes/oauth-callback.tsx` | Post-OAuth redirect: set accountType, route by type |
| `src/routes/account/index.tsx` | SCR-041 stub — protected user overview |
| `src/routes/admin/index.tsx` | SCR-074 stub — protected admin overview |
| `src/components/ui/input.tsx` | shadcn input component |
| `src/components/ui/label.tsx` | shadcn label component |
| `src/components/ui/card.tsx` | shadcn card component |

---

### Task 1: Install API dependencies + add test script

**Files:**
- Modify: `api/package.json`

- [ ] **Step 1: Install nodemailer**

```sh
cd /home/abdul-rehman/Desktop/Sayaratak/api && bun add nodemailer && bun add -d @types/nodemailer
```

- [ ] **Step 2: Add test script to package.json**

Open `api/package.json` and add `"test": "bun test"` to the `scripts` block. Final scripts:

```json
"scripts": {
  "dev": "bun run --hot src/index.ts",
  "test": "bun test",
  "db:generate": "drizzle-kit generate --config=drizzle.config.ts",
  "db:migrate": "drizzle-kit migrate"
}
```

- [ ] **Step 3: Verify install**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run test`
Expected: `0 pass` (no test files yet) with no errors about missing modules.

---

### Task 2: Fix db schema import structure

The current `src/db/index.ts` uses a glob import (`./schemas/*-schema.ts`) that fails when no schema files exist. Switch to an explicit index file.

**Files:**
- Create: `api/src/db/schemas/index.ts`
- Modify: `api/src/db/index.ts`

- [ ] **Step 1: Create empty schemas index**

Create `api/src/db/schemas/index.ts`:

```ts
export {};
```

- [ ] **Step 2: Update db/index.ts to import from index**

Replace `api/src/db/index.ts` content with:

```ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas/index";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const queryClient = postgres(process.env.DATABASE_URL, { max: 10 });

export const db = drizzle(queryClient, { schema });
```

- [ ] **Step 3: Verify the API still boots**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run src/index.ts` (Ctrl+C after it starts)
Expected: server starts on port 3001 without import errors.

---

### Task 3: Write Better Auth drizzle schema

**Files:**
- Create: `api/src/db/schemas/auth-schema.ts`
- Modify: `api/src/db/schemas/index.ts`

- [ ] **Step 1: Write the auth schema**

Create `api/src/db/schemas/auth-schema.ts`:

```ts
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull().default(false),
	image: text("image"),
	// admin plugin fields
	role: text("role").notNull().default("user"),
	banned: boolean("banned").notNull().default(false),
	banReason: text("banReason"),
	banExpires: timestamp("banExpires"),
	// custom additional fields
	accountType: text("accountType").notNull().default("user"),
	phone: text("phone"),
	cityId: text("cityId"),
	preferredLanguage: text("preferredLanguage").notNull().default("en"),
	preferredCurrency: text("preferredCurrency").notNull().default("SDG"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expiresAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	impersonatedBy: text("impersonatedBy"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	issuer: text("issuer"),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	idToken: text("idToken"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
```

- [ ] **Step 2: Update schemas index to re-export auth schema**

Replace `api/src/db/schemas/index.ts` content with:

```ts
export * from "./auth-schema";
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bunx tsc --noEmit`
Expected: no errors.

---

### Task 4: Write profile schema (dealerships, workshops, mechanics)

**Files:**
- Create: `api/src/db/schemas/profile-schema.ts`
- Modify: `api/src/db/schemas/index.ts`

- [ ] **Step 1: Write the profile schema**

Create `api/src/db/schemas/profile-schema.ts`:

```ts
import { pgTable, text, timestamp, integer, doublePrecision, boolean, json } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const dealerships = pgTable("dealerships", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text("userId").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	logoUrl: text("logoUrl"),
	coverUrl: text("coverUrl"),
	description: text("description"),
	phone: text("phone"),
	cityId: text("cityId"),
	districtId: text("districtId"),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const workshops = pgTable("workshops", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text("userId").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	logoUrl: text("logoUrl"),
	cityId: text("cityId"),
	districtId: text("districtId"),
	address: text("address"),
	lat: doublePrecision("lat"),
	lng: doublePrecision("lng"),
	phone: text("phone"),
	workingHours: json("workingHours"),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const mechanics = pgTable("mechanics", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text("userId").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
	name: text("name"),
	profilePicUrl: text("profilePicUrl"),
	phone: text("phone"),
	whatsapp: text("whatsapp"),
	cityId: text("cityId"),
	yearsExperience: integer("yearsExperience"),
	specialization: text("specialization"),
	bio: text("bio"),
	isVerified: boolean("isVerified").notNull().default(false),
	ratingAvg: integer("ratingAvg").notNull().default(0),
	ratingCount: integer("ratingCount").notNull().default(0),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
```

- [ ] **Step 2: Update schemas index to re-export profile schema**

Replace `api/src/db/schemas/index.ts` content with:

```ts
export * from "./auth-schema";
export * from "./profile-schema";
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bunx tsc --noEmit`
Expected: no errors.

---

### Task 5: Generate and run drizzle migration

**Files:**
- Generated: `api/src/db/migrations/*`

- [ ] **Step 1: Generate the migration**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run db:generate`
Expected: drizzle-kit detects the schema and creates a new migration SQL file under `src/db/migrations/`. Note the generated filename.

- [ ] **Step 2: Review the generated SQL**

Read the generated `.sql` file under `api/src/db/migrations/`. Verify it creates tables: `user`, `session`, `account`, `verification`, `dealerships`, `workshops`, `mechanics` with the expected columns.

- [ ] **Step 3: Run the migration**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run db:migrate`
Expected: migration applies successfully (requires `DATABASE_URL` postgres running on localhost:5433).

- [ ] **Step 4: Verify tables exist**

Run: `psql postgresql://postgres:postgres@localhost:5433/main -c "\dt"`
Expected: lists `user`, `session`, `account`, `verification`, `dealerships`, `workshops`, `mechanics`, and drizzle's `__drizzle_migrations` table.

---

### Task 6: Nodemailer mailer module

**Files:**
- Create: `api/src/lib/mailer.ts`

- [ ] **Step 1: Write the mailer module**

Create `api/src/lib/mailer.ts`:

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const FROM = `"Sayaratak" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.BETTER_AUTH_URL || "http://localhost:3001";

export async function sendVerificationEmail({
	email,
	url,
	token,
}: {
	email: string;
	url: string;
	token: string;
}) {
	await transporter.sendMail({
		from: FROM,
		to: email,
		subject: "Verify your Sayaratak account",
		html: `<p>Click <a href="${url}">here</a> to verify your email.</p><p>Or use this code: ${token}</p>`,
	});
}

export async function sendResetPasswordEmail({
	email,
	url,
	token,
}: {
	email: string;
	url: string;
	token: string;
}) {
	await transporter.sendMail({
		from: FROM,
		to: email,
		subject: "Reset your Sayaratak password",
		html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
	});
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bunx tsc --noEmit`
Expected: no errors.

---

### Task 7: Profile creation helper

**Files:**
- Create: `api/src/lib/profiles.ts`

- [ ] **Step 1: Write the profile creation helper**

Create `api/src/lib/profiles.ts`:

```ts
import { eq } from "drizzle-orm";
import { db } from "../db";
import { dealerships, workshops, mechanics } from "../db/schemas/profile-schema";

const VALID_TYPES = ["user", "dealership", "workshop", "mechanic"] as const;
export type AccountType = (typeof VALID_TYPES)[number];

export function isValidAccountType(value: string): value is AccountType {
	return (VALID_TYPES as readonly string[]).includes(value);
}

export async function createProfileForUser(userId: string, accountType: AccountType) {
	if (accountType === "user") return;

	if (accountType === "dealership") {
		const existing = await db.query.dealerships.findFirst({ where: eq(dealerships.userId, userId) });
		if (!existing) {
			await db.insert(dealerships).values({ userId });
		}
	} else if (accountType === "workshop") {
		const existing = await db.query.workshops.findFirst({ where: eq(workshops.userId, userId) });
		if (!existing) {
			await db.insert(workshops).values({ userId });
		}
	} else if (accountType === "mechanic") {
		const existing = await db.query.mechanics.findFirst({ where: eq(mechanics.userId, userId) });
		if (!existing) {
			await db.insert(mechanics).values({ userId });
		}
	}
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bunx tsc --noEmit`
Expected: no errors.

---

### Task 8: Better Auth config

**Files:**
- Modify: `api/lib/auth.ts`
- Modify: `api/.env`

- [ ] **Step 1: Update .env with new variables**

Open `api/.env` and make these changes:
- Change `BETTER_AUTH_URL=http://localhost:3000 ...` to `BETTER_AUTH_URL=http://localhost:3001`
- Add these lines at the end:

```env
ADMIN_CREATE_SECRET=change-me-to-a-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

- [ ] **Step 2: Write the full auth config**

Replace `api/lib/auth.ts` content with:

```ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { db } from "../src/db";
import { sendVerificationEmail, sendResetPasswordEmail } from "../src/lib/mailer";
import { createProfileForUser, isValidAccountType } from "../src/lib/profiles";

export const auth = betterAuth({
	database: db,
	basePath: "/auth",
	trustedOrigins: ["http://localhost:3000"],
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ email, url, token }, request) => {
			await sendResetPasswordEmail({ email, url, token });
		},
		customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
			...coreFields,
			role: "user",
			banned: false,
			banReason: null,
			banExpires: null,
			...additionalFields,
			id,
		}),
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ email, url, token }, request) => {
			await sendVerificationEmail({ email, url, token });
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
		facebook: {
			clientId: process.env.FACEBOOK_CLIENT_ID!,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
		},
	},
	plugins: [
		admin({
			defaultRole: "user",
		}),
	],
	user: {
		additionalFields: {
			accountType: {
				type: ["user", "dealership", "workshop", "mechanic"],
				required: false,
				defaultValue: "user",
				input: true,
			},
			phone: {
				type: "string",
				required: false,
				input: true,
			},
			cityId: {
				type: "string",
				required: false,
				input: true,
			},
			preferredLanguage: {
				type: "string",
				required: false,
				defaultValue: "en",
				input: true,
			},
			preferredCurrency: {
				type: "string",
				required: false,
				defaultValue: "SDG",
				input: true,
			},
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const accountType = (user as any).accountType as string;
					if (isValidAccountType(accountType)) {
						await createProfileForUser(user.id, accountType);
					}
				},
			},
		},
	},
});
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bunx tsc --noEmit`
Expected: no errors. (If Better Auth types for `customSyntheticUser` or `additionalFields` differ slightly from the installed version, adjust the property names to match the installed version's type definitions — check `node_modules/better-auth` types if needed.)

- [ ] **Step 4: Verify auth handler responds**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run src/index.ts`
In another terminal: `curl http://localhost:3001/api/auth/ok`
Expected: `{"status":"ok"}`

---

### Task 9: RBAC middleware

**Files:**
- Create: `api/src/middleware/auth.ts`
- Create: `api/tests/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/tests/middleware.test.ts`:

```ts
import { describe, test, expect, mock, beforeEach } from "bun:test";

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession: mock(),
		},
	},
}));

const { auth } = await import("../lib/auth");
const { requireRole, requireAccountType } = await import("../src/middleware/auth");

function mockContext(headers: Record<string, string> = {}) {
	const h = new Headers(headers);
	return {
		req: { raw: { headers: h } },
		json: (data: unknown, status?: number) => new Response(JSON.stringify(data), { status: status || 200 }),
		set: mock(),
	};
}

describe("requireRole", () => {
	beforeEach(() => {
		mock(auth.api.getSession).mockReset();
	});

	test("returns 401 when no session", async () => {
		mock(auth.api.getSession).mockResolvedValue(null);
		const middleware = requireRole("admin");
		const c: any = mockContext();
		const res = await middleware(c, async () => {});
		expect((res as Response).status).toBe(401);
	});

	test("returns 403 when banned", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: true, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c: any = mockContext();
		const res = await middleware(c, async () => {});
		expect(res).toBeDefined();
		expect((res as Response).status).toBe(403);
	});

	test("returns 403 when role not allowed", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c: any = mockContext();
		const res = await middleware(c, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next and sets user when authorized", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "admin", banned: false, accountType: "user" },
		});
		const middleware = requireRole("admin");
		const c: any = mockContext();
		const next = mock();
		await middleware(c, next);
		expect(next).toHaveBeenCalled();
		expect(c.set).toHaveBeenCalledWith("user", expect.objectContaining({ id: "u1" }));
	});
});

describe("requireAccountType", () => {
	beforeEach(() => {
		mock(auth.api.getSession).mockReset();
	});

	test("returns 403 when accountType not allowed", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const middleware = requireAccountType("dealership");
		const c: any = mockContext();
		const res = await middleware(c, async () => {});
		expect((res as Response).status).toBe(403);
	});

	test("calls next when accountType matches", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "dealership" },
		});
		const middleware = requireAccountType("dealership", "workshop");
		const c: any = mockContext();
		const next = mock();
		await middleware(c, next);
		expect(next).toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/middleware.test.ts`
Expected: FAIL — `Cannot find module "../src/middleware/auth"`.

- [ ] **Step 3: Write the middleware implementation**

Create `api/src/middleware/auth.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { auth } from "../../lib/auth";

type SessionUser = {
	id: string;
	email: string;
	role: string;
	accountType: string;
	banned: boolean;
	[key: string]: unknown;
};

export const requireRole = (...roles: string[]) =>
	createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		if (session.user.banned) {
			return c.json({ error: "Forbidden" }, 403);
		}
		if (!roles.includes(session.user.role)) {
			return c.json({ error: "Forbidden" }, 403);
		}
		c.set("user", session.user as SessionUser);
		await next();
	});

export const requireAccountType = (...types: string[]) =>
	createMiddleware<{ Variables: { user: SessionUser } }>(async (c, next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		if (session.user.banned) {
			return c.json({ error: "Forbidden" }, 403);
		}
		if (!types.includes((session.user as any).accountType)) {
			return c.json({ error: "Forbidden" }, 403);
		}
		c.set("user", session.user as SessionUser);
		await next();
	});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/middleware.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit (web repo only — skip if api has no git)**

No git repo at api root; skip commit. If the user initializes one later, commit then.

---

### Task 10: Account-type update endpoint

This endpoint is called after OAuth callback to set the user's marketplace account type (since OAuth creates users with the default `"user"` type).

**Files:**
- Create: `api/src/routes/account.ts`
- Create: `api/tests/account.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/tests/account.test.ts`:

```ts
import { describe, test, expect, mock, beforeEach } from "bun:test";

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession: mock(),
		},
	},
}));

mock.module("../src/db", () => ({
	db: {
		update: mock(() => ({ set: mock(() => ({ where: mock(() => Promise.resolve()) })) })),
	},
}));

mock.module("../src/lib/profiles", () => ({
	createProfileForUser: mock(() => Promise.resolve()),
	isValidAccountType: (v: string) =>
		["user", "dealership", "workshop", "mechanic"].includes(v),
}));

const { auth } = await import("../lib/auth");
const { createProfileForUser } = await import("../src/lib/profiles");
const { accountApp } = await import("../src/routes/account");

describe("PATCH /account-type", () => {
	beforeEach(() => {
		mock(auth.api.getSession).mockReset();
		mock(createProfileForUser).mockReset();
	});

	test("returns 401 when no session", async () => {
		mock(auth.api.getSession).mockResolvedValue(null);
		const res = await accountApp.request("/account-type", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accountType: "dealership" }),
		});
		expect(res.status).toBe(401);
	});

	test("returns 400 for invalid accountType", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		const res = await accountApp.request("/account-type", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accountType: "invalid" }),
		});
		expect(res.status).toBe(400);
	});

	test("updates accountType and creates profile", async () => {
		mock(auth.api.getSession).mockResolvedValue({
			session: { id: "s1" },
			user: { id: "u1", role: "user", banned: false, accountType: "user" },
		});
		mock(createProfileForUser).mockResolvedValue(undefined);
		const res = await accountApp.request("/account-type", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accountType: "workshop" }),
		});
		expect(res.status).toBe(200);
		expect(createProfileForUser).toHaveBeenCalledWith("u1", "workshop");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/account.test.ts`
Expected: FAIL — module `../src/routes/account` not found.

- [ ] **Step 3: Write the endpoint implementation**

Create `api/src/routes/account.ts`:

```ts
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { auth } from "../../lib/auth";
import { db } from "../db";
import { user } from "../db/schemas/auth-schema";
import { createProfileForUser, isValidAccountType } from "../lib/profiles";

export const accountApp = new Hono();

accountApp.patch("/account-type", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const accountType = body.accountType;

	if (!isValidAccountType(accountType)) {
		return c.json({ error: "Invalid account type" }, 400);
	}

	await db
		.update(user)
		.set({ accountType })
		.where(eq(user.id, session.user.id));

	await createProfileForUser(session.user.id, accountType);

	return c.json({ accountType });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/account.test.ts`
Expected: all 3 tests PASS.

---

### Task 11: Admin creation route

**Files:**
- Create: `api/src/routes/admin.ts`
- Create: `api/tests/admin.test.ts`

- [ ] **Step 1: Write the failing test**

Create `api/tests/admin.test.ts`:

```ts
import { describe, test, expect, mock, beforeEach } from "bun:test";

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			createUser: mock(),
		},
	},
}));

const { auth } = await import("../lib/auth");
const { adminApp } = await import("../src/routes/admin");

describe("POST /create", () => {
	beforeEach(() => {
		mock(auth.api.createUser).mockReset();
		process.env.ADMIN_CREATE_SECRET = "test-secret";
	});

	test("returns 401 when x-secret-key missing", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "a@b.com", password: "pass", name: "Admin" }),
		});
		expect(res.status).toBe(401);
	});

	test("returns 401 when x-secret-key wrong", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "wrong" },
			body: JSON.stringify({ email: "a@b.com", password: "pass", name: "Admin" }),
		});
		expect(res.status).toBe(401);
	});

	test("returns 400 when fields missing", async () => {
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "test-secret" },
			body: JSON.stringify({ email: "a@b.com" }),
		});
		expect(res.status).toBe(400);
	});

	test("creates admin when secret correct", async () => {
		mock(auth.api.createUser).mockResolvedValue({
			user: { id: "u1", email: "a@b.com", name: "Admin", role: "admin" },
		});
		const res = await adminApp.request("/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-secret-key": "test-secret" },
			body: JSON.stringify({ email: "a@b.com", password: "pass123", name: "Admin" }),
		});
		expect(res.status).toBe(201);
		expect(auth.api.createUser).toHaveBeenCalledWith({
			body: {
				email: "a@b.com",
				password: "pass123",
				name: "Admin",
				role: "admin",
				data: { accountType: "user" },
			},
		});
		const json = await res.json();
		expect(json.role).toBe("admin");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/admin.test.ts`
Expected: FAIL — module `../src/routes/admin` not found.

- [ ] **Step 3: Write the admin route implementation**

Create `api/src/routes/admin.ts`:

```ts
import { Hono } from "hono";
import { auth } from "../../lib/auth";

export const adminApp = new Hono();

adminApp.post("/create", async (c) => {
	const secretKey = c.req.header("x-secret-key");
	if (!secretKey || secretKey !== process.env.ADMIN_CREATE_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { email, password, name } = body;

	if (!email || !password || !name) {
		return c.json({ error: "email, password, and name are required" }, 400);
	}

	try {
		const result = await auth.api.createUser({
			body: {
				email,
				password,
				name,
				role: "admin",
				data: { accountType: "user" },
			},
		});

		return c.json(
			{
				id: (result as any).user.id,
				email: (result as any).user.email,
				name: (result as any).user.name,
				role: "admin",
			},
			201,
		);
	} catch (err: any) {
		const status = err?.status || 400;
		const message = err?.message || "Failed to create admin";
		return c.json({ error: message }, status);
	}
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test tests/admin.test.ts`
Expected: all 4 tests PASS.

---

### Task 12: Wire everything in index.ts

**Files:**
- Modify: `api/src/index.ts`

- [ ] **Step 1: Update index.ts with CORS and route mounting**

Replace `api/src/index.ts` content with:

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import { adminApp } from "./routes/admin";
import { accountApp } from "./routes/account";
import { requireRole } from "./middleware/auth";

const app = new Hono().basePath("/api");

const corsMiddleware = cors({
	origin: "http://localhost:3000",
	credentials: true,
});

app.use("/*", corsMiddleware);

app.all("/auth/*", (c) => auth.handler(c.req.raw));

app.route("/admin", adminApp);

app.route("/me", accountApp);

app.get("/", (c) => {
	return c.text("Sayaratak API");
});

export default app;
```

- [ ] **Step 2: Run all tests**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test`
Expected: all tests PASS.

- [ ] **Step 3: Verify API boots and auth endpoint works**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run src/index.ts`
In another terminal:
```sh
curl http://localhost:3001/api/auth/ok
```
Expected: `{"status":"ok"}`

```sh
curl -X POST http://localhost:3001/api/admin/create \
  -H "x-secret-key: change-me-to-a-long-random-string" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sayaratak.sd","password":"AdminPass123!","name":"Admin User"}'
```
Expected: `{"id":"...","email":"admin@sayaratak.sd","name":"Admin User","role":"admin"}` with status 201.

---

### Task 13: Install shadcn UI components for web

**Files:**
- Generated: `web/src/components/ui/input.tsx`, `label.tsx`, `card.tsx`

- [ ] **Step 1: Install shadcn components**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bunx shadcn@latest add input label card`
Expected: three new files in `src/components/ui/`.

- [ ] **Step 2: Verify files exist**

Run: `ls /home/abdul-rehman/Desktop/Sayaratak/web/src/components/ui/`
Expected: includes `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`.

---

### Task 14: Web auth client

**Files:**
- Create: `web/src/lib/auth-client.ts`

- [ ] **Step 1: Write the auth client**

Create `web/src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import type { auth } from "../../../api/lib/auth";

export const authClient = createAuthClient<typeof auth>({
	baseURL: "http://localhost:3001/api",
	plugins: [adminClient()],
});

export const {
	signUp,
	signIn,
	signOut,
	useSession,
	forgetPassword,
	resetPassword,
} = authClient;
```

Note: The `typeof auth` import gives full type safety. If the cross-project import path causes issues with the bundler, remove the `typeof auth` generic and the import — the client still works, just with less strict types.

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bunx tsc --noEmit`
Expected: no errors (or only type errors from the cross-project import — if so, remove the generic and the import line).

---

### Task 15: Account-type sessionStorage helpers

**Files:**
- Create: `web/src/lib/account-type.ts`

- [ ] **Step 1: Write the helpers**

Create `web/src/lib/account-type.ts`:

```ts
const KEY = "sayaratak_account_type";

export const VALID_TYPES = ["user", "dealership", "workshop", "mechanic"] as const;
export type AccountType = (typeof VALID_TYPES)[number];

export function setAccountType(type: AccountType): void {
	sessionStorage.setItem(KEY, type);
}

export function getAccountType(): AccountType | null {
	const val = sessionStorage.getItem(KEY);
	if (val && (VALID_TYPES as readonly string[]).includes(val)) {
		return val as AccountType;
	}
	return null;
}

export function clearAccountType(): void {
	sessionStorage.removeItem(KEY);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bunx tsc --noEmit`
Expected: no errors.

---

### Task 16: Select-account-type page (SCR-026)

**Files:**
- Create: `web/src/routes/select-account-type.tsx`
- Modify: `web/src/routes/__root.tsx` (title only)

- [ ] **Step 1: Update root route title**

In `web/src/routes/__root.tsx`, change line 18 from:
```tsx
        title: "TanStack Start Starter",
```
to:
```tsx
        title: "Sayaratak",
```

- [ ] **Step 2: Write the select-account-type page**

Create `web/src/routes/select-account-type.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setAccountType, type AccountType } from "@/lib/account-type";

export const Route = createFileRoute("/select-account-type")({
	component: SelectAccountTypePage,
});

const ACCOUNT_OPTIONS: { type: AccountType; label: string; desc: string }[] = [
	{ type: "user", label: "Individual User", desc: "Buy, sell, and rent vehicles" },
	{ type: "dealership", label: "Dealership", desc: "Manage vehicle inventory" },
	{ type: "workshop", label: "Workshop", desc: "Offer automotive services" },
	{ type: "mechanic", label: "Mechanic", desc: "Offer mechanical services" },
];

function SelectAccountTypePage() {
	const navigate = useNavigate();

	function choose(type: AccountType) {
		setAccountType(type);
		navigate({ to: "/register", search: { accountType: type } });
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<div className="w-full max-w-2xl space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-blue-600">Sayaratak</h1>
					<p className="mt-2 text-gray-600">Select your account type</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{ACCOUNT_OPTIONS.map((opt) => (
						<Card key={opt.type} className="p-6">
							<h2 className="text-lg font-semibold">{opt.label}</h2>
							<p className="mt-1 text-sm text-gray-500">{opt.desc}</p>
							<Button className="mt-4 w-full" onClick={() => choose(opt.type)}>
								Continue
							</Button>
						</Card>
					))}
				</div>
				<p className="text-center text-sm text-gray-500">
					Already have an account?{" "}
					<a href="/login" className="text-blue-600 hover:underline">
						Sign in
					</a>
				</p>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Verify dev server picks up the route**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/select-account-type`
Expected: page renders with 4 account type cards. (Ctrl+C after verifying.)

---

### Task 17: Login page (SCR-027)

**Files:**
- Create: `web/src/routes/login.tsx`

- [ ] **Step 1: Write the login page**

Create `web/src/routes/login.tsx`:

```tsx
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { getAccountType, clearAccountType } from "@/lib/account-type";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleEmailLogin(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		const result = await authClient.signIn.email({ email, password });
		setLoading(false);
		if (result.error) {
			setError(result.error.message);
			return;
		}
		clearAccountType();
		navigate({ to: "/account" });
	}

	async function handleSocial(provider: "google" | "facebook") {
		const accountType = getAccountType();
		if (!accountType) {
			navigate({ to: "/select-account-type" });
			return;
		}
		await authClient.signIn.social({
			provider,
			callbackURL: "/oauth-callback",
		});
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-md p-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-blue-600">Sayaratak</h1>
					<p className="mt-2 text-gray-600">Sign in to your account</p>
				</div>

				<form onSubmit={handleEmailLogin} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in..." : "Sign in"}
					</Button>
				</form>

				<div className="flex justify-between text-sm">
					<Link to="/select-account-type" className="text-blue-600 hover:underline">
						Create account
					</Link>
					<Link to="/forgot-password" className="text-blue-600 hover:underline">
						Forgot password?
					</Link>
				</div>

				<div className="space-y-2">
					<p className="text-center text-sm text-gray-500">Or continue with</p>
					<div className="grid grid-cols-2 gap-3">
						<Button variant="outline" onClick={() => handleSocial("google")}>
							Google
						</Button>
						<Button variant="outline" onClick={() => handleSocial("facebook")}>
							Facebook
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Verify the route renders**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/login`
Expected: login form with email/password fields, social buttons, links. (Ctrl+C after verifying.)

---

### Task 18: Register page (SCR-028)

**Files:**
- Create: `web/src/routes/register.tsx`

- [ ] **Step 1: Write the register page**

Create `web/src/routes/register.tsx`:

```tsx
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
	getAccountType,
	setAccountType,
	type AccountType,
} from "@/lib/account-type";

export const Route = createFileRoute("/register")({
	validateSearch: (search: Record<string, unknown>) => ({
		accountType: (search.accountType as AccountType) || "user",
	}),
	component: RegisterPage,
});

const TYPE_LABELS: Record<AccountType, string> = {
	user: "Individual User",
	dealership: "Dealership",
	workshop: "Workshop",
	mechanic: "Mechanic",
};

function RegisterPage() {
	const navigate = useNavigate();
	const { accountType } = Route.useSearch();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phone, setPhone] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	setAccountType(accountType);

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		const result = await authClient.signUp.email({
			email,
			password,
			name,
			phone,
			accountType,
		});
		setLoading(false);
		if (result.error) {
			setError(result.error.message);
			return;
		}
		navigate({ to: "/verify-email" });
	}

	async function handleSocial(provider: "google" | "facebook") {
		await authClient.signIn.social({
			provider,
			callbackURL: "/oauth-callback",
		});
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-md p-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-blue-600">Sayaratak</h1>
					<p className="mt-2 text-gray-600">
						Create your {TYPE_LABELS[accountType]} account
					</p>
				</div>

				<form onSubmit={handleRegister} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							{accountType === "dealership" || accountType === "workshop"
								? "Business name"
								: "Full name"}
						</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone (optional)</Label>
						<Input
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Creating account..." : "Create account"}
					</Button>
				</form>

				<div className="space-y-2">
					<p className="text-center text-sm text-gray-500">Or sign up with</p>
					<div className="grid grid-cols-2 gap-3">
						<Button variant="outline" onClick={() => handleSocial("google")}>
							Google
						</Button>
						<Button variant="outline" onClick={() => handleSocial("facebook")}>
							Facebook
						</Button>
					</div>
				</div>

				<p className="text-center text-sm text-gray-500">
					Already have an account?{" "}
					<Link to="/login" className="text-blue-600 hover:underline">
						Sign in
					</Link>
				</p>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Verify the route renders**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/register?accountType=dealership`
Expected: register form with "Create your Dealership account" heading. (Ctrl+C after verifying.)

---

### Task 19: Forgot-password + reset-password pages (SCR-030, SCR-031)

**Files:**
- Create: `web/src/routes/forgot-password.tsx`
- Create: `web/src/routes/reset-password.tsx`

- [ ] **Step 1: Write the forgot-password page**

Create `web/src/routes/forgot-password.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		await authClient.forgetPassword({ email, redirectTo: "/reset-password" });
		setLoading(false);
		setSent(true);
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-md p-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-blue-600">Sayaratak</h1>
					<p className="mt-2 text-gray-600">Reset your password</p>
				</div>

				{sent ? (
					<p className="text-center text-gray-600">
						If an account exists for {email}, a reset link has been sent.
					</p>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Sending..." : "Send reset link"}
						</Button>
					</form>
				)}

				<p className="text-center text-sm text-gray-500">
					<Link to="/login" className="text-blue-600 hover:underline">
						Back to login
					</Link>
				</p>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Write the reset-password page**

Create `web/src/routes/reset-password.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: (search.token as string) || "",
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!token) {
			setError("Missing reset token. Use the link from your email.");
			return;
		}
		setLoading(true);
		const result = await authClient.resetPassword({ newPassword: password, token });
		setLoading(false);
		if (result.error) {
			setError(result.error.message);
			return;
		}
		navigate({ to: "/login" });
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-md p-8 space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-blue-600">Sayaratak</h1>
					<p className="mt-2 text-gray-600">Set a new password</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="password">New password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Resetting..." : "Reset password"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
```

- [ ] **Step 3: Verify both routes render**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/forgot-password` and `http://localhost:3000/reset-password?token=test`
Expected: both pages render correctly. (Ctrl+C after verifying.)

---

### Task 20: Verify-email page

**Files:**
- Create: `web/src/routes/verify-email.tsx`

- [ ] **Step 1: Write the verify-email page**

This page serves two purposes: (1) a "check your email" landing after signup, and (2) when loaded with a `token` search param, it calls `verifyEmail` and redirects to login.

Create `web/src/routes/verify-email.tsx`:

```tsx
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
	validateSearch: (search: Record<string, unknown>) => ({
		token: (search.token as string) || "",
	}),
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!token) return;
		setVerifying(true);
		authClient
			.verifyEmail({ query: { token } })
			.then((res) => {
				setVerifying(false);
				if (res.error) {
					setError(res.error.message);
				} else {
					navigate({ to: "/login" });
				}
			})
			.catch(() => {
				setVerifying(false);
				setError("Verification failed. Try again.");
			});
	}, [token, navigate]);

	if (verifying) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
				<Card className="w-full max-w-md p-8 text-center">
					<p className="text-gray-600">Verifying your email...</p>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
				<Card className="w-full max-w-md p-8 text-center space-y-4">
					<p className="text-red-500">{error}</p>
					<Link to="/login" className="text-blue-600 hover:underline">
						Back to login
					</Link>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-md p-8 text-center space-y-4">
				<h1 className="text-2xl font-bold text-blue-600">Check your email</h1>
				<p className="text-gray-600">
					We sent a verification link to your email. Click it to verify your account.
				</p>
				<p className="text-sm text-gray-500">
					Already verified?{" "}
					<Link to="/login" className="text-blue-600 hover:underline">
						Sign in
					</Link>
				</p>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Verify the route renders**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/verify-email`
Expected: "Check your email" message. (Ctrl+C after verifying.)

---

### Task 21: OAuth callback page

**Files:**
- Create: `web/src/routes/oauth-callback.tsx`

- [ ] **Step 1: Write the OAuth callback page**

After OAuth redirect, this page reads the chosen accountType from sessionStorage. If it's not `"user"`, it calls `PATCH /api/me/account-type` to update the user's accountType and create the business profile. Then it redirects to the appropriate dashboard.

Create `web/src/routes/oauth-callback.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
	getAccountType,
	clearAccountType,
	type AccountType,
} from "@/lib/account-type";

export const Route = createFileRoute("/oauth-callback")({
	component: OAuthCallbackPage,
});

const DASHBOARD_ROUTES: Record<AccountType, string> = {
	user: "/account",
	dealership: "/account",
	workshop: "/account",
	mechanic: "/account",
};

function OAuthCallbackPage() {
	const navigate = useNavigate();
	const [error, setError] = useState("");

	useEffect(() => {
		async function handleCallback() {
			const accountType = getAccountType();

			if (!accountType) {
				navigate({ to: "/select-account-type" });
				return;
			}

			if (accountType !== "user") {
				const session = await authClient.getSession();
				if (!session) {
					navigate({ to: "/login" });
					return;
				}

				const res = await fetch("http://localhost:3001/api/me/account-type", {
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ accountType }),
				});

				if (!res.ok) {
					setError("Failed to set account type. Please try again.");
					return;
				}
			}

			clearAccountType();
			navigate({ to: DASHBOARD_ROUTES[accountType] });
		}

		handleCallback();
	}, [navigate]);

	if (error) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
				<div className="text-center space-y-4">
					<p className="text-red-500">{error}</p>
					<a href="/login" className="text-blue-600 hover:underline">
						Back to login
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<p className="text-gray-600">Completing sign in...</p>
		</div>
	);
}
```

- [ ] **Step 2: Verify the route exists**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/oauth-callback`
Expected: briefly shows "Completing sign in..." then redirects (to select-account-type since no accountType in sessionStorage). (Ctrl+C after verifying.)

---

### Task 22: Protected account stub + admin stub + route guards

**Files:**
- Create: `web/src/routes/account/index.tsx`
- Create: `web/src/routes/admin/index.tsx`

- [ ] **Step 1: Write the protected account page**

Create `web/src/routes/account/index.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/account/")({
	beforeLoad: async ({ navigate }) => {
		const { data: session } = await authClient.getSession();
		if (!session) {
			throw navigate({ to: "/login" });
		}
		if (session.user.banned) {
			throw navigate({ to: "/login" });
		}
	},
	component: AccountPage,
});

function AccountPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	if (!session) return null;

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-2xl p-8 space-y-6">
				<h1 className="text-2xl font-bold text-blue-600">My Account</h1>
				<div className="space-y-2 text-sm">
					<p>Name: {session.user.name}</p>
					<p>Email: {session.user.email}</p>
					<p>Account type: {session.user.accountType}</p>
				</div>
				<Button
					variant="outline"
					onClick={async () => {
						await authClient.signOut();
						navigate({ to: "/login" });
					}}
				>
					Sign out
				</Button>
			</Card>
		</div>
	);
}
```

- [ ] **Step 2: Write the admin page**

Create `web/src/routes/admin/index.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/")({
	beforeLoad: async ({ navigate }) => {
		const { data: session } = await authClient.getSession();
		if (!session) {
			throw navigate({ to: "/login" });
		}
		if (session.user.role !== "admin") {
			throw navigate({ to: "/account" });
		}
	},
	component: AdminPage,
});

function AdminPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	if (!session) return null;

	return (
		<div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
			<Card className="w-full max-w-2xl p-8 space-y-6">
				<h1 className="text-2xl font-bold text-blue-600">Admin Dashboard</h1>
				<div className="space-y-2 text-sm">
					<p>Admin: {session.user.name}</p>
					<p>Email: {session.user.email}</p>
				</div>
				<Button
					variant="outline"
					onClick={async () => {
						await authClient.signOut();
						navigate({ to: "/login" });
					}}
				>
					Sign out
				</Button>
			</Card>
		</div>
	);
}
```

- [ ] **Step 3: Run typecheck and lint**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run typecheck && bun run lint`
Expected: no errors.

- [ ] **Step 4: Verify routes render with auth**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`
Open: `http://localhost:3000/account` → should redirect to `/login`
Open: `http://localhost:3000/admin` → should redirect to `/login`
(Ctrl+C after verifying.)

---

### Task 23: End-to-end manual verification + README

**Files:**
- Modify: `api/README.md`

- [ ] **Step 1: Start both servers**

Terminal 1: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun run dev`
Terminal 2: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run dev`

- [ ] **Step 2: Test admin creation**

```sh
curl -X POST http://localhost:3001/api/admin/create \
  -H "x-secret-key: change-me-to-a-long-random-string" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sayaratak.sd","password":"AdminPass123!","name":"Admin User"}'
```
Expected: 201 with admin user JSON.

- [ ] **Step 3: Test email+password signup flow**

1. Open `http://localhost:3000/select-account-type`
2. Click "Dealership" → redirects to `/register?accountType=dealership`
3. Fill form, submit → redirects to `/verify-email`
4. Check the SMTP inbox (or console for nodemailer output) for verification email
5. Click verification link → redirects to `/login`
6. Sign in with email+password → redirects to `/account`
7. Verify the `accountType` shows "dealership"
8. Check DB: `psql postgresql://postgres:postgres@localhost:5433/main -c "SELECT * FROM dealerships;"` → a skeleton row should exist for this user

- [ ] **Step 4: Test OAuth flow (if Google/Facebook creds are set)**

If you don't have real OAuth credentials, set placeholder values in `.env` and skip this step until creds are available. The flow:
1. Open `http://localhost:3000/select-account-type`
2. Choose "Workshop"
3. On `/register`, click "Google"
4. Complete Google sign-in
5. Redirect to `/oauth-callback` → accountType set to "workshop" → redirect to `/account"
6. Check DB: `psql postgresql://postgres:postgres@localhost:5433/main -c "SELECT * FROM workshops;"` → skeleton row exists

- [ ] **Step 5: Test forgot/reset password**

1. Open `http://localhost:3000/forgot-password`
2. Enter email → "reset link sent" message
3. Check SMTP for reset email
4. Click reset link → `/reset-password?token=...`
5. Enter new password → redirects to `/login`
6. Sign in with new password

- [ ] **Step 6: Test admin access control**

1. Sign in as the admin user created in Step 2
2. Navigate to `http://localhost:3000/admin` → should render admin dashboard
3. Sign out, sign in as a regular user → navigate to `/admin` → should redirect to `/account`

- [ ] **Step 7: Update API README with admin creation instructions**

Replace `api/README.md` content with:

```markdown
# Sayaratak API

## Setup

```sh
bun install
```

## Development

```sh
bun run dev
```

Server runs on http://localhost:3001

## Database

```sh
bun run db:generate   # generate migration from schema changes
bun run db:migrate    # apply migrations
```

## Tests

```sh
bun test
```

## Creating an Admin

Admins can only be created via a secret-key-gated endpoint. Set `ADMIN_CREATE_SECRET` in `.env`, then:

```sh
curl -X POST http://localhost:3001/api/admin/create \
  -H "x-secret-key: $ADMIN_CREATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sayaratak.sd","password":"...","name":"Admin Name"}'
```

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Better Auth encryption secret
- `BETTER_AUTH_URL` — API server base URL (e.g. `http://localhost:3001`)
- `ADMIN_CREATE_SECRET` — Secret for admin creation endpoint
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Nodemailer transport
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` — Facebook OAuth
- `NODE_ENV`
```

- [ ] **Step 8: Run all API tests one final time**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/api && bun test`
Expected: all tests PASS.

- [ ] **Step 9: Run web typecheck and lint one final time**

Run: `cd /home/abdul-rehman/Desktop/Sayaratak/web && bun run typecheck && bun run lint`
Expected: no errors.
