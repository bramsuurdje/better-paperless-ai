import { describe, expect, test } from "bun:test"

import { parsePaperlessDocumentId } from "./paperless-webhook"

describe("parsePaperlessDocumentId", () => {
  test("accepts a numeric document ID", () => {
    expect(parsePaperlessDocumentId({ document_id: "123" })).toBe(123)
  })

  test("extracts an ID from the Paperless document URL placeholder", () => {
    expect(
      parsePaperlessDocumentId({
        document_url: "http://paperless:8000/documents/456/details",
      })
    ).toBe(456)
  })

  test("rejects unrelated URLs", () => {
    expect(
      parsePaperlessDocumentId({
        document_url: "http://paperless:8000/settings/workflows",
      })
    ).toBeNull()
  })
})
