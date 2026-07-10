import { useMemo, useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { diffLines } from "diff"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  ArrowUpRight01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  File02Icon,
  FileScanIcon,
  More02Icon,
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
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
import { cn } from "@workspace/ui/lib/utils"

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

const classificationOptions = [
  { label: "Needs classification", value: "unclassified" },
  { label: "Already classified", value: "classified" },
  { label: "Any classification status", value: "all" },
]

export const Route = createFileRoute("/")({
  loader: () => getDashboard(),
  component: Dashboard,
})

function Dashboard() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [classificationFilter, setClassificationFilter] =
    useState("unclassified")
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

  const bulkCandidates = useMemo(
    () =>
      data.documents.filter(
        (document) =>
          document.content &&
          (!document.correspondent || !document.document_type)
      ),
    [data.documents]
  )

  const correspondentNames = useMemo(
    () => new Map(data.correspondents.map((item) => [item.id, item.name])),
    [data.correspondents]
  )
  const documentTypeNames = useMemo(
    () => new Map(data.documentTypes.map((item) => [item.id, item.name])),
    [data.documentTypes]
  )
  const correspondentOptions = useMemo(
    () => [
      { label: "Any correspondent", value: "all" },
      { label: "Without a correspondent", value: "none" },
      ...data.correspondents.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    ],
    [data.correspondents]
  )
  const documentTypeOptions = useMemo(
    () => [
      { label: "Any document type", value: "all" },
      { label: "Without a document type", value: "none" },
      ...data.documentTypes.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    ],
    [data.documentTypes]
  )

  const filteredDocuments = useMemo(() => {
    const normalized = query.toLocaleLowerCase().trim()
    return data.documents.filter((document) => {
      const isClassified = Boolean(
        document.correspondent && document.document_type
      )
      if (classificationFilter === "classified" && !isClassified) return false
      if (classificationFilter === "unclassified" && isClassified) return false
      if (
        correspondentFilter !== "all" &&
        String(document.correspondent ?? "none") !== correspondentFilter
      )
        return false
      if (
        documentTypeFilter !== "all" &&
        String(document.document_type ?? "none") !== documentTypeFilter
      )
        return false
      if (!normalized) return true
      return [
        document.title,
        document.content,
        document.original_file_name,
        document.correspondent
          ? correspondentNames.get(document.correspondent)
          : null,
        document.document_type
          ? documentTypeNames.get(document.document_type)
          : null,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized))
    })
  }, [
    classificationFilter,
    correspondentFilter,
    correspondentNames,
    data.documents,
    documentTypeFilter,
    documentTypeNames,
    query,
  ])
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
          <CardContent className="flex flex-col gap-6">
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
            <FieldGroup className="gap-4 lg:grid lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(10rem,auto))] lg:items-end">
              <Field>
                <FieldLabel htmlFor="document-search">Search</FieldLabel>
                <div className="relative min-w-0">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="document-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Title, OCR text, or metadata"
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel>Classification</FieldLabel>
                <Select
                  items={classificationOptions}
                  value={classificationFilter}
                  onValueChange={(value) =>
                    value && setClassificationFilter(value)
                  }
                >
                  <SelectTrigger className="w-full min-w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Classification status</SelectLabel>
                      {classificationOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Correspondent</FieldLabel>
                <Select
                  items={correspondentOptions}
                  value={correspondentFilter}
                  onValueChange={(value) =>
                    value && setCorrespondentFilter(value)
                  }
                >
                  <SelectTrigger className="w-full max-w-64 min-w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="min-w-64"
                    alignItemWithTrigger={false}
                  >
                    <SelectGroup>
                      <SelectLabel>Correspondent</SelectLabel>
                      {correspondentOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Document type</FieldLabel>
                <Select
                  items={documentTypeOptions}
                  value={documentTypeFilter}
                  onValueChange={(value) =>
                    value && setDocumentTypeFilter(value)
                  }
                >
                  <SelectTrigger className="w-full max-w-64 min-w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="min-w-64"
                    alignItemWithTrigger={false}
                  >
                    <SelectGroup>
                      <SelectLabel>Document type</SelectLabel>
                      {documentTypeOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

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
                    const correspondent = document.correspondent
                      ? correspondentNames.get(document.correspondent)
                      : null
                    const documentType = document.document_type
                      ? documentTypeNames.get(document.document_type)
                      : null
                    const isClassified = Boolean(
                      document.correspondent && document.document_type
                    )
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <a
                            href={`${data.paperlessUrl}/documents/${document.id}/details`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex max-w-xl flex-col gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="flex min-w-0 items-center gap-1.5 font-medium group-hover:underline group-hover:underline-offset-4">
                              <span className="truncate">{document.title}</span>
                              <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                strokeWidth={2}
                                className="size-3.5 shrink-0 text-muted-foreground"
                              />
                            </span>
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {document.content || "No OCR text available"}
                            </span>
                          </a>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDate(document.created)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className="max-w-40"
                              title={correspondent || "No correspondent"}
                            >
                              <span className="truncate">
                                {correspondent || "No correspondent"}
                              </span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className="max-w-40"
                              title={documentType || "No document type"}
                            >
                              <span className="truncate">
                                {documentType || "No document type"}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isClassified ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    disabled={
                                      Boolean(classifyingId) ||
                                      deletingId === document.id
                                    }
                                  />
                                }
                              >
                                {deletingId === document.id ? (
                                  <Spinner />
                                ) : (
                                  <HugeiconsIcon
                                    icon={More02Icon}
                                    strokeWidth={2}
                                  />
                                )}
                                <span className="sr-only">
                                  Actions for {document.title}
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="min-w-52"
                              >
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => classify(document)}
                                  >
                                    <HugeiconsIcon
                                      icon={AiMagicIcon}
                                      strokeWidth={2}
                                    />
                                    Reclassify
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => generateOcr(document)}
                                  >
                                    <HugeiconsIcon
                                      icon={FileScanIcon}
                                      strokeWidth={2}
                                    />
                                    Generate AI OCR
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => requestDelete(document)}
                                  >
                                    <HugeiconsIcon
                                      icon={Delete02Icon}
                                      strokeWidth={2}
                                    />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <div className="flex justify-end gap-2">
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
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={generatingOcr}
                                onClick={() => generateOcr(document)}
                              >
                                <HugeiconsIcon
                                  icon={FileScanIcon}
                                  strokeWidth={2}
                                  data-icon="inline-start"
                                />
                                AI OCR
                              </Button>
                            </div>
                          )}
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

      <Dialog
        open={Boolean(ocrTarget)}
        onOpenChange={(open) => !open && !replacingOcr && setOcrTarget(null)}
      >
        <DialogContent className="max-h-[90svh] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Review AI-generated OCR</DialogTitle>
            <DialogDescription>
              Compare the current Paperless text with the transcription from{" "}
              {data.model}. Replacing it changes only the OCR text, not the
              stored document file.
            </DialogDescription>
          </DialogHeader>
          {generatingOcr ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
              <Spinner className="size-6" />
              <div>
                <p className="font-medium">Reading the original document</p>
                <p className="text-sm text-muted-foreground">
                  The private file is being sent to the configured OpenRouter
                  model.
                </p>
              </div>
            </div>
          ) : ocrComparison ? (
            <div className="flex min-h-0 flex-col gap-3">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Unchanged</span>{" "}
                  text
                </span>
                <span>
                  <span className="font-medium text-destructive">Removed</span>{" "}
                  from Paperless OCR
                </span>
                <span>
                  <span className="font-medium text-primary">Added</span> by AI
                  OCR
                </span>
              </div>
              <ScrollArea className="h-[55svh] border bg-muted/30">
                <div className="p-4 font-mono text-xs leading-relaxed">
                  {ocrDiff.map((part, index) => (
                    <pre
                      key={`${index}-${part.value.slice(0, 20)}`}
                      className={cn(
                        "px-2 py-1 break-words whitespace-pre-wrap",
                        part.added && "bg-primary/10 text-foreground",
                        part.removed && "bg-destructive/10 text-destructive"
                      )}
                    >
                      {part.value}
                    </pre>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={replacingOcr}
              onClick={() => setOcrTarget(null)}
            >
              Keep Paperless OCR
            </Button>
            <Button
              disabled={!ocrComparison || replacingOcr}
              onClick={replaceOcr}
            >
              {replacingOcr ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <HugeiconsIcon
                  icon={FileScanIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
              )}
              {replacingOcr ? "Replacing" : "Replace OCR text"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} will be permanently deleted from Paperless.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="skip-delete-confirmation"
                checked={skipDeleteConfirmation}
                onCheckedChange={setSkipDeleteConfirmation}
              />
              <FieldContent>
                <FieldLabel htmlFor="skip-delete-confirmation">
                  <FieldTitle>Don&apos;t ask me again</FieldTitle>
                </FieldLabel>
              </FieldContent>
            </Field>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
