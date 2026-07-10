import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  File02Icon,
  RefreshIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
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
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  applyClassificationFn,
  classifyDocumentFn,
  getDashboard,
} from "@/lib/paperless.functions"
import type { Classification, PaperlessDocument } from "@/lib/paperless.types"

export const Route = createFileRoute("/")({
  loader: () => getDashboard(),
  component: Dashboard,
})

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<PaperlessDocument | null>(null)
  const [suggestion, setSuggestion] = useState<Classification | null>(null)
  const [classifyingId, setClassifyingId] = useState<number | null>(null)
  const [applying, setApplying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{
    completed: number
    total: number
    failed: number
  } | null>(null)

  const bulkCandidates = useMemo(
    () =>
      data.documents.filter(
        (document) =>
          document.content &&
          (!document.correspondent || !document.document_type)
      ),
    [data.documents]
  )

  const filteredDocuments = useMemo(() => {
    const normalized = query.toLocaleLowerCase().trim()
    if (!normalized) return data.documents
    return data.documents.filter((document) =>
      [document.title, document.content, document.original_file_name]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized))
    )
  }, [data.documents, query])

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

    for (const [index, document] of candidates.entries()) {
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
    }

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

  return (
    <main className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold">Paperless AI</p>
              <p className="text-xs text-muted-foreground">Document inbox</p>
            </div>
          </div>
          <Badge variant={data.openRouterConfigured ? "secondary" : "outline"}>
            {data.openRouterConfigured ? "AI ready" : "OpenRouter key needed"}
          </Badge>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 lg:px-8">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">
            Smart document management
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn an untidy inbox into useful records.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Review Paperless OCR text, generate clear titles, and assign
            correspondents and document types with {data.model}.
          </p>
        </section>

        {data.connectionError ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
            <AlertTitle>Paperless is unavailable</AlertTitle>
            <AlertDescription>{data.connectionError}</AlertDescription>
          </Alert>
        ) : null}

        {!data.openRouterConfigured ? (
          <Alert>
            <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} />
            <AlertTitle>Connect OpenRouter to classify documents</AlertTitle>
            <AlertDescription>
              Add OPENROUTER_API_KEY to apps/web/.env.local, then restart the
              development server. Paperless browsing already works.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Documents"
            value={data.totalDocuments}
            detail={`${data.documents.length} newest loaded`}
          />
          <StatCard
            label="Correspondents"
            value={data.correspondents.length}
            detail="Available for reuse"
          />
          <StatCard
            label="Document types"
            value={data.documentTypes.length}
            detail="Available for reuse"
          />
        </section>

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
                      Each OCR-ready document missing a correspondent or type
                      will be sent to {data.model} and updated in Paperless.
                      This can use OpenRouter credits and may take several
                      minutes.
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
          <CardContent className="flex flex-col gap-4">
            {bulkProgress ? (
              <div className="flex flex-col gap-2 rounded-lg bg-muted px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Classifying documents</span>
                  <span className="text-muted-foreground">
                    {bulkProgress.completed} / {bulkProgress.total}
                    {bulkProgress.failed
                      ? `, ${bulkProgress.failed} failed`
                      : ""}
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
            <div className="relative max-w-md">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or OCR text"
                className="pl-9"
              />
            </div>

            {filteredDocuments.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Metadata
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const isClassifying = classifyingId === document.id
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex max-w-xl flex-col gap-1">
                            <span className="truncate font-medium">
                              {document.title}
                            </span>
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {document.content || "No OCR text available"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDate(document.created)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {document.correspondent
                                ? "Correspondent set"
                                : "No correspondent"}
                            </Badge>
                            <Badge variant="outline">
                              {document.document_type ? "Type set" : "No type"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              Boolean(classifyingId) || !document.content
                            }
                            onClick={() => classify(document)}
                          >
                            {isClassifying ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <HugeiconsIcon
                                icon={AiMagicIcon}
                                strokeWidth={2}
                                data-icon="inline-start"
                              />
                            )}
                            {isClassifying ? "Reading" : "Classify"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={File02Icon} strokeWidth={2} />
                  </EmptyMedia>
                  <EmptyTitle>No documents found</EmptyTitle>
                  <EmptyDescription>
                    Try another search or add documents to Paperless.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
          <CardFooter className="justify-between text-xs text-muted-foreground">
            <span>
              Showing {filteredDocuments.length} of {data.totalDocuments}
            </span>
            <span>Paperless at 10.0.0.5</span>
          </CardFooter>
        </Card>
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && !applying && setSelected(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review classification</DialogTitle>
            <DialogDescription>
              Confirm the proposed metadata before updating {selected?.title}.
            </DialogDescription>
          </DialogHeader>
          {suggestion ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="suggested-title">Title</FieldLabel>
                <Input
                  id="suggested-title"
                  value={suggestion.title}
                  onChange={(event) =>
                    setSuggestion({ ...suggestion, title: event.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="suggested-correspondent">
                    Correspondent
                  </FieldLabel>
                  <Input
                    id="suggested-correspondent"
                    value={suggestion.correspondent}
                    onChange={(event) =>
                      setSuggestion({
                        ...suggestion,
                        correspondent: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="suggested-type">
                    Document type
                  </FieldLabel>
                  <Input
                    id="suggested-type"
                    value={suggestion.documentType}
                    onChange={(event) =>
                      setSuggestion({
                        ...suggestion,
                        documentType: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="reasoning">
                  Why this classification
                </FieldLabel>
                <Textarea
                  id="reasoning"
                  value={suggestion.reasoning}
                  readOnly
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Model confidence</span>
                <Badge variant="secondary">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
            </FieldGroup>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <Spinner className="size-6" />
              <div>
                <p className="font-medium">Reading OCR text</p>
                <p className="text-sm text-muted-foreground">
                  Generating a title and reusable metadata.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={applying}
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            <Button disabled={!suggestion || applying} onClick={apply}>
              {applying ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
              )}
              {applying ? "Updating" : "Apply to Paperless"}
              {!applying ? (
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  data-icon="inline-end"
                />
              ) : null}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(
    new Date(value)
  )
}
