import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export type FilterOption = { label: string; value: string }

const classificationOptions = [
  { label: "Needs classification", value: "unclassified" },
  { label: "Already classified", value: "classified" },
  { label: "Any classification status", value: "all" },
]

export function DocumentFilters({
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
}: {
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
}) {
  return (
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
          onValueChange={(value) => value && setClassificationFilter(value)}
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
          onValueChange={(value) => value && setCorrespondentFilter(value)}
        >
          <SelectTrigger className="w-full max-w-64 min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-64" alignItemWithTrigger={false}>
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
          onValueChange={(value) => value && setDocumentTypeFilter(value)}
        >
          <SelectTrigger className="w-full max-w-64 min-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-64" alignItemWithTrigger={false}>
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
  )
}
