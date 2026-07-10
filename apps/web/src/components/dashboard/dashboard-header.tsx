import { useState } from "react"
import { File02Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "@tanstack/react-router"

import { Button } from "@workspace/ui/components/button"

import { SettingsDialog } from "@/components/settings-dialog"
import type { PublicSettings } from "@/lib/settings.types"

export function DashboardHeader({ settings }: { settings: PublicSettings }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
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
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <HugeiconsIcon
              icon={Settings02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Settings
          </Button>
        </div>
      </header>
      {settingsOpen ? (
        <SettingsDialog
          settings={settings}
          close={() => setSettingsOpen(false)}
          saved={() => router.invalidate()}
        />
      ) : null}
    </>
  )
}
