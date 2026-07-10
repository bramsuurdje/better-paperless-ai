import { createFileRoute } from "@tanstack/react-router"

import {
  enqueueDocumentAutomation,
  webhookSecretMatches,
} from "@/lib/automation.server"
import { parsePaperlessDocumentId } from "@/lib/paperless-webhook"
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
        const documentId = parsePaperlessDocumentId(body)
        if (!documentId) {
          return Response.json(
            {
              error:
                "Provide a positive document_id or a Paperless document_url",
            },
            { status: 400 }
          )
        }

        const result = enqueueDocumentAutomation(documentId)
        return Response.json({ documentId, ...result }, { status: 202 })
      },
    },
  },
})
