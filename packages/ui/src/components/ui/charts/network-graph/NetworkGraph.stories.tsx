import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from '../../empty-state'
import { networkGraphFixtures, smallFixture, suppliedFixture, type GraphFixture } from './fixtures'
import { clusteredLayout } from './layouts/clustered-layout-model'
import { egoLayout, type EgoDirection } from './layouts/ego-layout-model'
import { forceLayout } from './layouts/force-layout-model'
import { layeredLayout } from './layouts/layered-layout-model'
import { NetworkGraph } from './NetworkGraph'
import type { GraphItemRef, GraphLayout, NetworkGraphProps } from './types'

type FixtureName = keyof typeof networkGraphFixtures
type Mode = 'force' | 'ego' | 'clustered'

interface StoryArgs extends NetworkGraphProps {
  /** Replaces `nodes`, `edges` and the kinds with a named fixture. */
  fixture?: FixtureName
  /** Each change bumps one edge's `activityAt`, which pulses it. */
  pulse?: boolean
  /** Force and clustered: the seeded start positions. */
  seed?: number
  /** Force and clustered: simulation steps, 1 to 1000. */
  iterations?: number
  /** Ego: rings drawn around the focus. */
  hops?: number
  /** Ego: the node at the centre; empty takes the fixture's focus, else its first node. Pressing a node refocuses. */
  focusId?: string
  /** Ego: which edges count as a hop. */
  direction?: EgoDirection
}

type ModeArgs = Pick<StoryArgs, 'seed' | 'iterations' | 'hops' | 'direction'>
/** A fixture, or the story's own `nodes` and `edges` when no fixture is picked. */
type StoryData = Pick<GraphFixture, 'nodes' | 'edges'> & Partial<GraphFixture>

const MODE_PREFIX = 'mode:'

/** What the `layout` select maps a mode to; `Render` swaps it for the factory built from the mode args. */
const modeLayout = (mode: Mode): GraphLayout => ({
  key: `${MODE_PREFIX}${mode}`,
  compute: () => ({ positions: {}, order: [], width: 0, height: 0 }),
})

const modeOf = (layout: GraphLayout | undefined): Mode | null =>
  layout?.key.startsWith(MODE_PREFIX) ? (layout.key.slice(MODE_PREFIX.length) as Mode) : null

const LAYOUTS: Record<string, GraphLayout | undefined> = {
  layered: layeredLayout(),
  'layered (spawn edges only)': layeredLayout({ rankEdgeKinds: ['spawn'] }),
  supplied: suppliedFixture.layout,
  force: modeLayout('force'),
  ego: modeLayout('ego'),
  clustered: modeLayout('clustered'),
}

