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

Start Postgres:
```sh
docker compose up -d
```

Run migrations:
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
- `AWS_REGION`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_PUBLIC_URL` — S3 / Cloudflare R2 for Media Uploads
- `NODE_ENV`
