import { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useControllableState } from '../../../../hooks/useControllableState'
import { cn } from '../../../../utils/cn'
import { NetworkGraph } from '../network-graph/NetworkGraph'
import type { GraphItemRef } from '../network-graph/types'
import { egoSubgraph, lightFocus, neighbourhood, toNetworkGraph } from './dependency-graph-model'
import { DependencyFocusPanel } from './DependencyFocusPanel'
import type { DependencyGraphProps } from './types'

/** The focus as a NetworkGraph selection: a node, never an edge. */
const asSelection = (id: string | null): GraphItemRef | null => (id ? { type: 'node', id } : null)

type GraphOptions = Pick<
  DependencyGraphProps,
  'graph' | 'egoId' | 'focusedId' | 'defaultFocusedId' | 'onFocusedIdChange'
>

/** The drawn subgraph, its NetworkGraph props with the focus lit, and the focus triplet. */
function useDependencyGraph({ graph, egoId, ...focusOptions }: GraphOptions) {
  const [focus, setFocus] = useControllableState<string | null>({
    value: focusOptions.focusedId,
    defaultValue: focusOptions.defaultFocusedId ?? null,
    onChange: focusOptions.onFocusedIdChange,
  })
  const data = useMemo(
    () => (egoId === undefined ? graph : { ...graph, ...egoSubgraph(graph, egoId) }),
    [graph, egoId]
  )
  const network = useMemo(() => toNetworkGraph(data), [data])
  const focused = data.nodes.find((node) => node.id === focus) ?? null
  const focusedId = focused?.id ?? null
  const lit = useMemo(() => lightFocus(network, focusedId), [network, focusedId])
  const onSelectionChange = useCallback(
    (selection: GraphItemRef | null) => setFocus(selection?.type === 'node' ? selection.id : null),
    [setFocus]
  )
  return { data, network: { ...network, ...lit }, focused, onSelectionChange }
}

/**
 * A system's units boxed by tier, with their dependencies as routed edges, on a layout computed
 * before render. Pressing a unit, or Enter on it, focuses it: its dependencies, its dependents and
 * the edges to them brighten to the lit colour while the rest stays at rest, and the panel names them,
 * with the consumer's link to the unit's page. `egoId` draws one unit's neighbourhood only. No
 * layout runs at render and nothing reads `window` or `document`, so it server-renders and
 * hydrates. There is no error state: the consumer renders the failure.
 *
 * @example
 * <DependencyGraph
 *   accessibilityLabel="Package graph"
 *   graph={{ nodes, edges, tiers, layout: fromCompoundLayout(compoundLayoutFromTheBuild) }}
 *   width={960}
 *   height={540}
 *   renderNodeLink={(node) => <Link href={`/reference/${node.id}`}>Open reference</Link>}
 * />
 */
export function DependencyGraph({
  graph,
  egoId,
  focusedId,
  defaultFocusedId,
  onFocusedIdChange,
  renderNodeLink,
  isLoading,
  className,
  ...graphProps
}: DependencyGraphProps) {
  const { data, network, focused, onSelectionChange } = useDependencyGraph({
    graph,
    egoId,
    focusedId,
    defaultFocusedId,
    onFocusedIdChange,
  })
  return (
    <View className={cn('items-start gap-stack-sm', className)} testID="dependency-graph">
      <NetworkGraph
        {...graphProps}
        {...network}
        isLoading={isLoading}
        selection={asSelection(focused?.id ?? null)}
        onSelectionChange={onSelectionChange}
      />
      {!isLoading && data.nodes.length > 0 ? (
        <DependencyFocusPanel
          node={focused}
          neighbours={focused ? neighbourhood(data, focused.id) : { dependsOn: [], usedBy: [] }}
          link={focused ? renderNodeLink?.(focused) : null}
        />
      ) : null}
    </View>
  )
}
