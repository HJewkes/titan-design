import { Typography } from '../typography'
import type { HierarchyData, MissingReason } from './fixtures'
import type { TreeNode } from './types'

const REASONS: Record<MissingReason, string> = {
  'no-rollup': 'no rollup',
  'not-measured': 'not measured',
  'not-applicable': 'not applicable',
  'not-in-snapshot': 'not in snapshot',
}

/** A metric as text: its value, or the reason it has none, never zero (A2). */
export function metricText(node: TreeNode<HierarchyData>, metric: string): string | null {
  const value = node.data?.values[metric]
  if (value === undefined) return null
  if (value !== null) return `${metric} ${value.toLocaleString('en-US')}`
  const reason = node.data?.missing?.[metric]
  return `${metric} ${reason ? REASONS[reason] : 'missing'}`
}

/** The trailing slot the stories and tests share: one metric per row, in mono. */
export function renderMetric(metric: string) {
  function TrailingMetric(node: TreeNode<HierarchyData>) {
    const text = metricText(node, metric)
    if (text === null) return null
    return (
      <Typography variant="mono" color="secondary">
        {text}
      </Typography>
    )
  }
  return TrailingMetric
}
