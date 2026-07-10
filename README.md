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

Set the connection variables in `.env.local`:

```dotenv
PAPERLESS_URL=https://paperless.example.com
PAPERLESS_API_KEY=your-paperless-api-token
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
AUTOMATION_ENABLED=false
WEBHOOK_SECRET=choose-a-long-random-secret
APP_DATA_DIR=.data
```

`PAPERLESS_URL` is the base URL of your Paperless-ngx server. `OPENROUTER_MODEL` must accept text for classification. AI OCR also requires a model that accepts PDF or image input.

You can change these values from the Settings button in the app. Settings saved there override the environment variables and are stored in `APP_DATA_DIR`. Secret fields are write-only. The app never sends an existing API key or webhook secret back to the browser. Leave a secret field blank to keep its current value.

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

The container listens on port 3000, includes a health check, and runs as the non-root `bun` user. Compose mounts a named volume at `/data` for settings and automation jobs. Keep that volume when updating the container.

## Automatic processing

Paperless can notify the app whenever it consumes a new document. The app downloads the source file, generates replacement OCR, writes that text to Paperless, and then assigns a title, correspondent, and document type.

Open Settings in Better Paperless AI and configure the Paperless connection, OpenRouter connection, and webhook secret. Turn on webhook automation when those values are ready.

Create a workflow in Paperless with these values:

- Trigger: Document Added
- Action: Webhook
- Method: POST
- URL: the public URL of this app followed by `/api/webhooks/paperless`
- Header: `Authorization: Bearer your-webhook-secret`
- Body: `{"document_id":"{doc_id}"}`

If both apps share a Docker network, the webhook URL can use the Compose service name, for example `http://web:3000/api/webhooks/paperless`. Otherwise, use an address that the Paperless container can reach.

The app stores automation jobs on disk and processes them one at a time. Repeated webhook calls for the same completed document do not run the job again. A failed job can be queued again by sending the webhook another time.

## Self-hosting and security

Better Paperless AI does not provide user accounts or access control. Do not expose port 3000 directly to the public internet. Put it on a trusted private network or behind a reverse proxy that handles HTTPS and authentication.

Keep `.env.local` out of version control and restrict access to it. The Paperless token gives the app write and delete access, so use a dedicated token with only the permissions the app needs if your Paperless setup supports that.

Protect the settings screen with the same reverse proxy authentication as the rest of the app. Anyone who can reach it can replace API credentials, change the Paperless server, or turn on automatic processing. Back up the `/data` volume if you configure the app through the browser.

Classification sends document OCR text to OpenRouter. AI OCR sends the source PDF or image and supports files up to 25 MB. Check your OpenRouter model provider's data handling policy before processing sensitive documents.

The app server must be able to reach both your Paperless-ngx URL and `https://openrouter.ai`. If Paperless uses a private hostname or address, make sure that address is reachable from the container or host running this app.
