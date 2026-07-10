import { describe, expect, test } from "bun:test"

import { getOcrDiffPartKey } from "./ocr-diff"

describe("getOcrDiffPartKey", () => {
  test("keeps repeated diff segments unique", () => {
    const parts = [
      { removed: true, value: "" },
      { removed: true, value: "" },
      { value: "Repeated address" },
      { value: "Repeated address" },
    ]

    const keys = parts.map(getOcrDiffPartKey)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
