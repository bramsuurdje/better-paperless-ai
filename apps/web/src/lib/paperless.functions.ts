import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import {
  applyClassification,
  classifyDocument,
  loadDashboard,
} from "./paperless.server"

const classificationSchema = z.object({
  title: z.string().min(1).max(250),
  correspondent: z.string().max(250),
  documentType: z.string().max(250),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(1000),
})

export const getDashboard = createServerFn({ method: "GET" }).handler(
  loadDashboard
)

export const classifyDocumentFn = createServerFn({ method: "POST" })
  .validator(z.object({ documentId: z.number().int().positive() }))
  .handler(({ data }) => classifyDocument(data.documentId))

export const applyClassificationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      documentId: z.number().int().positive(),
      suggestion: classificationSchema,
    })
  )
  .handler(({ data }) => applyClassification(data.documentId, data.suggestion))
