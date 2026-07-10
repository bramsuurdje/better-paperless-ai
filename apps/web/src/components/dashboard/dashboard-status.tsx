import { AiMagicIcon, RefreshIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import type { DashboardData } from "@/lib/paperless.types"
import { StatCard } from "./stat-card"

export function DashboardStatus({ data }: { data: DashboardData }) {
  return (
    <>
      {data.connectionError ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          <AlertTitle>Paperless is unavailable</AlertTitle>
          <AlertDescription>{data.connectionError}</AlertDescription>
        </Alert>
      ) : null}

      {!data.openRouterConfigured ? (
        <Alert>
          <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
          <AlertTitle>Connect OpenRouter to classify documents</AlertTitle>
          <AlertDescription>
            Add OPENROUTER_API_KEY to apps/web/.env.local, then restart the
            development server. Paperless browsing already works.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Documents"
          value={data.totalDocuments}
          detail={`${data.documents.length} newest loaded`}
        />
        <StatCard
          label="Correspondents"
          value={data.correspondents.length}
          detail="Available for reuse"
        />
        <StatCard
          label="Document types"
          value={data.documentTypes.length}
          detail="Available for reuse"
        />
      </section>
    </>
  )
}
