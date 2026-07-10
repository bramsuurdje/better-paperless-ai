import type { diffLines } from "diff"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileScanIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

import type { OcrComparison, PaperlessDocument } from "@/lib/paperless.types"

export function OcrDialog({
  target: ocrTarget,
  setTarget: setOcrTarget,
  comparison: ocrComparison,
  generating: generatingOcr,
  replacing: replacingOcr,
  model,
  diff: ocrDiff,
  replaceOcr,
}: {
  target: PaperlessDocument | null
  setTarget: (value: PaperlessDocument | null) => void
  comparison: OcrComparison | null
  generating: boolean
  replacing: boolean
  model: string
  diff: ReturnType<typeof diffLines>
  replaceOcr: () => Promise<void>
}) {
  return (
    <Dialog
      open={Boolean(ocrTarget)}
      onOpenChange={(open) => !open && !replacingOcr && setOcrTarget(null)}
    >
      <DialogContent className="max-h-[90svh] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Review AI-generated OCR</DialogTitle>
          <DialogDescription>
            Compare the current Paperless text with the transcription from{" "}
            {model}. Replacing it changes only the OCR text, not the stored
            document file.
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
                {ocrDiff.map((part) => (
                  <pre
                    key={`${part.added ? "added" : part.removed ? "removed" : "unchanged"}:${part.value}`}
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
  )
}
