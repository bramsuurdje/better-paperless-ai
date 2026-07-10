# Better Paperless AI

Better Paperless AI is a TanStack Start web application for reviewing and improving documents stored in Paperless-ngx.

## Configuration

Copy the environment template and fill in your own credentials. `.env.local` is ignored by Git and must never be committed.

```bash
cp .env.example .env.local
```

The application uses these variables:

- `PAPERLESS_URL`: URL of the Paperless-ngx instance
- `PAPERLESS_API_KEY`: Paperless-ngx API token
- `OPENROUTER_API_KEY`: OpenRouter API key
- `OPENROUTER_MODEL`: OpenRouter model identifier

## Development

Install dependencies and start the development server:

```bash
bun install --frozen-lockfile
bun run dev
```

The web app is available at `http://localhost:3000`.

## Production build

Build and run the TanStack Start production server locally:

```bash
bun run build
bun run --cwd apps/web start
```

The production command uses `srvx` to serve the generated `apps/web/dist/client` assets and forward dynamic requests to the generated `apps/web/dist/server/server.js` fetch handler.

## Docker

Build the image from the repository root:

```bash
docker build -t better-paperless-ai:local .
```

Run it with the local environment file:

```bash
docker run --rm --init -p 3000:3000 --env-file .env.local better-paperless-ai:local
```

The container listens on port `3000` and runs as the non-root `bun` user.

## Docker Compose

Compose reads the application secrets from `.env.local`, which remains outside version control:

```bash
cp .env.example .env.local
docker compose up --build
```

Stop the application with `docker compose down`.

## GitHub Container Registry

Pushes to `main` and version tags matching `v*` publish multi-platform images for `linux/amd64` and `linux/arm64` to GitHub Container Registry. Pull requests build the image but do not publish it.

Replace `OWNER` and `REPOSITORY` with the GitHub repository path:

```bash
docker pull ghcr.io/OWNER/REPOSITORY:latest
docker run --rm --init -p 3000:3000 --env-file .env.local ghcr.io/OWNER/REPOSITORY:latest
```

Published images also receive branch, semantic-version, and immutable commit SHA tags. Private packages require a GitHub token with `read:packages` permission for `docker login ghcr.io` before pulling.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
bunx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```
