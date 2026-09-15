FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install all dependencies (needed for drizzle-kit migrate at boot)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy application source code
COPY . .

ENV NODE_ENV=production

# Expose default port (Railway/Render will override PORT dynamically)
EXPOSE 8000

# Automatically run pending migrations & seed default taxonomy on startup, then launch API
CMD ["sh", "-c", "bun run db:setup && bun run src/index.ts"]
