# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.13

FROM oven/bun:${BUN_VERSION}-alpine AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN bun run build

FROM oven/bun:${BUN_VERSION}-alpine AS production-dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN bun install --frozen-lockfile --production

FROM oven/bun:${BUN_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=production-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=bun:bun /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=production-dependencies --chown=bun:bun /app/package.json ./package.json
COPY --from=production-dependencies --chown=bun:bun /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=bun:bun /app/apps/web/dist ./apps/web/dist

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/robots.txt || exit 1

CMD ["bun", "run", "--cwd", "apps/web", "start"]
