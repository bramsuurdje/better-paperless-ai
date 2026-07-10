import type { diffLines } from "diff"

import type {
  Classification,
  OcrComparison,
  PaperlessDocument,
} from "@/lib/paperless.types"
import { ClassificationDialog } from "./classification-dialog"
import { DeleteDocumentDialog } from "./delete-document-dialog"
import { OcrDialog } from "./ocr-dialog"

export function DashboardDialogs({
  selected,
  suggestion,
  setSuggestion,
  applying,
  setSelected,
  apply,
  ocrTarget,
  setOcrTarget,
  ocrComparison,
  generatingOcr,
  replacingOcr,
  model,
  ocrDiff,
  replaceOcr,
  deleteTarget,
  setDeleteTarget,
  skipDeleteConfirmation,
  setSkipDeleteConfirmation,
  confirmDelete,
}: {
  selected: PaperlessDocument | null
  suggestion: Classification | null
  setSuggestion: (value: Classification | null) => void
  applying: boolean
  setSelected: (value: PaperlessDocument | null) => void
  apply: () => Promise<void>
  ocrTarget: PaperlessDocument | null
  setOcrTarget: (value: PaperlessDocument | null) => void
  ocrComparison: OcrComparison | null
  generatingOcr: boolean
  replacingOcr: boolean
  model: string
  ocrDiff: ReturnType<typeof diffLines>
  replaceOcr: () => Promise<void>
  deleteTarget: PaperlessDocument | null
  setDeleteTarget: (value: PaperlessDocument | null) => void
  skipDeleteConfirmation: boolean
  setSkipDeleteConfirmation: (value: boolean) => void
  confirmDelete: () => void
}) {
  return (
    <>
      <ClassificationDialog
        selected={selected}
        suggestion={suggestion}
        setSuggestion={setSuggestion}
        applying={applying}
        setSelected={setSelected}
        apply={apply}
      />
      <OcrDialog
        target={ocrTarget}
        setTarget={setOcrTarget}
        comparison={ocrComparison}
        generating={generatingOcr}
        replacing={replacingOcr}
        model={model}
        diff={ocrDiff}
        replaceOcr={replaceOcr}
      />
      <DeleteDocumentDialog
        target={deleteTarget}
        setTarget={setDeleteTarget}
        skipConfirmation={skipDeleteConfirmation}
        setSkipConfirmation={setSkipDeleteConfirmation}
        confirmDelete={confirmDelete}
      />
    </>
  )
}
