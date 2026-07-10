import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"

import type { PublicSettings, SettingsUpdate } from "./settings.types"

type StoredSettings = {
  paperlessUrl?: string
  paperlessApiKey?: string
  openRouterApiKey?: string
  openRouterModel?: string
  automationEnabled?: boolean
  webhookSecret?: string
}

const settingsPath = () =>
  process.env.SETTINGS_FILE_PATH ||
  join(
    process.env.APP_DATA_DIR || join(process.cwd(), ".data"),
    "settings.json"
  )

function readStoredSettings(): StoredSettings {
  try {
    if (!existsSync(settingsPath())) return {}
    return JSON.parse(readFileSync(settingsPath(), "utf8")) as StoredSettings
  } catch (error) {
    console.error("Could not read runtime settings", error)
    return {}
  }
}

export function getRuntimeSettings() {
  const stored = readStoredSettings()
  return {
    paperlessUrl: (
      stored.paperlessUrl ||
      process.env.PAPERLESS_URL ||
      "http://10.0.0.5:8444"
    ).replace(/\/$/, ""),
    paperlessApiKey:
      stored.paperlessApiKey || process.env.PAPERLESS_API_KEY || "",
    openRouterApiKey:
      stored.openRouterApiKey || process.env.OPENROUTER_API_KEY || "",
    openRouterModel:
      stored.openRouterModel ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash",
    automationEnabled:
      stored.automationEnabled ?? process.env.AUTOMATION_ENABLED === "true",
    webhookSecret: stored.webhookSecret || process.env.WEBHOOK_SECRET || "",
  }
}

export function getPublicSettings(): PublicSettings {
  const settings = getRuntimeSettings()
  return {
    paperlessUrl: settings.paperlessUrl,
    paperlessApiKeyConfigured: Boolean(settings.paperlessApiKey),
    openRouterApiKeyConfigured: Boolean(settings.openRouterApiKey),
    openRouterModel: settings.openRouterModel,
    automationEnabled: settings.automationEnabled,
    webhookSecretConfigured: Boolean(settings.webhookSecret),
    webhookPath: "/api/webhooks/paperless",
  }
}

export function updateRuntimeSettings(update: SettingsUpdate) {
  const current = readStoredSettings()
  const next: StoredSettings = {
    ...current,
    paperlessUrl: update.paperlessUrl.trim().replace(/\/$/, ""),
    openRouterModel: update.openRouterModel.trim(),
    automationEnabled: update.automationEnabled,
  }
  if (update.paperlessApiKey?.trim()) {
    next.paperlessApiKey = update.paperlessApiKey.trim()
  }
  if (update.openRouterApiKey?.trim()) {
    next.openRouterApiKey = update.openRouterApiKey.trim()
  }
  if (update.webhookSecret?.trim()) {
    next.webhookSecret = update.webhookSecret.trim()
  }

  mkdirSync(dirname(settingsPath()), { recursive: true })
  const temporaryPath = `${settingsPath()}.tmp`
  writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, {
    mode: 0o600,
  })
  renameSync(temporaryPath, settingsPath())
  chmodSync(settingsPath(), 0o600)
  return getPublicSettings()
}
