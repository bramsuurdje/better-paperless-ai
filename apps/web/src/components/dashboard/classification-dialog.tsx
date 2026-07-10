import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

import type { Classification, PaperlessDocument } from "@/lib/paperless.types"

export function ClassificationDialog({
  selected,
  suggestion,
  setSuggestion,
  applying,
  setSelected,
  apply,
}: {
  selected: PaperlessDocument | null
  suggestion: Classification | null
  setSuggestion: (value: Classification | null) => void
  applying: boolean
  setSelected: (value: PaperlessDocument | null) => void
  apply: () => Promise<void>
}) {
  return (
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
                <FieldLabel htmlFor="suggested-type">Document type</FieldLabel>
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
              <Textarea id="reasoning" value={suggestion.reasoning} readOnly />
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
  )
}
