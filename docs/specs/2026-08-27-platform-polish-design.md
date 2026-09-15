# Priority 6: Platform Polish Design Spec (Enterprise Edition)

**Date**: 2026-08-27
**Status**: Approved

## Overview
This final phase hardens the Sayaratak API for public production. It upgrades the MVP to an enterprise-grade backend featuring strict security, DDoS protection, robust validation, and future-proof versioning.

## 1. Security & Infrastructure Hardening
- **Rate Limiting**: Implement a basic rate-limiting middleware to prevent brute-force attacks and API abuse (e.g., max 100 requests per minute).
- **CORS Lock-Down**: Restrict `cors()` in `index.ts` to explicitly allowed origins (the frontend domain and localhost), blocking malicious cross-origin requests.
- **Graceful Shutdown**: Intercept `SIGINT`/`SIGTERM` signals to allow active requests to finish and cleanly disconnect the PostgreSQL pool before the server exits.

## 2. API Versioning & Logging
- **Prefixing**: All existing routes will be migrated under an `/api/v1` prefix. This guarantees that future structural changes (e.g., `/api/v2`) won't break older mobile app versions.
- **Structured Logging**: Inject Hono's `logger()` middleware to automatically log all incoming HTTP requests and response times for easier debugging.

## 3. Zod Request Validation
- **Strict Input Schemas**: Integrate `zod` and `@hono/zod-validator`.
- **Coverage**: Apply validation middleware to all major data-mutating routes (e.g., creating listings, leaving reviews, submitting reports, registering tokens). This prevents malformed data from ever reaching the database.

## 4. API Pagination & Cursors
- **Query Limits**: Heavy `GET` endpoints (`/listings`, `/admin/users`, `/admin/listings`, `/favorites`) will receive `page` and `limit` query parameters.
- **Database Optimization**: Drizzle queries will be updated with `.limit(limit).offset((page - 1) * limit)` to ensure fast response times regardless of table size.

## 5. Global Error Handling
- **Catch-All Middleware**: Implement a global `app.onError()` handler. Unhandled exceptions will be caught, logged internally, and returned to the client as a clean `{ error: "Internal Server Error" }` payload with a `500` status, preventing the Node/Bun process from crashing.
