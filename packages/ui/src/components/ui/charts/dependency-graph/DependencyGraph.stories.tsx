import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from '../../empty-state'
import { Link } from '../../link'
import { DependencyGraph } from './DependencyGraph'
import { architectureGraph, EGO_FOCUS, egoGraph } from './fixtures'

const meta: Meta<typeof DependencyGraph> = {
  title: 'Components/Organisms/DependencyGraph',
  component: DependencyGraph,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: {
    graph: architectureGraph,
    accessibilityLabel: 'Package graph',
    width: 720,
    height: 440,
    isLoading: false,
    renderNodeLink: (node) => <Link href={`#/reference/${node.id}`}>Open reference</Link>,
  },
  argTypes: {
    graph: { control: 'object' },
    egoId: { control: false },
    focusedId: { control: 'text' },
    defaultFocusedId: { control: false },
    width: { control: 'number' },
    height: { control: 'number' },
    isLoading: { control: 'boolean' },
    onFocusedIdChange: { control: false },
    renderNodeLink: { control: false },
    emptyState: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Organism.** Composes [NetworkGraph](?path=/docs/components-organisms-networkgraph--docs) ' +
          '(box nodes, compound tier boxes, routed edges) and ' +
          '[Typography](?path=/docs/foundations-typography--docs) for the focus panel. The layout is ' +
          'computed before render, as by ELK at build time (`fromCompoundLayout` adapts a compound ' +
          'layout result), so nothing is laid out in the browser and the graph server-renders. ' +
          'Press a box, or Enter on it, to focus it: its dependencies and dependents stay lit and the ' +
          'panel names them with the `renderNodeLink` slot. `egoId` draws one node’s neighbourhood ' +
          'on its own layout, for a page about that node. Loading is a Skeleton; an empty graph ' +
          'shows `emptyState`. There is no disabled state (focusing is reading, not input) and no ' +
          'error state (the consumer renders the failure). Every name is invented.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DependencyGraph>

export const Default: Story = {}

export const Focused: Story = { args: { defaultFocusedId: EGO_FOCUS } }

export const Ego: Story = {
  args: {
    egoId: EGO_FOCUS,
    graph: egoGraph,
    height: 480,
    accessibilityLabel: 'Neighbours of api',
  },
}

/** An ego view of a node the graph does not hold: nothing is drawn and the empty slot shows. */
export const Empty: Story = {
  args: {
    egoId: 'unknown',
    accessibilityLabel: 'Neighbours of unknown',
    emptyState: (
      <EmptyState title="No such package" description="Nothing in the graph has this name." />
    ),
  },
}
