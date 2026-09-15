# Priority 5: Admin Dashboard APIs Design Spec

**Date**: 2026-08-27
**Status**: Approved

## Overview
This specification perfectly aligns with the **Sayaratak Executive Project Book** requirements for the Admin Dashboard. It provides the Super-Admin with comprehensive tools for Moderation, Banner Advertisement Management, and Analytics.

## 1. Statistics & Analytics (Dashboard Home)
Per the project book, the admin requires real-time metrics.
- **Endpoint**: `GET /api/admin/metrics`
- **Response Payload**:
  - `totalUsers` (count of users)
  - `totalDealerships`, `totalWorkshops`, `totalMechanics` (counts of specific account types)
  - `totalListings` (count of active listings)
  - `totalSubscriptions` (count of active subscription plans)
  - `revenue` (sum of completed Bankak payments)

## 2. Listing & User Moderation
Per the project book, admins must "Review, Approve, Reject, Remove violating listings, and Ban users".
- **Endpoints**:
  - `GET /api/admin/users`: Fetch all users.
  - `PATCH /api/admin/users/:id/ban`: Toggle user ban status (sets `banned` and `banReason` on the user).
  - `GET /api/admin/listings`: Fetch all listings (filterable by status: `active`, `pending`, `rejected`, `banned`).
  - `PATCH /api/admin/listings/:id/moderate`: Update a listing's status to `approved`, `rejected`, or `banned`.
- **Cascading Logic**: If an admin bans a Dealership/Mechanic, a background task will automatically update all of their active listings to `banned` to immediately purge them from the public marketplace.

## 3. Banner Advertisement System
Per the project book, the platform requires "Create, Edit, Delete, Set display duration, Define placement locations".
- **Database Schema** (`api/src/db/schemas/content-schema.ts`):
  - **`banners`** table:
    - `id` (PK)
    - `title` (text)
    - `imageUrl` (text)
    - `targetUrl` (text)
    - `placement` (text) - e.g., 'home_top', 'search_inline', 'category_toyota'
    - `startDate` (timestamp)
    - `endDate` (timestamp)
    - `isActive` (boolean, default true)
- **Endpoints**:
  - **Admin**: `GET`, `POST`, `PUT`, `DELETE` on `/api/admin/banners`.
  - **Public**: `GET /api/content/banners` (returns banners where `isActive = true` and current date is between `startDate` and `endDate`).

## Security
All routes under `/api/admin/*` will run through an authentication middleware that strictly checks `session.user.role === "admin"`. If a normal user or dealership attempts to hit these routes, they will receive a `403 Forbidden`.