/** The layout value for the args; ego takes its focus from state so a press can move it. */
function buildLayout(
  layout: GraphLayout | undefined,
  args: ModeArgs,
  data: StoryData,
  focusId: string | null
): GraphLayout | undefined {
  const { seed, iterations, hops, direction } = args
  const mode = modeOf(layout)
  if (mode === 'force') return forceLayout({ seed, iterations })
  if (mode === 'ego') return egoLayout({ focusId, hops, direction })
  if (mode === 'clustered') return clusteredLayout({ seed, iterations, groups: data.groups })
  return layout ?? data.layout
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Organisms/NetworkGraph',
  component: NetworkGraph,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    fixture: 'Small (5)',
    nodes: smallFixture.nodes,
    edges: smallFixture.edges,
    nodeKinds: smallFixture.nodeKinds,
    edgeKinds: smallFixture.edgeKinds,
    accessibilityLabel: 'Agent topology',
    width: 720,
    height: 420,
    showLegend: true,
    animate: true,
    pulse: false,
    isLoading: false,
    isDisabled: false,
    seed: 1,
    iterations: 300,
    hops: 2,
    focusId: '',
    direction: 'both',
  },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(networkGraphFixtures) },
    layout: { control: 'select', options: Object.keys(LAYOUTS), mapping: LAYOUTS },
    width: { control: 'number' },
    height: { control: 'number' },
    showLegend: { control: 'boolean' },
    animate: { control: 'boolean' },
    pulse: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    seed: { control: 'number', table: { category: 'force, clustered' } },
    iterations: {
      control: { type: 'range', min: 1, max: 1000, step: 1 },
      table: { category: 'force, clustered' },
    },
    hops: { control: { type: 'range', min: 0, max: 4, step: 1 }, table: { category: 'ego' } },
    focusId: { control: 'text', table: { category: 'ego' } },
    direction: {
      control: 'select',
      options: ['both', 'outgoing', 'incoming'],
      table: { category: 'ego' },
    },
    selection: { control: 'object' },
    defaultSelection: { control: false },
    onSelectionChange: { control: false },
    formatNodeLabel: { control: false },
    formatEdgeLabel: { control: false },
    summarize: { control: false },
    nodeTooltip: { control: false },
    emptyState: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** Composes [Tooltip](?path=/docs/components-molecules-tooltip--docs), ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs). Layouts are values: ' +
          '`layeredLayout()`, `suppliedLayout(positions)`, `forceLayout`, `egoLayout` or ' +
          '`clusteredLayout`. No error state: the consumer renders the failure. The `fixture` ' +
          'control replaces `nodes`, `edges` and the kinds; it holds the 5, 30 and 150 node graphs ' +
          'and the edge cases. Toggle `pulse` to send traffic down one edge; `animate` off paints ' +
          'no pulse, and reduced motion gets a still one. The graph is one tab stop: arrow keys ' +
          'follow the edges, Enter selects, Escape clears.\n\n' +
          'The `layout` control switches mode. Each free-form mode draws arcs, hides labels that ' +
          'would overlap (the selected node, the active node and its neighbours always keep ' +
          'theirs) and reads best on `Grouped (40)`:\n\n' +
          '- [force](?path=/story/components-organisms-networkgraph--default&args=layout:force): ' +
          'distance means connection; `seed` and `iterations` drive the simulation.\n' +
          '- [ego](?path=/story/components-organisms-networkgraph--default&args=layout:ego): ' +
          'rings mean hops from `focusId` (the fixture’s focus by default); pressing a node ' +
          'refocuses, `hops` and `direction` set the reach, and an unknown focus shows the empty ' +
          'state.\n' +
          '- [clustered](?path=/story/components-organisms-networkgraph--default&args=layout:clustered): ' +
          'a labelled region per `group`, ungrouped nodes last; `Grouped (40)` passes its region ' +
          'order and labels.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

/** Bumps one message edge's `activityAt` each time `pulse` flips. */
function usePulsedEdges(data: StoryData, pulse: boolean | undefined) {
  const [seenPulse, setSeenPulse] = useState(pulse)
  const [bumps, setBumps] = useState(0)
  if (seenPulse !== pulse) {
    setSeenPulse(pulse)
    setBumps(bumps + 1)
  }
  return useMemo(() => {
    const target = Math.max(
      0,
      data.edges.findIndex((edge) => edge.kind === 'message')
    )
    return bumps === 0
      ? data.edges
      : data.edges.map((edge, i) => (i === target ? { ...edge, activityAt: bumps } : edge))
  }, [data.edges, bumps])
}

/** The ego focus: the `focusId` arg, else the fixture's; a pressed node replaces it until either changes. */
function useEgoFocus(data: StoryData, focusId: string | undefined) {
  const initial =
    [focusId, data.focusId, data.nodes[0]?.id].find((id) => id !== undefined && id !== '') ?? null
  const [seen, setSeen] = useState(initial)
  const [focus, setFocus] = useState<string | null>(initial)
  if (seen !== initial) {
    setSeen(initial)
    setFocus(initial)
  }
  const onPress = (selection: GraphItemRef | null) => {
    if (selection?.type === 'node') setFocus(selection.id)
  }
  return { focus, onPress }
}

export const Default: Story = {
  render: function Render(props) {
    const { fixture, pulse, layout, seed, iterations, hops, focusId, direction, ...args } = props
    const { nodes, edges: ownEdges, nodeKinds, edgeKinds } = args
    const data: StoryData = fixture
      ? networkGraphFixtures[fixture]
      : { nodes, edges: ownEdges, nodeKinds, edgeKinds }
    const edges = usePulsedEdges(data, pulse)
    const ego = useEgoFocus(data, focusId)
    const isEgo = modeOf(layout) === 'ego'
    return (
      <NetworkGraph
        {...args}
        nodes={data.nodes}
        edges={edges}
        nodeKinds={data.nodeKinds}
        edgeKinds={data.edgeKinds}
        layout={buildLayout(layout, { seed, iterations, hops, direction }, data, ego.focus)}
        onSelectionChange={(selection) => {
          args.onSelectionChange?.(selection)
          if (isEgo) ego.onPress(selection)
        }}
        emptyState={
          isEgo ? (
            <EmptyState title="No focus" description="Pick a node to see what is near it." />
          ) : (
            args.emptyState
          )
        }
      />
    )
  },
}
