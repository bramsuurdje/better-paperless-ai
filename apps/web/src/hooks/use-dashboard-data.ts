import { useMemo } from "react"

import type { DashboardData } from "@/lib/paperless.types"

export function useDashboardData({
  data,
  query,
  classificationFilter,
  correspondentFilter,
  documentTypeFilter,
}: {
  data: DashboardData
  query: string
  classificationFilter: string
  correspondentFilter: string
  documentTypeFilter: string
}) {
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

  return {
    bulkCandidates,
    correspondentNames,
    correspondentOptions,
    documentTypeNames,
    documentTypeOptions,
    filteredDocuments,
  }
}
