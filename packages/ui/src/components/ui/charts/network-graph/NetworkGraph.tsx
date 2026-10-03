import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { cn } from '../../../../utils/cn'
import { EmptyState } from '../../empty-state'
import { Skeleton } from '../../skeleton'
import { layeredLayout } from './layouts/layered-layout-model'
import { buildGraphModel } from './network-graph-model'
import { kindColors } from './network-graph-plot-model'
import { summarizeGraph } from './network-graph-text'
import { NetworkGraphCanvas, type GraphContentProps } from './NetworkGraphCanvas'
import { GraphLegend } from './NetworkGraphParts'
import type { GraphLayout, NetworkGraphProps } from './types'

const DEFAULT_LAYOUT = layeredLayout()

/** The layout held by `key`, so a factory called inline on every render never recomputes. */
function useStableLayout(layout: GraphLayout): GraphLayout {
  const [held, setHeld] = useState(layout)
  if (held.key !== layout.key) setHeld(layout)
  return held.key === layout.key ? held : layout
}

function LoadedGraph({ graph }: { graph: GraphContentProps }) {
  const { nodes, edges, layout = DEFAULT_LAYOUT, width, height, nodeKinds, edgeKinds } = graph
  const { accessibilityLabel, summarize, emptyState, showLegend = false } = graph
  const stableLayout = useStableLayout(layout)
  const model = useMemo(
    () => buildGraphModel(nodes, edges, stableLayout, { width, height }),
    [nodes, edges, stableLayout, width, height]
  )
  const summary = summarize?.(model) ?? summarizeGraph(model, { nodeKinds, edgeKinds })
  const colors = useMemo(() => kindColors(nodeKinds), [nodeKinds])
  if (model.order.length === 0) {
    return (
      <View
        role="group"
        aria-label={`${accessibilityLabel}. ${summary}`}
        className="items-center justify-center"
        style={{ width, height }}
        testID="network-graph-empty"
      >
        {emptyState ?? <EmptyState title="No nodes" />}
      </View>
    )
  }
  return (
    <>
      <NetworkGraphCanvas graph={graph} model={model} summary={summary} />
      {showLegend && (
        <GraphLegend nodeKinds={nodeKinds ?? []} edgeKinds={edgeKinds ?? []} colors={colors} />
      )}
    </>
  )
}

/**
 * A directed graph of things and the relations between them, on a layout the caller picks.
 *
 * Nodes are pressable, edges are pressable, and one node or one edge can be selected. The graph is
 * one tab stop: arrow keys follow the graph, not the geometry, so they mean the same in every
 * layout. An edge pulses when its `activityAt` rises. Web and React Native Web only, since the
 * marks are a DOM `<svg>`. There is no error state: the consumer renders the failure in its place.
 *
 * @example
 * <NetworkGraph
 *   accessibilityLabel="Agent topology"
 *   nodes={nodes}
 *   edges={edges}
 *   width={720}
 *   height={420}
 *   layout={layeredLayout({ rankEdgeKinds: ['spawn'] })}
 *   onSelectionChange={setSelection}
 * />
 */
export function NetworkGraph({
  nodes,
  edges,
  accessibilityLabel,
  width,
  height,
  layout,
  nodeKinds,
  edgeKinds,
  showLegend,
  selection,
  defaultSelection,
  onSelectionChange,
  nodeTooltip,
  formatNodeLabel,
  formatEdgeLabel,
  summarize,
  animate,
  isLoading = false,
  isDisabled,
  emptyState,
  className,
  ...viewProps
}: NetworkGraphProps) {
  const data = { nodes, edges, accessibilityLabel, width, height, layout, nodeKinds, edgeKinds }
  const naming = { formatNodeLabel, formatEdgeLabel, summarize }
  const selecting = { selection, defaultSelection, onSelectionChange, isDisabled }
  const slots = { nodeTooltip, emptyState, showLegend, animate }
  return (
    <View
      testID="network-graph"
      {...viewProps}
      className={cn('items-start gap-stack-sm', className)}
    >
      {isLoading ? (
        <Skeleton
          variant="rounded"
          width={width}
          height={height}
          accessibilityLabel={`${accessibilityLabel}, loading`}
        />
      ) : (
        <LoadedGraph graph={{ ...data, ...naming, ...selecting, ...slots }} />
      )}
    </View>
  )
}
