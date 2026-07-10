import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { updateRuntimeSettings } from "./settings.server"

const settingsSchema = z.object({
  paperlessUrl: z.url(),
  paperlessApiKey: z.string().max(500).optional(),
  openRouterApiKey: z.string().max(500).optional(),
  openRouterModel: z.string().min(1).max(200),
  automationEnabled: z.boolean(),
  webhookSecret: z.string().max(500).optional(),
})

export const updateSettingsFn = createServerFn({ method: "POST" })
  .validator(settingsSchema)
  .handler(({ data }) => updateRuntimeSettings(data))
