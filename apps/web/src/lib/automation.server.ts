import { timingSafeEqual } from "node:crypto"
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"

import {
  applyClassification,
  classifyDocument,
  generateDocumentOcr,
  replaceDocumentOcr,
} from "./paperless.server"
import { getRuntimeSettings } from "./settings.server"

type AutomationJob = {
  documentId: number
  status: "pending" | "processing" | "complete" | "failed"
  attempts: number
  createdAt: string
  updatedAt: string
  error?: string
}

let queuePromise: Promise<void> | null = null

const queuePath = () =>
  join(
    process.env.APP_DATA_DIR || join(process.cwd(), ".data"),
    "automation-jobs.json"
  )

function readJobs(): AutomationJob[] {
  try {
    if (!existsSync(queuePath())) return []
    return JSON.parse(readFileSync(queuePath(), "utf8")) as AutomationJob[]
  } catch (error) {
    console.error("Could not read the automation queue", error)
    return []
  }
}

function writeJobs(jobs: AutomationJob[]) {
  mkdirSync(dirname(queuePath()), { recursive: true })
  const temporaryPath = `${queuePath()}.tmp`
  writeFileSync(temporaryPath, `${JSON.stringify(jobs, null, 2)}\n`, {
    mode: 0o600,
  })
  renameSync(temporaryPath, queuePath())
  chmodSync(queuePath(), 0o600)
}

function updateJob(documentId: number, update: Partial<AutomationJob>) {
  const jobs = readJobs()
  const index = jobs.findIndex((job) => job.documentId === documentId)
  if (index === -1) return
  jobs[index] = {
    ...jobs[index],
    ...update,
    updatedAt: new Date().toISOString(),
  }
  writeJobs(jobs)
}

async function processDocument(documentId: number) {
  const ocr = await generateDocumentOcr(documentId)
  await replaceDocumentOcr(documentId, ocr.generatedText)
  const classification = await classifyDocument(documentId)
  await applyClassification(documentId, classification)
}

async function processQueue() {
  const pending = readJobs().filter(
    (job) => job.status === "pending" || job.status === "processing"
  )
  await pending.reduce(
    (previous, job) =>
      previous.then(async () => {
        updateJob(job.documentId, {
          status: "processing",
          attempts: job.attempts + 1,
          error: undefined,
        })
        try {
          await processDocument(job.documentId)
          updateJob(job.documentId, { status: "complete" })
        } catch (error) {
          updateJob(job.documentId, {
            status: "failed",
            error: error instanceof Error ? error.message : "Automation failed",
          })
        }
      }),
    Promise.resolve()
  )
}

export function resumeAutomationQueue() {
  if (!getRuntimeSettings().automationEnabled || queuePromise) return
  queuePromise = processQueue().finally(() => {
    queuePromise = null
  })
}

export function enqueueDocumentAutomation(documentId: number) {
  const jobs = readJobs()
  const existing = jobs.find((job) => job.documentId === documentId)
  if (existing?.status === "complete" || existing?.status === "pending") {
    return { queued: false, status: existing.status }
  }

  const now = new Date().toISOString()
  const next: AutomationJob = {
    documentId,
    status: "pending",
    attempts: existing?.attempts || 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }
  const nextJobs = existing
    ? jobs.map((job) => (job.documentId === documentId ? next : job))
    : [...jobs, next]
  writeJobs(nextJobs)
  resumeAutomationQueue()
  return { queued: true, status: "pending" as const }
}

export function webhookSecretMatches(request: Request) {
  const expected = getRuntimeSettings().webhookSecret
  const authorization = request.headers.get("authorization")
  const provided =
    request.headers.get("x-webhook-secret") ||
    (authorization?.startsWith("Bearer ") ? authorization.slice(7) : "")
  if (!expected || !provided) return false
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)
  if (expectedBuffer.length !== providedBuffer.length) return false
  return timingSafeEqual(expectedBuffer, providedBuffer)
}
