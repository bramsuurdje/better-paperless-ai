export function getOcrDiffPartKey(
  part: { added?: boolean; removed?: boolean },
  index: number
) {
  const change = part.added ? "added" : part.removed ? "removed" : "unchanged"
  return `${change}:${index}`
}
