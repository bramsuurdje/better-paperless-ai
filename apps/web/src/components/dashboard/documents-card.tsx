import { HugeiconsIcon } from "@hugeicons/react"
import { AiMagicIcon } from "@hugeicons/core-free-icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"

import type { DashboardData, PaperlessDocument } from "@/lib/paperless.types"
import { DocumentFilters } from "./document-filters"
import type { FilterOption } from "./document-filters"
import { DocumentsTable } from "./documents-table"

export function DocumentsCard({
  data,
  bulkCandidates,
  bulkProgress,
  classifyAll,
  query,
  setQuery,
  classificationFilter,
  setClassificationFilter,
  correspondentFilter,
  setCorrespondentFilter,
  documentTypeFilter,
  setDocumentTypeFilter,
  correspondentOptions,
  documentTypeOptions,
  filteredDocuments,
  classifyingId,
  correspondentNames,
  documentTypeNames,
  deletingId,
  generatingOcr,
  classify,
  generateOcr,
  requestDelete,
}: {
  data: DashboardData
  bulkCandidates: PaperlessDocument[]
  bulkProgress: { completed: number; total: number; failed: number } | null
  classifyAll: () => Promise<void>
  query: string
  setQuery: (value: string) => void
  classificationFilter: string
  setClassificationFilter: (value: string) => void
  correspondentFilter: string
  setCorrespondentFilter: (value: string) => void
  documentTypeFilter: string
  setDocumentTypeFilter: (value: string) => void
  correspondentOptions: FilterOption[]
  documentTypeOptions: FilterOption[]
  filteredDocuments: PaperlessDocument[]
  classifyingId: number | null
  correspondentNames: Map<number, string>
  documentTypeNames: Map<number, string>
  deletingId: number | null
  generatingOcr: boolean
  classify: (document: PaperlessDocument) => Promise<void>
  generateOcr: (document: PaperlessDocument) => Promise<void>
  requestDelete: (document: PaperlessDocument) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Review one document or classify every document still missing
              metadata.
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  disabled={
                    !data.openRouterConfigured ||
                    !bulkCandidates.length ||
                    Boolean(bulkProgress)
                  }
                />
              }
            >
              {bulkProgress ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  icon={AiMagicIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
              )}
              {bulkProgress
                ? `${bulkProgress.completed} of ${bulkProgress.total}`
                : `Classify all (${bulkCandidates.length})`}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Classify {bulkCandidates.length} documents?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Each OCR-ready document missing a correspondent or type will
                  be sent to {data.model} and updated in Paperless. This can use
                  OpenRouter credits and may take several minutes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={classifyAll}>
                  Start classification
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {bulkProgress ? (
          <div className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-3">
            <div className="flex items-center justify-between text-sm">
              <span>Classifying documents</span>
              <span className="text-muted-foreground">
                {bulkProgress.completed} / {bulkProgress.total}
                {bulkProgress.failed ? `, ${bulkProgress.failed} failed` : ""}
              </span>
            </div>
            <Progress
              value={
                bulkProgress.total
                  ? (bulkProgress.completed / bulkProgress.total) * 100
                  : 0
              }
            />
          </div>
        ) : null}
        <DocumentFilters
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
        />

        <DocumentsTable
          data={data}
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
      </CardContent>
      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredDocuments.length} of {data.totalDocuments}
        </span>
        <span>Paperless at 10.0.0.5</span>
      </CardFooter>
    </Card>
  )
}
