export type PublicSettings = {
  paperlessUrl: string
  paperlessApiKeyConfigured: boolean
  openRouterApiKeyConfigured: boolean
  openRouterModel: string
  automationEnabled: boolean
  webhookSecretConfigured: boolean
  webhookPath: string
}

export type SettingsUpdate = {
  paperlessUrl: string
  paperlessApiKey?: string
  openRouterApiKey?: string
  openRouterModel: string
  automationEnabled: boolean
  webhookSecret?: string
}
