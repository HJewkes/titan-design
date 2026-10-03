import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { capturedClassNames } from '../../../../test/classname-capture'
import {
  hostileFixture,
  hostilePositions,
  largeFixture,
  mediumFixture,
  networkGraphFixtures,
  smallFixture,
  type GraphFixture,
} from './fixtures'
import { suppliedLayout } from './layouts/supplied-layout-model'
import { NetworkGraph } from './NetworkGraph'
import { DIM_OPACITY } from './NetworkGraphPlot'
import type { GraphLayout, GraphLayoutInput, NetworkGraphProps } from './types'
import { PULSE_MS } from './useNetworkGraph'

const SPAWN_TO_WORKER_01 = 'lead-01->worker-01:spawn'
const MESSAGE_TO_WORKER_01 = 'lead-01->worker-01:message'

function renderGraph(props: Partial<NetworkGraphProps> = {}, fixture: GraphFixture = smallFixture) {
  const { nodes, edges, nodeKinds, edgeKinds, layout } = fixture
  const base = { nodes, edges, nodeKinds, edgeKinds, layout, width: 720, height: 420 }
  const element = (extra: Partial<NetworkGraphProps> = {}) => (
    <NetworkGraph accessibilityLabel="Topology" {...base} {...props} {...extra} />
  )
  const view = render(element())
  return { ...view, update: (extra: Partial<NetworkGraphProps>) => view.rerender(element(extra)) }
}

const root = () => screen.getByTestId('network-graph-root')
const nodeButton = (id: string) => screen.getByTestId(`network-graph-node-${id}`)
const edgeTarget = (name: RegExp | string) => screen.getByRole('button', { name })
const nodeMark = (container: HTMLElement, id: string) =>
  container.querySelector(`g[data-node="${id}"]`)
const edgeMark = (container: HTMLElement, id: string) =>
  container.querySelector(`path[data-edge="${id}"]`)

/** The element `aria-activedescendant` points at, or null. */
const activeElement = () =>
  document.getElementById(root().getAttribute('aria-activedescendant') ?? '')
const activeName = () => activeElement()?.getAttribute('aria-label')

const focusRoot = () => act(() => root().focus())
/** Presses a key on the graph; true when the graph took the key. */
const press = (key: string) => !fireEvent.keyDown(root(), { key })

function stubReducedMotion(matches: boolean) {
  const mq = { matches, addEventListener: () => {}, removeEventListener: () => {} }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mq)
  )
}

