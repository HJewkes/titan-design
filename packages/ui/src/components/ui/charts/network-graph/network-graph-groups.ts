import type { GraphGroupRegion } from './types'

const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback)

/** Limits each group to placed nodes and keeps its circle finite. */
export function placedGroups(
  groups: readonly GraphGroupRegion[] | undefined,
  order: readonly string[]
): GraphGroupRegion[] {
  const placed = new Set(order)
  return (groups ?? []).map((group) => ({
    ...group,
    nodeIds: group.nodeIds.filter((id) => placed.has(id)),
    cx: finiteOr(group.cx, 0),
    cy: finiteOr(group.cy, 0),
    radius: finiteOr(group.radius, 0),
  }))
}
