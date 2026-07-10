import { useReducer, useState } from "react"
import { Key01Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"

import { SecretInput } from "@/components/secret-input"
import { updateSettingsFn } from "@/lib/settings.functions"
import type { PublicSettings } from "@/lib/settings.types"

export function SettingsDialog({
  settings,
  close,
  saved,
}: {
  settings: PublicSettings
  close: () => void
  saved: () => Promise<void>
}) {
  const [form, updateForm] = useReducer(
    (
      current: {
        paperlessUrl: string
        openRouterModel: string
        automationEnabled: boolean
      },
      update: Partial<typeof current>
    ) => ({ ...current, ...update }),
    {
      paperlessUrl: settings.paperlessUrl,
      openRouterModel: settings.openRouterModel,
      automationEnabled: settings.automationEnabled,
    }
  )
  const [paperlessApiKey, setPaperlessApiKey] = useState("")
  const [openRouterApiKey, setOpenRouterApiKey] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [saving, setSaving] = useState(false)

  async function generateWebhookSecret() {
    const secret = crypto.randomUUID()
    setWebhookSecret(secret)

    try {
      await navigator.clipboard.writeText(secret)
      toast.success("Webhook secret generated and copied")
    } catch {
      toast.info("Webhook secret generated. Use the lock button to view it")
    }
  }

  async function saveSettings() {
    if (
      form.automationEnabled &&
      !settings.webhookSecretConfigured &&
      !webhookSecret.trim()
    ) {
      toast.error("Add a webhook secret before enabling automation")
      return
    }
    setSaving(true)
    try {
      await updateSettingsFn({
        data: {
          paperlessUrl: form.paperlessUrl,
          paperlessApiKey: paperlessApiKey || undefined,
          openRouterApiKey: openRouterApiKey || undefined,
          openRouterModel: form.openRouterModel,
          automationEnabled: form.automationEnabled,
          webhookSecret: webhookSecret || undefined,
        },
      })
      toast.success("Settings saved")
      await saved()
      close()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && close()}>
      <DialogContent className="flex h-[calc(100svh-2rem)] max-h-192 flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Runtime settings override environment variables. Secret values stay
            on the server and are never shown here.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-0 min-h-0 flex-1 pr-4">
          <FieldGroup className="py-1">
            <FieldSet>
              <FieldLegend>Paperless</FieldLegend>
              <FieldDescription>
                Connection details for the Paperless instance this app manages.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="paperless-url">Paperless URL</FieldLabel>
                  <Input
                    id="paperless-url"
                    type="url"
                    value={form.paperlessUrl}
                    onChange={(event) =>
                      updateForm({ paperlessUrl: event.target.value })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="paperless-api-key">API key</FieldLabel>
                  <SecretInput
                    id="paperless-api-key"
                    value={paperlessApiKey}
                    onChange={setPaperlessApiKey}
                    placeholder={
                      settings.paperlessApiKeyConfigured
                        ? "Configured. Leave blank to keep it"
                        : "Paste a Paperless API key"
                    }
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>OpenRouter</FieldLegend>
              <FieldDescription>
                Model and credentials used for OCR and document classification.
              </FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="openrouter-model">Model</FieldLabel>
                  <Input
                    id="openrouter-model"
                    value={form.openRouterModel}
                    onChange={(event) =>
                      updateForm({ openRouterModel: event.target.value })
                    }
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="openrouter-api-key">API key</FieldLabel>
                  <SecretInput
                    id="openrouter-api-key"
                    value={openRouterApiKey}
                    onChange={setOpenRouterApiKey}
                    placeholder={
                      settings.openRouterApiKeyConfigured
                        ? "Configured. Leave blank to keep it"
                        : "Paste an OpenRouter API key"
                    }
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <Separator />

            <FieldSet>
              <FieldLegend>Automatic processing</FieldLegend>
              <FieldDescription>
                Paperless can call the webhook after consuming a document. The
                app will generate OCR, replace the Paperless text, and assign
                metadata.
              </FieldDescription>
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="automation-enabled">
                      <FieldTitle>Enable webhook automation</FieldTitle>
                    </FieldLabel>
                    <FieldDescription>
                      New jobs are stored on disk and processed one at a time.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="automation-enabled"
                    checked={form.automationEnabled}
                    onCheckedChange={(automationEnabled) =>
                      updateForm({ automationEnabled })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="webhook-path">Webhook path</FieldLabel>
                  <Input
                    id="webhook-path"
                    value={settings.webhookPath}
                    readOnly
                  />
                  <FieldDescription>
                    Add this path to the public base URL of this app.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="webhook-secret">
                    Webhook secret
                  </FieldLabel>
                  <SecretInput
                    id="webhook-secret"
                    value={webhookSecret}
                    onChange={setWebhookSecret}
                    placeholder={
                      settings.webhookSecretConfigured
                        ? "Configured. Leave blank to keep it"
                        : "Choose a long random secret"
                    }
                  />
                  <FieldDescription>
                    Send it as a Bearer token or in the X-Webhook-Secret header.
                  </FieldDescription>
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateWebhookSecret}
                >
                  <HugeiconsIcon
                    icon={Key01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Generate secret
                </Button>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </ScrollArea>

        <DialogFooter className="shrink-0">
          <Button variant="outline" disabled={saving} onClick={close}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={saveSettings}>
            {saving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <HugeiconsIcon
                icon={Settings02Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            {saving ? "Saving" : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
