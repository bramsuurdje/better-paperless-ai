import {
  AiMagicIcon,
  ArrowUpRight01Icon,
  Delete02Icon,
  File02Icon,
  FileScanIcon,
  More02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { DashboardData, PaperlessDocument } from "@/lib/paperless.types"

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function DocumentsTable({
  data,
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
    <>
      {filteredDocuments.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">Metadata</TableHead>
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
                            <HugeiconsIcon icon={More02Icon} strokeWidth={2} />
                          )}
                          <span className="sr-only">
                            Actions for {document.title}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-52">
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
                          disabled={Boolean(classifyingId) || !document.content}
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
    </>
  )
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
