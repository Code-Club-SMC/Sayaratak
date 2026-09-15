# Sayaratak (سيارتك) 🚗

Sayaratak is a modern automotive marketplace platform for buying, selling, and renting vehicles (cars, trucks, tuk-tuks, motorcycles, rickshaws, spare parts, and automotive services) in Sudan and the wider MENA region.

---

## 📁 Repository Structure

```
├── api/            # Backend REST API, WebSockets, Better Auth & PostGIS services (Bun + Hono)
├── web/            # Modern SSR Frontend Web App (TanStack Start + React 19 + Tailwind v4)
├── docs/           # Architecture ADRs, OpenAPI specs, project requirements & status
└── render.yaml     # Render Cloud Blueprint for one-click deployment
```

---

## 🚀 Backend Services (`/api`)

The backend is built with **Bun**, **Hono**, **Drizzle ORM**, **PostgreSQL (PostGIS)**, and **Better Auth**.

### Quick Start (Local Development)

```bash
cd api
bun install
bun run dev          # Dev server with hot reloading on port 8000
bun test             # Run backend test suite
bun run db:generate  # Generate migrations from schemas
bun run db:migrate   # Apply pending migrations
bun run db:seed      # Seed initial taxonomy & location data
bun run db:setup     # Run migrations and seed data in one step
```

### Interactive API Documentation

When the API is running, access:
- **Swagger UI**: `http://localhost:8000/api/docs`
- **OpenAPI 3.0 Spec**: `http://localhost:8000/api/openapi.json`

---

## 🌐 Web Application (`/web`)

Full-stack application built with **TanStack Start**, **TanStack Router**, **Tailwind CSS v4**, and **shadcn/ui** with first-class RTL (Arabic) support.

```bash
cd web
bun install
bun run dev          # Vite dev server on port 3000
bun run build        # Build for production SSR
bun run start        # Launch production server
```

---

## ☁️ Deployment (Render Blueprint)

This repository includes a [`render.yaml`](./render.yaml) Blueprint that provisions:
1. **Managed PostgreSQL** with native **PostGIS** extension.
2. **Docker Web Service** running the Bun API with automated migrations and seeding on boot.

See [docs/backend-status.md](./docs/backend-status.md) for current feature implementation status.
