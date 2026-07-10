export type PaperlessDocument = {
  id: number
  title: string
  content: string
  created: string
  added: string
  correspondent: number | null
  document_type: number | null
  original_file_name: string | null
}

export type NamedResource = {
  id: number
  name: string
}

export type DashboardData = {
  paperlessUrl: string
  documents: PaperlessDocument[]
  correspondents: NamedResource[]
  documentTypes: NamedResource[]
  totalDocuments: number
  connectionError: string | null
  openRouterConfigured: boolean
  model: string
}

export type Classification = {
  title: string
  correspondent: string
  documentType: string
  confidence: number
  reasoning: string
}

export type OcrComparison = {
  currentText: string
  generatedText: string
}