const withActivity = (activityAt: number) =>
  smallFixture.edges.map((edge) =>
    edge.kind === 'message' && edge.target === 'worker-01' ? { ...edge, activityAt } : edge
  )

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('NetworkGraph rendering', () => {
  it.each([
    ['Small', smallFixture, 5, 7],
    ['Medium', mediumFixture, 30, 44],
    ['Large', largeFixture, 150, 295],
    ['Hostile', { ...hostileFixture, layout: suppliedLayout(hostilePositions) }, 2, 1],
  ])('renders one node element per placed node and one path per drawn edge for %s', (...args) => {
    const [, fixture, nodes, edges] = args
    const { container } = renderGraph({}, fixture)
    expect(screen.getAllByTestId(/^network-graph-node-/)).toHaveLength(nodes)
    expect(container.querySelectorAll('g[data-node]')).toHaveLength(nodes)
    expect(container.querySelectorAll('path[data-edge]')).toHaveLength(edges)
    expect(container.querySelectorAll('path[role="button"]')).toHaveLength(edges)
  })

  it('renders Hostile at its width of 0 without throwing, and the name counts what was dropped', () => {
    const layout = suppliedLayout(hostilePositions)
    renderGraph({ layout, width: hostileFixture.width }, hostileFixture)
    expect(root()).toHaveAccessibleName(/Dropped: 1 duplicate node.*Showing 2 of 5 nodes/)
  })

  it('a custom GraphLayout is called with cleaned input and its positions are used', () => {
    const compute = vi.fn((input: GraphLayoutInput) => ({
      positions: Object.fromEntries(input.nodes.map((n, i) => [n.id, { x: 40 + i * 50, y: 70 }])),
      order: input.nodes.map((n) => n.id),
      width: 400,
      height: 140,
    }))
    const { container } = renderGraph({ layout: { key: 'row', compute } }, hostileFixture)
    const input = compute.mock.calls[0]?.[0]
    expect(input?.nodes.map((n) => n.id)).toEqual([
      'alpha-01',
      'alpha-02',
      'alpha-03',
      'alpha-04',
      'alpha-05',
    ])
    expect(input?.edges.every((e) => e.source !== e.target && e.target !== 'alpha-99')).toBe(true)
    expect(input).toMatchObject({ width: 720, height: 420 })
    const circle = nodeMark(container, 'alpha-03')?.querySelector('circle')
    expect([circle?.getAttribute('cx'), circle?.getAttribute('cy')]).toEqual(['140', '70'])
    expect(nodeButton('alpha-03')).toHaveStyle({ top: '58px' })
  })

  it('layout.compute runs once across re-renders with the same key and data', () => {
    const compute = vi.fn(suppliedLayout({ 'lead-01': { x: 30, y: 30 } }).compute)
    const { update } = renderGraph({ layout: { key: 'same', compute } })
    update({ layout: { key: 'same', compute } })
    update({ layout: { key: 'same', compute }, showLegend: true })
    expect(compute).toHaveBeenCalledTimes(1)
    update({ layout: { key: 'other', compute } })
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it('a node left unplaced by the layout is not rendered and the name says "showing n of m"', () => {
    const placed = { 'lead-01': { x: 30, y: 30 }, 'worker-01': { x: 200, y: 30 } }
    const { container } = renderGraph({ layout: suppliedLayout(placed) })
    expect(screen.queryByTestId('network-graph-node-worker-02')).toBeNull()
    expect(nodeMark(container, 'worker-02')).toBeNull()
    expect(screen.getAllByTestId(/^network-graph-node-/)).toHaveLength(2)
    expect(root()).toHaveAccessibleName(/^Topology\. .*Showing 2 of 5 nodes and 2 of 7 edges\./)
  })

  it('names the root with the label and the summary, and summarize replaces the summary', () => {
    const { update } = renderGraph()
    expect(root()).toHaveAccessibleName(/^Topology\. Network graph with 5 nodes and 7 edges\./)
    update({ summarize: (model) => `${String(model.order.length)} placed` })
    expect(root()).toHaveAccessibleName('Topology. 5 placed')
  })

  it('shows the legend only when asked, naming every node kind and edge kind', () => {
    const { update } = renderGraph()
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull()
    update({ showLegend: true })
    const legend = within(screen.getByRole('list', { name: 'Legend' }))
    expect(legend.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Human',
      'Lead',
      'Worker',
      'Spawned',
      'Messaged',
    ])
  })

  it('Long label truncates on screen and keeps the full label in the name; an empty label falls back to the id', () => {
    renderGraph({}, networkGraphFixtures['Long label'])
    const long = 'x'.repeat(120)
    expect(nodeButton('alpha-01')).toHaveTextContent(`${'x'.repeat(22)}…`)
    expect(nodeButton('alpha-01')).not.toHaveTextContent(long)
    expect(nodeButton('alpha-01')).toHaveAccessibleName(`${long}, Worker, 0 incoming, 3 outgoing`)
    expect(nodeButton('alpha-04')).toHaveTextContent('alpha-04')
    expect(nodeButton('alpha-04')).toHaveAccessibleName('alpha-04, Worker, 1 incoming, 0 outgoing')
  })

  it("Many kinds names the kind in each node's label", () => {
    renderGraph({}, networkGraphFixtures['Many kinds'])
    for (let n = 1; n <= 8; n += 1) {
      expect(nodeButton(`alpha-0${String(n)}`)).toHaveAccessibleName(
        new RegExp(`^alpha-0${String(n)}, Kind ${String(n)}, `)
      )
    }
  })

  it('formatNodeLabel and formatEdgeLabel replace the built-in names', () => {
    renderGraph({
      formatNodeLabel: (node, context) => `${node.id} has ${String(context.outgoing)} out`,
      formatEdgeLabel: (edge, source, target) => `${source.id} => ${target.id} (${edge.kind})`,
    })
    expect(nodeButton('lead-01')).toHaveAccessibleName('lead-01 has 5 out')
    expect(edgeTarget('lead-01 => worker-02 (spawn)')).toBeInTheDocument()
  })
})

describe('NetworkGraph selection', () => {
  it('pressing a node selects it; pressing it again clears; onSelectionChange gets the ref', () => {
    const onSelectionChange = vi.fn()
    const nodes = smallFixture.nodes.map((n) => ({ ...n, label: `Label of ${n.id}` }))
    const { container } = renderGraph({ nodes, onSelectionChange })
    fireEvent.click(nodeButton('worker-02'))
    expect(onSelectionChange).toHaveBeenLastCalledWith({ type: 'node', id: 'worker-02' })
    expect(nodeButton('worker-02')).toHaveAttribute('aria-pressed', 'true')
    expect(nodeMark(container, 'worker-02')?.querySelector('[data-ring="selected"]')).not.toBeNull()
    fireEvent.click(nodeButton('worker-02'))
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)
    expect(nodeButton('worker-02')).toHaveAttribute('aria-pressed', 'false')
  })

  it('pressing an edge selects the edge', () => {
    const onSelectionChange = vi.fn()
    const { container } = renderGraph({ onSelectionChange })
    fireEvent.click(edgeTarget('lead-01 to worker-01, Spawned, weight unknown'))
    expect(onSelectionChange).toHaveBeenLastCalledWith({ type: 'edge', id: SPAWN_TO_WORKER_01 })
    expect(edgeTarget(/^lead-01 to worker-01, Spawned/)).toHaveAttribute('aria-pressed', 'true')
    expect(edgeMark(container, SPAWN_TO_WORKER_01)).toHaveAttribute('data-emphasis', 'strong')
  })

  it('a press moves focus to the graph, so the keyboard carries on from the pressed item', () => {
    renderGraph()
    fireEvent.click(nodeButton('worker-02'))
    expect(root()).toHaveFocus()
    expect(activeElement()).toBe(nodeButton('worker-02'))
  })

  it('controlled selection does not change until the prop changes', () => {
    const onSelectionChange = vi.fn()
    const selection = { type: 'node', id: 'worker-01' } as const
    const { update } = renderGraph({ selection, onSelectionChange })
    fireEvent.click(nodeButton('worker-02'))
    expect(onSelectionChange).toHaveBeenLastCalledWith({ type: 'node', id: 'worker-02' })
    expect(nodeButton('worker-01')).toHaveAttribute('aria-pressed', 'true')
    expect(nodeButton('worker-02')).toHaveAttribute('aria-pressed', 'false')
    update({ selection: { type: 'node', id: 'worker-02' } })
    expect(nodeButton('worker-02')).toHaveAttribute('aria-pressed', 'true')
  })

  it('a selection naming an unknown id renders as none', () => {
    const onSelectionChange = vi.fn()
    renderGraph({ selection: { type: 'edge', id: 'ghost' }, onSelectionChange })
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    focusRoot()
    press('Escape')
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(activeElement()).toBe(nodeButton('lead-01'))
  })

  it('isDisabled keeps traversal and stops selection, with aria-disabled', () => {
    const onSelectionChange = vi.fn()
    renderGraph({ isDisabled: true, onSelectionChange })
    expect(root()).toHaveAttribute('aria-disabled', 'true')
    focusRoot()
    press('ArrowDown')
    expect(activeElement()).toBe(nodeButton('worker-01'))
    press('Enter')
    fireEvent.click(nodeButton('worker-02'))
    fireEvent.click(edgeTarget(/^lead-01 to worker-01, Spawned/))
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })
})

