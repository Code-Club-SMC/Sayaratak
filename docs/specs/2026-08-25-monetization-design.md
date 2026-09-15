# Monetization & Payments (Priority 3) Design Spec

**Date**: 2026-08-25
**Status**: Approved

## Overview
This specification covers the implementation of the subscription system, Bankak manual payment verification, and business verification flows for Sayaratak.

Per the Executive Project Book and stakeholder requirements, the system will launch with **paid subscriptions disabled** (users default to a Free Plan), but the complete checkout and payment verification infrastructure must be fully built and ready for future activation.

## 1. Initial State & Free Plan Auto-Enrollment
- **Seed Data**: The database must be seeded with a `Free Plan` package (`price: 0`).
- **Registration Hook**: When a user registers as a `dealership`, `workshop`, or `mechanic`, a row is automatically inserted into `userSubscriptions`, linking their `userId` to the `Free Plan` package.
- **Immediate Publishing**: Dealerships and service providers can start publishing listings immediately up to the `listingLimit` defined by the Free Plan.

## 2. Business Verification (The Badge)
- **Separation of Concerns**: Publishing capability is separate from verification. 
- **Admin Review**: When a business registers, an admin must review their details.
- **Toggle Endpoint**: An admin-only API endpoint (`PATCH /api/admin/profiles/:type/:id/verify`) will toggle the `isVerified` boolean on the profile.
- **Frontend Display**: The frontend will conditionally render the verified badge based on this boolean.

## 3. Bankak Manual Verification Flow (Hidden at Launch)
The platform will utilize a manual verification flow for Bankak payments to bypass the need for an official API gateway during the MVP phase.

### Endpoints
1. **POST /api/payments/checkout**
   - **Input**: `packageId` or `listingId` (for featured listings).
   - **Action**: Creates a `payments` record with `status: "pending"` and the `amount` pulled securely from the DB, not the client.
2. **POST /api/payments/:id/submit**
   - **Input**: `transactionId` (Bankak receipt number) and optional `screenshotUrl`.
   - **Action**: Updates the `payments` record with the transaction proof.
3. **PATCH /api/admin/payments/:id/approve**
   - **Input**: `status: "completed"` or `"failed"`.
   - **Action**: If approved, the system automatically:
     - Updates the payment status.
     - Activates the associated `userSubscription` (updates `startDate` and `endDate`).
     - Or marks the associated listing as `isFeatured: true`.

## 4. Feature Gating & Middleware
- **Limit Enforcement**: A middleware or service function `checkListingLimit(userId)` will intercept `POST /api/listings`.
- **Logic**: 
  - Fetch the user's active subscription.
  - Count their current `active` listings.
  - If `activeCount >= subscription.listingLimit`, return `403 Forbidden` with a message prompting an upgrade.
- **Expiry Behavior**: When a paid subscription naturally expires (handled via cron job or on-the-fly calculation), the user reverts to the Free Plan limits. If they are over the free limit, their existing listings remain active, but they cannot post new ones or edit existing ones until they fall below the limit or renew.
