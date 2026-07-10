import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { diffLines } from "diff"
import { toast } from "sonner"

import {
  applyClassificationFn,
  classifyDocumentFn,
  deleteDocumentFn,
  generateDocumentOcrFn,
  getDashboard,
  replaceDocumentOcrFn,
} from "@/lib/paperless.functions"
import type {
  Classification,
  OcrComparison,
  PaperlessDocument,
} from "@/lib/paperless.types"
import { DashboardDialogs } from "@/components/dashboard/dashboard-dialogs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStatus } from "@/components/dashboard/dashboard-status"
import { DocumentsCard } from "@/components/dashboard/documents-card"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export const Route = createFileRoute("/")({
  loader: () => getDashboard(),
  component: Dashboard,
})

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [classificationFilter, setClassificationFilter] = useState("all")
  const [correspondentFilter, setCorrespondentFilter] = useState("all")
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all")
  const [selected, setSelected] = useState<PaperlessDocument | null>(null)
  const [suggestion, setSuggestion] = useState<Classification | null>(null)
  const [classifyingId, setClassifyingId] = useState<number | null>(null)
  const [applying, setApplying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{
    completed: number
    total: number
    failed: number
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaperlessDocument | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [skipDeleteConfirmation, setSkipDeleteConfirmation] = useState(false)
  const [ocrTarget, setOcrTarget] = useState<PaperlessDocument | null>(null)
  const [ocrComparison, setOcrComparison] = useState<OcrComparison | null>(null)
  const [generatingOcr, setGeneratingOcr] = useState(false)
  const [replacingOcr, setReplacingOcr] = useState(false)

  const {
    bulkCandidates,
    correspondentNames,
    documentTypeNames,
    correspondentOptions,
    documentTypeOptions,
    filteredDocuments,
  } = useDashboardData({
    data,
    query,
    classificationFilter,
    correspondentFilter,
    documentTypeFilter,
  })
  const ocrDiff = useMemo(
    () =>
      ocrComparison
        ? diffLines(ocrComparison.currentText, ocrComparison.generatedText)
        : [],
    [ocrComparison]
  )

  async function classify(document: PaperlessDocument) {
    setSelected(document)
    setSuggestion(null)
    setClassifyingId(document.id)
    try {
      const result = await classifyDocumentFn({
        data: { documentId: document.id },
      })
      setSuggestion(result)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Classification failed"
      )
      setSelected(null)
    } finally {
      setClassifyingId(null)
    }
  }

  async function apply() {
    if (!selected || !suggestion) return
    setApplying(true)
    try {
      await applyClassificationFn({
        data: { documentId: selected.id, suggestion },
      })
      toast.success("Classification applied to Paperless")
      setSelected(null)
      setSuggestion(null)
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update Paperless"
      )
    } finally {
      setApplying(false)
    }
  }

  async function classifyAll() {
    const candidates = bulkCandidates
    setBulkProgress({ completed: 0, total: candidates.length, failed: 0 })
    let failed = 0

    await candidates.reduce(
      (previous, document, index) =>
        previous.then(async () => {
          try {
            const result = await classifyDocumentFn({
              data: { documentId: document.id },
            })
            await applyClassificationFn({
              data: { documentId: document.id, suggestion: result },
            })
          } catch {
            failed += 1
          }
          setBulkProgress({
            completed: index + 1,
            total: candidates.length,
            failed,
          })
        }),
      Promise.resolve()
    )

    if (failed) {
      toast.warning(
        `Classified ${candidates.length - failed} documents; ${failed} failed`
      )
    } else {
      toast.success(`Classified ${candidates.length} documents`)
    }
    setBulkProgress(null)
    await router.invalidate()
  }

  function requestDelete(document: PaperlessDocument) {
    if (
      localStorage.getItem("paperless-ai-skip-delete-confirmation") === "true"
    ) {
      void removeDocument(document)
      return
    }
    setSkipDeleteConfirmation(false)
    setDeleteTarget(document)
  }

  async function removeDocument(document: PaperlessDocument) {
    setDeletingId(document.id)
    try {
      await deleteDocumentFn({ data: { documentId: document.id } })
      toast.success("Document deleted from Paperless")
      setDeleteTarget(null)
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete document"
      )
    } finally {
      setDeletingId(null)
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (skipDeleteConfirmation) {
      localStorage.setItem("paperless-ai-skip-delete-confirmation", "true")
    }
    void removeDocument(deleteTarget)
  }

  async function generateOcr(document: PaperlessDocument) {
    setOcrTarget(document)
    setOcrComparison(null)
    setGeneratingOcr(true)
    try {
      const result = await generateDocumentOcrFn({
        data: { documentId: document.id },
      })
      setOcrComparison(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI OCR failed")
      setOcrTarget(null)
    } finally {
      setGeneratingOcr(false)
    }
  }

  async function replaceOcr() {
    if (!ocrTarget || !ocrComparison) return
    setReplacingOcr(true)
    try {
      await replaceDocumentOcrFn({
        data: {
          documentId: ocrTarget.id,
          content: ocrComparison.generatedText,
        },
      })
      toast.success("Paperless OCR text replaced")
      setOcrTarget(null)
      setOcrComparison(null)
      await router.invalidate()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not replace OCR text"
      )
    } finally {
      setReplacingOcr(false)
    }
  }

  return (
    <main className="min-h-svh bg-muted/40">
      <DashboardHeader settings={data.settings} />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:px-8">
        <DashboardStatus data={data} />

        <DocumentsCard
          data={data}
          bulkCandidates={bulkCandidates}
          bulkProgress={bulkProgress}
          classifyAll={classifyAll}
          query={query}
          setQuery={setQuery}
          classificationFilter={classificationFilter}
          setClassificationFilter={setClassificationFilter}
          correspondentFilter={correspondentFilter}
          setCorrespondentFilter={setCorrespondentFilter}
          documentTypeFilter={documentTypeFilter}
          setDocumentTypeFilter={setDocumentTypeFilter}
          correspondentOptions={correspondentOptions}
          documentTypeOptions={documentTypeOptions}
          filteredDocuments={filteredDocuments}
          classifyingId={classifyingId}
          correspondentNames={correspondentNames}
          documentTypeNames={documentTypeNames}
          deletingId={deletingId}
          generatingOcr={generatingOcr}
          classify={classify}
          generateOcr={generateOcr}
          requestDelete={requestDelete}
        />
      </div>

      <DashboardDialogs
        selected={selected}
        suggestion={suggestion}
        setSuggestion={setSuggestion}
        applying={applying}
        setSelected={setSelected}
        apply={apply}
        ocrTarget={ocrTarget}
        setOcrTarget={setOcrTarget}
        ocrComparison={ocrComparison}
        generatingOcr={generatingOcr}
        replacingOcr={replacingOcr}
        model={data.model}
        ocrDiff={ocrDiff}
        replaceOcr={replaceOcr}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        skipDeleteConfirmation={skipDeleteConfirmation}
        setSkipDeleteConfirmation={setSkipDeleteConfirmation}
        confirmDelete={confirmDelete}
      />
    </main>
  )
}