describe('NetworkGraph keyboard', () => {
  it('Down, Up, Home and End move along the node order and never wrap', () => {
    renderGraph()
    focusRoot()
    const visited = [
      'ArrowDown',
      'ArrowDown',
      'ArrowUp',
      'End',
      'ArrowDown',
      'Home',
      'ArrowUp',
    ].map((key) => [press(key), activeElement()?.getAttribute('data-testid')])
    expect(visited).toEqual([
      [true, 'network-graph-node-worker-01'],
      [true, 'network-graph-node-worker-02'],
      [true, 'network-graph-node-worker-01'],
      [true, 'network-graph-node-worker-03'],
      [true, 'network-graph-node-worker-03'],
      [true, 'network-graph-node-lead-01'],
      [true, 'network-graph-node-lead-01'],
    ])
  })

  it('Right and Left cross an edge; Down, Up, Home and End on an edge stay on its anchor node', () => {
    renderGraph()
    focusRoot()
    const names = [
      'ArrowRight',
      'ArrowDown',
      'ArrowUp',
      'End',
      'ArrowDown',
      'Home',
      'ArrowRight',
      'ArrowLeft',
      'ArrowLeft',
      'ArrowLeft',
    ].map((key) => (press(key), activeName()))
    expect(names).toEqual([
      'lead-01 to worker-01, Messaged, weight 6',
      'lead-01 to worker-01, Spawned, weight unknown',
      'lead-01 to worker-01, Messaged, weight 6',
      'worker-04 to lead-01, Messaged, weight 11',
      'worker-04 to lead-01, Messaged, weight 11',
      'lead-01 to worker-01, Messaged, weight 6',
      'worker-01, Worker, 2 incoming, 0 outgoing',
      'lead-01 to worker-01, Messaged, weight 6',
      'lead-01, Lead, 1 incoming, 5 outgoing',
      'worker-04 to lead-01, Messaged, weight 11',
    ])
  })

  it('Enter and Space select the active item and clear it again; Escape clears', () => {
    const onSelectionChange = vi.fn()
    renderGraph({ onSelectionChange })
    focusRoot()
    press('Enter')
    expect(onSelectionChange).toHaveBeenLastCalledWith({ type: 'node', id: 'lead-01' })
    press('Enter')
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)
    press('ArrowRight')
    expect(press(' ')).toBe(true)
    expect(onSelectionChange).toHaveBeenLastCalledWith({ type: 'edge', id: MESSAGE_TO_WORKER_01 })
    expect(activeElement()).toHaveAttribute('aria-pressed', 'true')
    press('Escape')
    expect(onSelectionChange).toHaveBeenLastCalledWith(null)
    expect(onSelectionChange).toHaveBeenCalledTimes(4)
  })

  it('Tab enters at the selected item, and one more Tab leaves', () => {
    const { container } = renderGraph({ defaultSelection: { type: 'node', id: 'worker-04' } })
    expect(root()).not.toHaveAttribute('aria-activedescendant')
    focusRoot()
    expect(activeElement()).toBe(nodeButton('worker-04'))
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(press('Tab')).toBe(false)
    act(() => root().blur())
    expect(root()).not.toHaveAttribute('aria-activedescendant')
  })

  it('Tab enters at the first node when nothing is selected, and at a selected edge', () => {
    const { unmount } = renderGraph()
    focusRoot()
    expect(activeElement()).toBe(nodeButton('lead-01'))
    unmount()
    renderGraph({ defaultSelection: { type: 'edge', id: SPAWN_TO_WORKER_01 } })
    focusRoot()
    expect(activeName()).toBe('lead-01 to worker-01, Spawned, weight unknown')
  })

  it('Down and Up reach every node of No edges', () => {
    renderGraph({}, networkGraphFixtures['No edges'])
    focusRoot()
    const seen = [activeName()]
    for (let i = 0; i < 12; i += 1) {
      press('ArrowDown')
      seen.push(activeName())
    }
    expect(new Set(seen).size).toBe(12)
    expect(press('ArrowRight')).toBe(true)
    expect(activeName()).toBe(seen[12])
  })

  it('scrolls the active item into view when focus enters and after a key, and never after a hover', () => {
    renderGraph()
    const scrolled: string[] = []
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
      scrolled.push(this.getAttribute('aria-label') ?? '')
    }
    focusRoot()
    expect(scrolled).toEqual(['lead-01, Lead, 1 incoming, 5 outgoing'])
    fireEvent.pointerEnter(nodeButton('worker-03'))
    fireEvent.pointerLeave(nodeButton('worker-03'))
    expect(scrolled).toHaveLength(1)
    press('ArrowUp')
    expect(scrolled[1]).toBe('worker-04, Worker, 1 incoming, 1 outgoing')
    press('ArrowRight')
    expect(scrolled[2]).toBe('worker-04 to lead-01, Messaged, weight 11')
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
  })
})

