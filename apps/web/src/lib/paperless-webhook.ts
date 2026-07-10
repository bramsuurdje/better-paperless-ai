export function parsePaperlessDocumentId(body: Record<string, unknown>) {
  const directId = body.document_id ?? body.doc_id ?? body.id
  const numericId = Number(directId)
  if (Number.isInteger(numericId) && numericId > 0) {
    return numericId
  }

  const documentUrl = body.document_url ?? body.doc_url
  if (typeof documentUrl !== "string") {
    return null
  }

  const match = documentUrl.match(/\/documents\/(\d+)(?:\/|$)/)
  if (!match) {
    return null
  }

  const idFromUrl = Number(match[1])
  return Number.isInteger(idFromUrl) && idFromUrl > 0 ? idFromUrl : null
}
