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

The included Compose file runs Paperless-ngx, PostgreSQL, Redis, and Better Paperless AI on one Docker network. Paperless is available on port 8444 and Better Paperless AI is available on port 3000.

Put the Better Paperless AI values in a `.env` file next to `compose.yaml`:

```dotenv
PAPERLESS_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
AUTOMATION_ENABLED=false
WEBHOOK_SECRET=
```

Paperless can still read its own settings from `docker-compose.env`. The app connects to Paperless through the internal `http://webserver:8000` address, so you do not need to expose the Paperless API URL through `.env`.

```bash
docker compose pull
docker compose up -d
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

### Prepare Better Paperless AI

Open Settings in Better Paperless AI and check the Paperless URL, Paperless API key, OpenRouter API key, and model. Generate a webhook secret, copy it somewhere safe, then turn on webhook automation and save the settings.

The model must accept PDF or image input if you want automatic AI OCR. A text-only model can classify existing OCR text, but it cannot read the original document.

### Create the Paperless workflow

Open Workflows in Paperless and create a workflow. Give it a clear name such as `Better Paperless AI`.

Paperless documents its webhook fields and placeholders in the [workflow guide](https://docs.paperless-ngx.com/usage/#webhook).

Add a trigger with the type `Document Added`. You do not need any filters unless you only want to process certain documents.

Add a Webhook action and enter these values:

| Paperless field | Value |
| --- | --- |
| Webhook URL | `http://your-app-address:3000/api/webhooks/paperless` |
| Use parameters for webhook body | On |
| Send webhook payload as JSON | On |
| Include document | Off |

> `Include document` must be off. When it is on, Paperless sends a multipart request with the file attached. Better Paperless AI expects JSON and responds with `400 Bad Request`. The app downloads the document through the Paperless API, so attaching it to the webhook only sends the same file twice.

Under Webhook params, add one row:

| Name | Value |
| --- | --- |
| `document_url` | `{{doc_url}}` |

The `doc_url` placeholder requires `PAPERLESS_URL` to be configured on the Paperless container. Set it to the browser-facing URL of your Paperless instance, for example `http://10.0.0.5:8444`.

Under Webhook headers, add one row:

| Name | Value |
| --- | --- |
| `X-Webhook-Secret` | The webhook secret from Better Paperless AI |

The header name must be exactly `X-Webhook-Secret`. Do not add the word `header` to it.

Before saving, check the Webhook action one more time:

- `Use parameters for webhook body` is on
- `Send webhook payload as JSON` is on
- `Include document` is off
- The parameter is named `document_url` and contains `{{doc_url}}`
- The header is named `X-Webhook-Secret`

Save the workflow, then upload a new document. A `Document Added` workflow only runs for documents added after the workflow was enabled. It does not process documents that were already in Paperless.

### Pick the right webhook URL

The webhook URL is resolved from inside the Paperless container, not from your browser. `localhost` points to the Paperless container itself and will not normally reach Better Paperless AI.

If both apps share a Docker network, use the Better Paperless AI service name. For example:

```text
http://web:3000/api/webhooks/paperless
```

If they run on different hosts or Docker networks, use an IP address or hostname that the Paperless container can reach:

```text
http://10.0.1.188:3000/api/webhooks/paperless
```

Some Paperless installations restrict webhook ports or requests to private IP addresses. Check `PAPERLESS_WEBHOOKS_ALLOWED_PORTS` and `PAPERLESS_WEBHOOKS_ALLOW_INTERNAL_REQUESTS` in the [Paperless webhook configuration](https://docs.paperless-ngx.com/configuration/#workflow-webhooks) if the request is blocked.

### Test the workflow

Upload a disposable test document and follow the Better Paperless AI logs:

```bash
docker compose logs -f
```

Paperless sends a request shaped like this:

```http
POST /api/webhooks/paperless
Content-Type: application/json
X-Webhook-Secret: your-webhook-secret

{"document_url":"http://paperless.example.com/documents/123/details"}
```

The endpoint returns `202 Accepted` when it queues the document. A `401 Unauthorized` response means the webhook secret does not match. A `409 Conflict` response means webhook automation is disabled in Better Paperless AI. Better Paperless AI extracts the document ID from `{{doc_url}}`, which works with Paperless versions that do not provide a `doc_id` placeholder.

If the webhook fails, the response and Paperless logs usually point to one of these settings:

| Error | What to check |
| --- | --- |
| `doc_id is undefined` | Replace `{{doc_id}}` with `{{doc_url}}` and name the parameter `document_url`. |
| `400 Bad Request` | Make sure JSON is on and `Include document` is off. |
| `401 Unauthorized` | Copy the same webhook secret into Better Paperless AI and the `X-Webhook-Secret` header. |
| `409 Conflict` | Enable webhook automation in Better Paperless AI. |
| Connection refused or timeout | Use an address that the Paperless container can reach and check the allowed webhook ports. |

The app stores automation jobs on disk and processes them one at a time. Repeated webhook calls for the same completed document do not run the job again. A failed job can be queued again by sending the webhook another time.

## Self-hosting and security

Better Paperless AI does not provide user accounts or access control. Do not expose port 3000 directly to the public internet. Put it on a trusted private network or behind a reverse proxy that handles HTTPS and authentication.

Keep `.env.local` out of version control and restrict access to it. The Paperless token gives the app write and delete access, so use a dedicated token with only the permissions the app needs if your Paperless setup supports that.

Protect the settings screen with the same reverse proxy authentication as the rest of the app. Anyone who can reach it can replace API credentials, change the Paperless server, or turn on automatic processing. Back up the `/data` volume if you configure the app through the browser.

Classification sends document OCR text to OpenRouter. AI OCR sends the source PDF or image and supports files up to 25 MB. Check your OpenRouter model provider's data handling policy before processing sensitive documents.

The app server must be able to reach both your Paperless-ngx URL and `https://openrouter.ai`. If Paperless uses a private hostname or address, make sure that address is reachable from the container or host running this app.