describe('NetworkGraph active item (R1: aria-activedescendant)', () => {
  it.each([
    ['a node', []],
    ['an edge', ['ArrowRight']],
  ])('points at %s that is a named button inside the root and not hidden', (_, keys) => {
    renderGraph()
    focusRoot()
    keys.forEach(press)
    const target = activeElement()
    expect(root()).toHaveAttribute('role', 'application')
    expect(root()).toHaveAttribute('aria-roledescription', 'network graph')
    expect(root()).toHaveAttribute('tabindex', '0')
    expect(target).not.toBeNull()
    expect(root().contains(target)).toBe(true)
    expect(target).toHaveAttribute('role', 'button')
    expect(target).toHaveAttribute('tabindex', '-1')
    expect(target?.closest('[aria-hidden="true"]')).toBeNull()
    expect(screen.getAllByRole('button').includes(target as HTMLElement)).toBe(true)
    expect(target).toHaveAccessibleName(/\S/)
  })

  it('gives every item a unique id that holds no whitespace, whatever the graph ids are', () => {
    const nodes = [
      { id: 'a b', label: 'First' },
      { id: 'a\tb', label: 'Second' },
    ]
    const { container } = renderGraph({ nodes, edges: [{ source: 'a b', target: 'a\tb' }] })
    const ids = [...container.querySelectorAll('[role="button"]')].map((el) => el.id)
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    expect(ids.every((id) => /^\S+$/.test(id))).toBe(true)
  })
})

