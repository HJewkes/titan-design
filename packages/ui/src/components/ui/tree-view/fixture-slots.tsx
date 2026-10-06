import { useState } from 'react'
import { View } from 'react-native'
import { Typography } from '../typography'
import {
  fixtures,
  type HierarchyData,
  type MissingReason,
  type TreeFixture,
  type TreeFixtureName,
} from './fixtures'
import type { TreeDensity } from './TreeRow'
import { TreeView } from './TreeView'
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

/** How long the story's simulated child load takes before it fails, so the expander can retry. */
const LOAD_MS = 800

export interface TreeViewStoryArgs {
  fixture: TreeFixtureName
  density: TreeDensity
  height: number
  isDisabled: boolean
  isLoading: boolean
  isTruncated: boolean
  onSelect: (id: string) => void
  onLoadChildren: (id: string) => void
}

/** Story fixtures are fixed data; Very large opens every row so all 5,000 are visible. */
export function fixtureProps(name: TreeFixtureName) {
  const fixture: TreeFixture = fixtures[name]
  return {
    nodes: fixture.nodes,
    rootId: fixture.rootId,
    revealId: fixture.revealId,
    width: fixture.width,
    defaultExpandedIds:
      name === 'veryLarge' ? new Set(fixture.nodes.map((node) => node.id)) : undefined,
  }
}

/** A load that never brings children: the Spinner shows, then the row closes for a retry. */
function useFailingLoads(onLoadChildren: (id: string) => void) {
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<string>>(new Set())
  const load = (id: string) => {
    onLoadChildren(id)
    setLoadingIds((ids) => new Set(ids).add(id))
    setTimeout(() => {
      setLoadingIds((ids) => new Set([...ids].filter((loading) => loading !== id)))
    }, LOAD_MS)
  }
  return { loadingIds, load }
}

export function TreeViewStory(args: TreeViewStoryArgs) {
  const { fixture, onLoadChildren, ...rest } = args
  const { width, ...props } = fixtureProps(fixture)
  const { loadingIds, load } = useFailingLoads(onLoadChildren)
  return (
    <View style={{ width: width ?? 360 }}>
      <TreeView
        key={fixture}
        accessibilityLabel={fixtures[fixture].name}
        {...props}
        {...rest}
        loadingIds={loadingIds}
        onLoadChildren={load}
        renderTrailing={renderMetric('loc')}
      />
    </View>
  )
}
