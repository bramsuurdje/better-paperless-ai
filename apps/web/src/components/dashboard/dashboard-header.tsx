import { File02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@workspace/ui/components/badge"

export function DashboardHeader({
  openRouterConfigured,
}: {
  openRouterConfigured: boolean
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold">Paperless AI</p>
            <p className="text-xs text-muted-foreground">Document inbox</p>
          </div>
        </div>
        <Badge variant={openRouterConfigured ? "secondary" : "outline"}>
          {openRouterConfigured ? "AI ready" : "OpenRouter key needed"}
        </Badge>
      </div>
    </header>
  )
}
