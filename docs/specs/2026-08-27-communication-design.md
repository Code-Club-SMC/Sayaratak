# Communication & Notifications (Priority 4) Design Spec

**Date**: 2026-08-27
**Status**: Approved

## Overview
This specification covers the implementation of real-time in-app messaging (WebSockets), push notifications (Firebase Cloud Messaging), and admin broadcast tools for Sayaratak. The system is designed to be platform-agnostic, seamlessly serving both the mobile application and the web dashboard.

## 1. Database Architecture
A new schema file `api/src/db/schemas/communication-schema.ts` will be created with the following tables:
- **`conversations`**:
  - `id` (PK)
  - `listingId` (FK to listings, required for listing-bound chats)
  - `buyerId` (FK to users)
  - `sellerId` (FK to users)
  - `lastMessageAt` (timestamp)
  - *Constraint*: Unique constraint on `(listingId, buyerId)` to prevent duplicate chat instances for the same item/buyer pair.
- **`messages`**:
  - `id` (PK)
  - `conversationId` (FK to conversations)
  - `senderId` (FK to users)
  - `content` (text)
  - `isRead` (boolean, default false)
- **`device_tokens`**:
  - `id` (PK)
  - `userId` (FK to users)
  - `fcmToken` (text)
  - `deviceType` (text: 'ios', 'android', 'web')
  - `lastUsedAt` (timestamp)
- **`notifications`**:
  - `id` (PK)
  - `userId` (FK to users)
  - `title` (text)
  - `body` (text)
  - `type` (text: 'chat', 'match', 'system')
  - `referenceId` (text, e.g., conversationId)
  - `isRead` (boolean, default false)

## 2. In-App Messaging (WebSockets)
- **Engine**: Bun's native WebSocket API via Hono (`upgradeWebSocket`).
- **Connection**: `GET /api/chat/ws`. Authenticates via session headers/cookies, upgrades connection, and subscribes the user to a pub/sub channel matching their `userId`.
- **Message Flow**:
  - Sender issues `POST /api/chat/:conversationId/messages`.
  - Backend persists message to `messages` table and updates `conversations.lastMessageAt`.
  - Backend publishes payload to the receiver's `userId` channel via WebSocket.
  - If the receiver is offline (no active WS connection or app backgrounded), the system immediately triggers the Push Notification fallback.

## 3. Firebase Cloud Messaging (FCM) Integration
- **SDK**: `firebase-admin` (Node.js SDK).
- **Service Helper**: `api/src/lib/fcm.ts` with `sendPushNotification(userId, title, body, data)`.
- **Token Management**: `POST /api/notifications/token` allows mobile/web clients to register/update their unique FCM tokens.
- **Delivery**: The service fetches all active tokens for a given user from `device_tokens` and dispatches multi-device alerts (phone + web dashboard simultaneously).

## 4. Admin Broadcasts & System Alerts
- **Admin Endpoint**: `POST /api/admin/notifications/broadcast` allows a Super-Admin to specify a target audience (`all`, `dealerships`, `workshops`, `mechanics`, `users`).
- **Processing**: The system fetches matching users, bulk-inserts rows into the `notifications` table (populating the in-app notification bell history), and dispatches FCM payloads to wake up devices/browsers.