describe('NetworkGraph hover', () => {
  it('hovering a node dims non-neighbours and opens its tooltip; nodeTooltip replaces the default', () => {
    const description = 'Reviews the plan'
    const nodes = smallFixture.nodes.map((n) => (n.id === 'worker-02' ? { ...n, description } : n))
    const { container, update } = renderGraph({ nodes })
    fireEvent.pointerEnter(nodeButton('worker-02'))
    const opacity = (id: string) => nodeMark(container, id)?.getAttribute('opacity')
    expect(['lead-01', 'worker-02', 'worker-03'].map(opacity)).toEqual(['1', '1', '1'])
    expect(['worker-01', 'worker-04'].map(opacity)).toEqual(Array(2).fill(String(DIM_OPACITY)))
    expect(edgeMark(container, 'worker-02->worker-03:message')).toHaveAttribute('opacity', '1')
    expect(edgeMark(container, SPAWN_TO_WORKER_01)).toHaveAttribute('opacity', String(DIM_OPACITY))
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('worker-02')
    expect(tip).toHaveTextContent('Worker')
    expect(tip).toHaveTextContent(description)
    expect(nodeButton('worker-02')).toHaveAttribute('aria-describedby', tip.id)

    update({ nodes, nodeTooltip: (node) => <Text>{`Custom tip for ${node.id}`}</Text> })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Custom tip for worker-02')
    expect(screen.getByRole('tooltip')).not.toHaveTextContent(description)

    fireEvent.pointerLeave(nodeButton('worker-02'))
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(opacity('worker-01')).toBe('1')
  })

  it('an active edge shows its weight and keeps only its two ends at full strength', () => {
    const { container } = renderGraph()
    fireEvent.pointerEnter(edgeTarget(/^worker-04 to lead-01/))
    expect(screen.getByTestId('network-graph-edge-weight')).toHaveTextContent('weight 11')
    expect(nodeMark(container, 'worker-04')).toHaveAttribute('opacity', '1')
    expect(nodeMark(container, 'worker-01')).toHaveAttribute('opacity', String(DIM_OPACITY))
    fireEvent.pointerLeave(edgeTarget(/^worker-04 to lead-01/))
    expect(screen.queryByTestId('network-graph-edge-weight')).toBeNull()
  })

  it('Escape closes the tooltip without moving the active item', () => {
    renderGraph()
    focusRoot()
    expect(screen.getByRole('tooltip')).toHaveTextContent('lead-01')
    press('Escape')
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(activeElement()).toBe(nodeButton('lead-01'))
    press('ArrowDown')
    expect(screen.getByRole('tooltip')).toHaveTextContent('worker-01')
  })
})

describe('NetworkGraph edge pulse', () => {
  const pulses = (container: HTMLElement) =>
    [...container.querySelectorAll('[data-pulse]')].map((el) => el.getAttribute('data-pulse'))

  it('an edge whose activityAt increases after mount gets the pulse; the same value on first render does not', () => {
    vi.useFakeTimers()
    const { container, update } = renderGraph({ edges: withActivity(100) })
    expect(pulses(container)).toEqual([])
    update({ edges: withActivity(100) })
    expect(pulses(container)).toEqual([])
    update({ edges: withActivity(200) })
    expect(pulses(container)).toEqual(['travel'])
    const pulse = container.querySelector<SVGPathElement>('[data-pulse]')
    expect(pulse?.getAttribute('d')).toBe(
      edgeMark(container, MESSAGE_TO_WORKER_01)?.getAttribute('d')
    )
    expect(pulse?.style.transition).toContain(`stroke-dashoffset ${String(PULSE_MS)}ms`)
    act(() => void vi.advanceTimersByTime(PULSE_MS))
    expect(pulses(container)).toEqual([])
  })

  it('an edge that first gets an activityAt after mount pulses, and an older value does not', () => {
    const { container, update } = renderGraph()
    update({ edges: withActivity(50) })
    expect(pulses(container)).toEqual(['travel'])
    update({ edges: withActivity(40) })
    expect(pulses(container)).toEqual(['travel'])
    expect(container.querySelectorAll('[data-pulse]')).toHaveLength(1)
  })

  it('with reduced motion the edge is emphasised and has no transition', () => {
    vi.useFakeTimers()
    stubReducedMotion(true)
    const { container, update } = renderGraph({ edges: withActivity(100) })
    update({ edges: withActivity(200) })
    expect(pulses(container)).toEqual(['still'])
    const pulse = container.querySelector<SVGPathElement>('[data-pulse]')
    expect(pulse?.style.transition).toBe('')
    expect(pulse?.style.strokeDasharray).toBe('')
    act(() => void vi.advanceTimersByTime(PULSE_MS))
    expect(pulses(container)).toEqual([])
  })

  it('animate={false} renders no pulse', () => {
    const { container, update } = renderGraph({ edges: withActivity(100), animate: false })
    update({ edges: withActivity(200), animate: false })
    expect(pulses(container)).toEqual(['still'])
    expect(container.querySelector<SVGPathElement>('[data-pulse]')?.style.transition).toBe('')
  })
})

