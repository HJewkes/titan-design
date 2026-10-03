// The interactive layer stack of NetworkGraph: one scroll container that is the graph's single tab stop.
import { useId, useMemo, useRef } from 'react'
import { ScrollView, type ViewProps } from 'react-native'
import { graphItems, kindLabel, labelsById, type GraphItems } from './network-graph-items-model'
import {
  edgeGeometries,
  emphasisFor,
  isItem,
  kindColors,
  type EdgeGeometry,
  type GraphEmphasis,
} from './network-graph-plot-model'
import { NetworkGraphHitLayer } from './NetworkGraphHitLayer'
import { DefaultNodeTip, EdgeWeight, NodeButton, NodeTip } from './NetworkGraphParts'
import { NetworkGraphPlot } from './NetworkGraphPlot'
import type { GraphItemRef, GraphModel, GraphNode, NetworkGraphProps } from './types'
import { useGraphRoot } from './useGraphRoot'
import { useNetworkGraph, type NetworkGraphState } from './useNetworkGraph'

export type GraphContentProps = Omit<
  NetworkGraphProps,
  keyof ViewProps | 'isLoading' | 'className'
> &
  Pick<NetworkGraphProps, 'accessibilityLabel'>

/**
 * A vertical ScrollView hides its x overflow on the web and flexes to its parent. The graph scrolls
 * on both axes and keeps the size it was given.
 */
const FIXED_BOX = { overflowX: 'auto', flexGrow: 0, flexShrink: 0 } as ViewProps['style']

export interface NetworkGraphCanvasProps {
  /** The caller's props, minus the view props and the loading flag. */
  graph: GraphContentProps
  model: GraphModel
  summary: string
}

interface NodeLayerProps {
  model: GraphModel
  items: GraphItems
  state: NetworkGraphState
  emphasis: GraphEmphasis | null
  /** The node whose tooltip is open, and the id of that tooltip. */
  tip: { nodeId: string; id: string } | null
  onPress: (item: GraphItemRef) => void
}

function NodeLayer({ model, items, state, emphasis, tip, onPress }: NodeLayerProps) {
  return model.order.map((id) => {
    const node = model.index.nodesById.get(id)
    const point = model.positions[id]
    if (!node || !point) return null
    return (
      <NodeButton
        key={id}
        node={node}
        point={point}
        domId={items.nodeDomIds.get(id)}
        name={items.nodeNames.get(id)}
        isSelected={isItem(state.selection, 'node', id)}
        isDimmed={emphasis !== null && !emphasis.nodes.has(id)}
        describedBy={tip?.nodeId === id ? tip.id : undefined}
        onPress={onPress}
        onHoverIn={state.activate}
        onHoverOut={state.deactivate}
      />
    )
  })
}

interface ActiveReadoutProps {
  graph: GraphContentProps
  model: GraphModel
  tipNode: GraphNode | undefined
  tipId: string
  activeEdge: EdgeGeometry | undefined
}

/** What the active item shows: a node's tooltip, or an edge's weight. */
function ActiveReadout({ graph, model, tipNode, tipId, activeEdge }: ActiveReadoutProps) {
  const point = tipNode && model.positions[tipNode.id]
  return (
    <>
      {tipNode && point && (
        <NodeTip key={tipNode.id} id={tipId} point={point}>
          {graph.nodeTooltip?.(tipNode) ?? (
            <DefaultNodeTip
              node={tipNode}
              kind={kindLabel(labelsById(graph.nodeKinds), tipNode.kind)}
            />
          )}
        </NodeTip>
      )}
      {activeEdge && <EdgeWeight geometry={activeEdge} />}
    </>
  )
}

/** Geometry, names and ids, each recomputed only when its inputs change. */
function useGraphPaint(graph: GraphContentProps, model: GraphModel) {
  const { nodeKinds, edgeKinds, formatNodeLabel, formatEdgeLabel } = graph
  const prefix = `graph-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const items = useMemo(
    () => graphItems(model, { nodeKinds, edgeKinds, formatNodeLabel, formatEdgeLabel }, prefix),
    [model, nodeKinds, edgeKinds, formatNodeLabel, formatEdgeLabel, prefix]
  )
  const geometries = useMemo(() => edgeGeometries(model, edgeKinds), [model, edgeKinds])
  const colors = useMemo(() => kindColors(nodeKinds), [nodeKinds])
  return { prefix, items, geometries, colors }
}

export function NetworkGraphCanvas({ graph, model, summary }: NetworkGraphCanvasProps) {
  const { accessibilityLabel, width, height, animate = true, isDisabled = false } = graph
  const state = useNetworkGraph({ ...graph, model })
  const { prefix, items, geometries, colors } = useGraphPaint(graph, model)
  const { active, selection } = state
  const emphasis = useMemo(() => emphasisFor(model.index, active), [model, active])
  const scrollRef = useRef<ScrollView>(null)
  const activeDomId = active
    ? (active.type === 'node' ? items.nodeDomIds : items.edgeDomIds).get(active.id)
    : undefined
  const tipId = `${prefix}-tip`
  const hasTip = active?.type === 'node' && !state.isTooltipDismissed
  const tipNode = hasTip ? model.index.nodesById.get(active.id) : undefined
  const activeEdge = geometries.find((g) => isItem(active, 'edge', g.id))

  const press = (item: GraphItemRef) => {
    state.activate(item)
    state.toggle(item)
    ;(scrollRef.current?.getScrollableNode() as { focus?: () => void } | undefined)?.focus?.()
  }
  const name = `${accessibilityLabel}. ${summary}`
  const rootProps = useGraphRoot({ name, activeDomId, isDisabled, state })

  return (
    <ScrollView
      ref={scrollRef}
      style={[{ width, height }, FIXED_BOX]}
      contentContainerStyle={{ width: model.width, height: model.height }}
      testID="network-graph-root"
      {...rootProps}
    >
      <NetworkGraphPlot
        model={model}
        geometries={geometries}
        nodeColors={colors}
        emphasis={emphasis}
        active={active}
        selection={selection}
        pulsing={state.pulsing}
        animate={animate}
        markerPrefix={`${prefix}-arrow`}
      />
      <NetworkGraphHitLayer
        model={model}
        geometries={geometries}
        domIds={items.edgeDomIds}
        names={items.edgeNames}
        selection={selection}
        onPress={(id) => press({ type: 'edge', id })}
        onHoverIn={(id) => state.activate({ type: 'edge', id })}
        onHoverOut={state.deactivate}
      />
      <NodeLayer
        model={model}
        items={items}
        state={state}
        emphasis={emphasis}
        tip={tipNode ? { nodeId: tipNode.id, id: tipId } : null}
        onPress={press}
      />
      <ActiveReadout
        graph={graph}
        model={model}
        tipNode={tipNode}
        tipId={tipId}
        activeEdge={activeEdge}
      />
    </ScrollView>
  )
}
