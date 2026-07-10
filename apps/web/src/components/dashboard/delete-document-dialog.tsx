import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"

import type { PaperlessDocument } from "@/lib/paperless.types"

export function DeleteDocumentDialog({
  target: deleteTarget,
  setTarget: setDeleteTarget,
  skipConfirmation: skipDeleteConfirmation,
  setSkipConfirmation: setSkipDeleteConfirmation,
  confirmDelete,
}: {
  target: PaperlessDocument | null
  setTarget: (value: PaperlessDocument | null) => void
  skipConfirmation: boolean
  setSkipConfirmation: (value: boolean) => void
  confirmDelete: () => void
}) {
  return (
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
  )
}