describe('NetworkGraph states', () => {
  it('isLoading renders a skeleton of width by height and no graph', () => {
    renderGraph({ isLoading: true, width: 640, height: 300 })
    const skeleton = screen.getByRole('progressbar', { name: 'Topology, loading' })
    expect(skeleton).toHaveStyle({ width: '640px', height: '300px' })
    expect(screen.queryByTestId('network-graph-root')).toBeNull()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('Empty renders the default empty state; emptyState replaces it', () => {
    const { update } = renderGraph({}, networkGraphFixtures.Empty)
    expect(screen.getByText('No nodes')).toBeInTheDocument()
    expect(screen.getByTestId('network-graph-empty')).toHaveAccessibleName(
      'Topology. Network graph with no nodes.'
    )
    expect(screen.queryByTestId('network-graph-root')).toBeNull()
    update({ emptyState: <Text>Nothing to draw</Text> })
    expect(screen.getByText('Nothing to draw')).toBeInTheDocument()
    expect(screen.queryByText('No nodes')).toBeNull()
  })

  it('a layout that places no node renders the empty state', () => {
    renderGraph({ layout: suppliedLayout({}) })
    expect(screen.getByText('No nodes')).toBeInTheDocument()
  })

  it('passes view props and className to the outer element', () => {
    renderGraph({ testID: 'topology', className: 'mt-2' })
    expect(screen.getByTestId('topology')).toContainElement(root())
    expect(capturedClassNames.get('topology')).toContain('mt-2')
  })
})

describe('NetworkGraph accessibility', () => {
  const cases: [string, Partial<NetworkGraphProps>, GraphFixture][] = [
    ['Small', { showLegend: true }, smallFixture],
    ['Medium', {}, mediumFixture],
    ['a selected node', { selection: { type: 'node', id: 'worker-02' } }, smallFixture],
    ['a selected edge', { selection: { type: 'edge', id: SPAWN_TO_WORKER_01 } }, smallFixture],
    ['loading', { isLoading: true }, smallFixture],
    ['empty', {}, networkGraphFixtures.Empty],
    ['disabled', { isDisabled: true }, smallFixture],
  ]

  it.each(cases)('has no axe violations for %s', async (_, props, fixture) => {
    const { container } = renderGraph(props, fixture)
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([
    ['node', []],
    ['edge', ['ArrowRight']],
  ])('has no axe violations with an active %s', async (_, keys) => {
    const { container } = renderGraph()
    focusRoot()
    keys.forEach(press)
    expect(root()).toHaveAttribute('aria-activedescendant')
    // The open tooltip measures its anchor on the next frame, so the run sits inside act.
    expect(await act(() => axe(container))).toHaveNoViolations()
  })
})

describe('NetworkGraph layout prop', () => {
  it('accepts a layout object written by hand', () => {
    const layout: GraphLayout = {
      key: 'origin',
      compute: ({ nodes }) => ({
        positions: Object.fromEntries(nodes.map((n, i) => [n.id, { x: 20, y: 20 + i * 30 }])),
        order: nodes.map((n) => n.id),
        width: 200,
        height: 200,
      }),
    }
    renderGraph({ layout })
    expect(screen.getAllByTestId(/^network-graph-node-/)).toHaveLength(5)
  })
})
