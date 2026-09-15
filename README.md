# Sayaratak (سيارتك) 🚗

> The premier automotive marketplace platform for buying, selling, and renting vehicles in Sudan and the MENA region.

Sayaratak is a full-stack platform featuring a high-performance REST & WebSocket API, an SSR web application with full Arabic (RTL) & English localization, and mobile-ready endpoints for upcoming iOS & Android applications.

---

## 🏛️ Monorepo Structure

```
Sayaratak/
├── api/                   # Backend API (Bun + Hono + PostGIS)
│   ├── src/               # Routes, middlewares, cron workers, DB schemas
│   ├── Dockerfile         # Production Bun container (runs migrations on boot)
│   └── package.json
├── web/                   # Frontend Web Application (TanStack Start SSR)
│   ├── src/               # React 19, TanStack Router ({-$locale}), shadcn/ui
│   └── package.json
├── docs/                  # Product specifications, API dictionaries, & assets
├── render.yaml            # 1-Click Render Blueprint (Web Service + Managed PostGIS)
├── AGENTS.md              # Project coding conventions & architectural rules
└── README.md
```

---

## ⚡ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | [Bun](https://bun.sh), [Hono](https://hono.dev), [Drizzle ORM](https://orm.drizzle.team), PostgreSQL 16 with **PostGIS** |
| **Authentication** | [Better Auth](https://www.better-auth.com) (Session cookies + Mobile Bearer token support) |
| **Media & CDN** | [Cloudinary](https://cloudinary.com) (Signed direct uploads, auto WebP/AVIF compression) |
| **Notifications** | Firebase Cloud Messaging (FCM) & Nodemailer (Transactional SMTP) |
| **Frontend Web** | [TanStack Start](https://tanstack.com/start), TanStack Router, React 19, Tailwind CSS v4, shadcn/ui |
| **Localization** | First-class bilingual support (Arabic RTL / English LTR) |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Bun](https://bun.sh) (v1.1+)
- [Docker](https://www.docker.com) (for local PostgreSQL with PostGIS)

### 2. Start Local Database
```bash
cd api
docker compose up -d
```
*Spins up PostGIS on port `5433`.*

### 3. Setup and Run the Backend API
```bash
cd api
bun install
bun run db:setup     # Runs pending Drizzle migrations + seeds Sudanese taxonomy
bun run dev          # Starts Hono dev server with hot reload on port 8000
```
- API Base URL: `http://localhost:8000/api`
- Interactive Swagger UI: `http://localhost:8000/api/docs`
- OpenAPI JSON Spec: `http://localhost:8000/api/openapi.json`

### 4. Setup and Run the Web App
```bash
cd ../web
bun install
bun run dev          # Starts TanStack Start dev server on port 3000
```
- Web Application: `http://localhost:3000`

---

## 🧪 Testing

Run the full backend test suite:
```bash
cd api
bun test
```

---

## ☁️ Deployment (Render)

This repository is pre-configured with a **Render Blueprint (`render.yaml`)**:

1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** → **Blueprint**.
3. Select this repository. Render will automatically:
   - Provision a managed PostgreSQL instance with PostGIS (`sayaratak-db`).
   - Build the Bun Docker container from `/api` (`sayaratak-api`).
   - Automatically execute migrations and seed the initial taxonomy upon boot.

---

## 📱 Mobile App Team Handoff

The backend is fully equipped for mobile consumption (iOS, Android, Flutter, React Native):
- **API Base URL:** `https://<deployed-url>/api/v1`
- **Interactive Documentation:** `https://<deployed-url>/api/docs`
- **OpenAPI 3.0 Spec:** `https://<deployed-url>/api/openapi.json`
- **Auth Header:** Send `Authorization: Bearer <session_token>` for all authenticated requests.
- **Image Uploads:** Mobile apps request a signed upload signature from `POST /api/v1/media/signature` and upload directly to Cloudinary.

---

## 📄 License

Proprietary © Sayaratak Team. All rights reserved.
