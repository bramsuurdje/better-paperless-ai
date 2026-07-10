import { createFileRoute } from "@tanstack/react-router"

import {
  enqueueDocumentAutomation,
  webhookSecretMatches,
} from "@/lib/automation.server"
import { getRuntimeSettings } from "@/lib/settings.server"

export const Route = createFileRoute("/api/webhooks/paperless")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const settings = getRuntimeSettings()
        if (!webhookSecretMatches(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (!settings.automationEnabled) {
          return Response.json(
            { error: "Automation is disabled" },
            { status: 409 }
          )
        }

        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return Response.json(
            { error: "Expected a JSON body" },
            { status: 400 }
          )
        }
        const body = payload as Record<string, unknown>
        const candidate = body.document_id ?? body.doc_id ?? body.id
        const documentId = Number(candidate)
        if (!Number.isInteger(documentId) || documentId <= 0) {
          return Response.json(
            { error: "document_id must be a positive integer" },
            { status: 400 }
          )
        }

        const result = enqueueDocumentAutomation(documentId)
        return Response.json({ documentId, ...result }, { status: 202 })
      },
    },
  },
})
