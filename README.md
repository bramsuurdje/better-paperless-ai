<img width="1920" height="1080" alt="602_1x_shots_so" src="https://github.com/user-attachments/assets/bb4622ae-3374-4a7d-bff0-59cefa9b3fac" />

# Better Paperless AI

Better Paperless AI is a small web app for reviewing documents stored in [Paperless-ngx](https://docs.paperless-ngx.com/). It lists recent documents, filters and searches them, suggests titles, correspondents, and document types through OpenRouter, and lets you review changes before applying them. It can also generate replacement OCR text for PDF and image files.

The app can change metadata, replace OCR text, create correspondents and document types, and delete documents. Run it only where trusted users can reach it.

## Requirements

- A running Paperless-ngx instance that this app can reach
- A Paperless API token with permission to read and update documents
- An OpenRouter API key and a model that supports the features you plan to use
- Bun 1.3.13 or later for local development, or Docker with Compose for container hosting

## Configuration

Copy the example file:

```bash
cp .env.example .env.local
```

Set all four variables in `.env.local`:

```dotenv
PAPERLESS_URL=https://paperless.example.com
PAPERLESS_API_KEY=your-paperless-api-token
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
```

`PAPERLESS_URL` is the base URL of your Paperless-ngx server. `OPENROUTER_MODEL` must accept text for classification. AI OCR also requires a model that accepts PDF or image input.

## Local development

Install dependencies and start the development server from the repository root:

```bash
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000`.

To test a production build without Docker:

```bash
bun run build
bun run --cwd apps/web start
```

## Docker Compose

The included Compose file builds the image locally, reads `.env.local`, and exposes the app on port 3000:

```bash
docker compose up --build -d
```

Open `http://localhost:3000`. View logs or stop the service with:

```bash
docker compose logs -f
docker compose down
```

You can also build and run the included Dockerfile directly:

```bash
docker build -t better-paperless-ai .
docker run --rm --init -p 3000:3000 --env-file .env.local better-paperless-ai
```

The container listens on port 3000, includes a health check, and runs as the non-root `bun` user.

## Self-hosting and security

Better Paperless AI does not provide user accounts or access control. Do not expose port 3000 directly to the public internet. Put it on a trusted private network or behind a reverse proxy that handles HTTPS and authentication.

Keep `.env.local` out of version control and restrict access to it. The Paperless token gives the app write and delete access, so use a dedicated token with only the permissions the app needs if your Paperless setup supports that.

Classification sends document OCR text to OpenRouter. AI OCR sends the source PDF or image and supports files up to 25 MB. Check your OpenRouter model provider's data handling policy before processing sensitive documents.

The app server must be able to reach both your Paperless-ngx URL and `https://openrouter.ai`. If Paperless uses a private hostname or address, make sure that address is reachable from the container or host running this app.
