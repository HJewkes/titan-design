import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { networkGraphFixtures, smallFixture, suppliedFixture } from './fixtures'
import { layeredLayout } from './layouts/layered-layout-model'
import { NetworkGraph } from './NetworkGraph'
import type { GraphLayout, NetworkGraphProps } from './types'

type FixtureName = keyof typeof networkGraphFixtures

interface StoryArgs extends NetworkGraphProps {
  /** Replaces `nodes`, `edges` and the kinds with a named fixture. */
  fixture?: FixtureName
  /** Each change bumps one edge's `activityAt`, which pulses it. */
  pulse?: boolean
}

const LAYOUTS: Record<string, GraphLayout | undefined> = {
  layered: layeredLayout(),
  'layered (spawn edges only)': layeredLayout({ rankEdgeKinds: ['spawn'] }),
  supplied: suppliedFixture.layout,
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
          '`layeredLayout()` or `suppliedLayout(positions)`. No error state: the consumer renders ' +
          'the failure. The `fixture` control replaces `nodes`, `edges` and the kinds; it holds the ' +
          '5, 30 and 150 node graphs and the edge cases. Toggle `pulse` to send traffic down one ' +
          'edge, and turn `animate` off to see the still form that reduced motion also gets. The ' +
          'graph is one tab stop: arrow keys follow the edges, Enter selects, Escape clears.',
      },
    },
  },
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {
  render: function Render({ fixture, pulse, ...args }) {
    const data = fixture ? networkGraphFixtures[fixture] : args
    const [seenPulse, setSeenPulse] = useState(pulse)
    const [bumps, setBumps] = useState(0)
    if (seenPulse !== pulse) {
      setSeenPulse(pulse)
      setBumps(bumps + 1)
    }
    const edges = useMemo(() => {
      const target = Math.max(
        0,
        data.edges.findIndex((edge) => edge.kind === 'message')
      )
      return bumps === 0
        ? data.edges
        : data.edges.map((edge, i) => (i === target ? { ...edge, activityAt: bumps } : edge))
    }, [data.edges, bumps])
    return (
      <NetworkGraph
        {...args}
        nodes={data.nodes}
        edges={edges}
        nodeKinds={data.nodeKinds}
        edgeKinds={data.edgeKinds}
        layout={args.layout ?? data.layout}
      />
    )
  },
}
