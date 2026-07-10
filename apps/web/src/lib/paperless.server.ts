import type {
  Classification,
  DashboardData,
  NamedResource,
  PaperlessDocument,
} from "./paperless.types"

type Paginated<T> = { count: number; results: T[] }

const paperlessUrl = () =>
  (process.env.PAPERLESS_URL || "http://10.0.0.5:8444").replace(/\/$/, "")

function getToken() {
  const token = process.env.PAPERLESS_API_KEY
  if (!token) throw new Error("PAPERLESS_API_KEY is not configured")
  return token
}

async function paperlessFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const response = await fetch(`${paperlessUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `Paperless request failed (${response.status}): ${detail.slice(0, 180)}`
    )
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T)
}

export async function loadDashboard(): Promise<DashboardData> {
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash"
  try {
    const [documents, correspondents, documentTypes] = await Promise.all([
      paperlessFetch<Paginated<PaperlessDocument>>(
        "/api/documents/?page_size=200&ordering=-added"
      ),
      paperlessFetch<Paginated<NamedResource>>(
        "/api/correspondents/?page_size=100"
      ),
      paperlessFetch<Paginated<NamedResource>>(
        "/api/document_types/?page_size=100"
      ),
    ])
    return {
      documents: documents.results.map((document) => ({
        ...document,
        content: document.content.slice(0, 600),
      })),
      correspondents: correspondents.results,
      documentTypes: documentTypes.results,
      totalDocuments: documents.count,
      connectionError: null,
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      model,
    }
  } catch (error) {
    return {
      documents: [],
      correspondents: [],
      documentTypes: [],
      totalDocuments: 0,
      connectionError:
        error instanceof Error
          ? error.message
          : "Could not connect to Paperless",
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      model,
    }
  }
}

export async function classifyDocument(
  documentId: number
): Promise<Classification> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey)
    throw new Error("Add OPENROUTER_API_KEY to .env.local before classifying")

  const [document, correspondents, documentTypes] = await Promise.all([
    paperlessFetch<PaperlessDocument>(`/api/documents/${documentId}/`),
    paperlessFetch<Paginated<NamedResource>>(
      "/api/correspondents/?page_size=100"
    ),
    paperlessFetch<Paginated<NamedResource>>(
      "/api/document_types/?page_size=100"
    ),
  ])
  if (!document.content.trim())
    throw new Error("This document has no OCR text yet")

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Better Paperless AI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You classify personal and business documents. Return a concise, human-readable title, the sender or issuing organisation as correspondent, and a reusable document type. Preserve the document language. Do not invent details. Prefer an existing correspondent or type when it is an exact semantic match.",
          },
          {
            role: "user",
            content: `Current title: ${document.title}\nCreated: ${document.created}\nExisting correspondents: ${correspondents.results.map((item) => item.name).join(", ") || "none"}\nExisting document types: ${documentTypes.results.map((item) => item.name).join(", ") || "none"}\n\nOCR text:\n${document.content.slice(0, 18000)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "paperless_classification",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                correspondent: { type: "string" },
                documentType: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reasoning: { type: "string" },
              },
              required: [
                "title",
                "correspondent",
                "documentType",
                "confidence",
                "reasoning",
              ],
              additionalProperties: false,
            },
          },
        },
      }),
    }
  )
  if (!response.ok)
    throw new Error(`OpenRouter request failed (${response.status})`)
  const result = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = result.choices?.[0]?.message?.content
  if (!content) throw new Error("The model returned no classification")
  return JSON.parse(content) as Classification
}

async function findOrCreate(
  path: "correspondents" | "document_types",
  name: string
) {
  const normalized = name.trim()
  if (!normalized) return null
  const resources = await paperlessFetch<Paginated<NamedResource>>(
    `/api/${path}/?page_size=100`
  )
  const existing = resources.results.find(
    (item) => item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase()
  )
  if (existing) return existing.id
  const created = await paperlessFetch<NamedResource>(`/api/${path}/`, {
    method: "POST",
    body: JSON.stringify({ name: normalized }),
  })
  return created.id
}

export async function applyClassification(
  documentId: number,
  suggestion: Classification
) {
  const [correspondent, documentType] = await Promise.all([
    findOrCreate("correspondents", suggestion.correspondent),
    findOrCreate("document_types", suggestion.documentType),
  ])
  await paperlessFetch(`/api/documents/${documentId}/`, {
    method: "PATCH",
    body: JSON.stringify({
      title: suggestion.title.trim(),
      correspondent,
      document_type: documentType,
    }),
  })
  return { success: true }
}
