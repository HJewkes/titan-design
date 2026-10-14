// The box, compound and routed painter (TD-877): NetworkGraph rendering a precomputed map.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { parsePath } from '../../motion/paths/parse'
import { boxLayout } from './layouts/box-layout-model'
import { mapLayoutFixture } from './map/fixtures'
import { MAP_EDGE_KINDS, mapGraph } from './map/map-graph'
import { ARROW_LENGTH } from './network-graph-plot-model'
import { NetworkGraph } from './NetworkGraph'
import type { GraphBox, GraphEdge, GraphLayout, GraphNode, GraphPoint } from './types'

function renderMap(nodes: GraphNode[], edges: GraphEdge[], layout: GraphLayout) {
  return render(
    <NetworkGraph
      accessibilityLabel="Notes app map"
      nodes={nodes}
      edges={edges}
      edgeKinds={MAP_EDGE_KINDS}
      layout={layout}
      width={960}
      height={600}
    />
  )
}

function renderLevel(level: number) {
  const { nodes, edges, layout } = mapGraph(mapLayoutFixture, level)
  return renderMap(nodes, edges, layout)
}

const rectOf = (element: Element | null): GraphBox => {
  const read = (name: string) => Number(element?.getAttribute(name))
  return { x: read('x'), y: read('y'), width: read('width'), height: read('height') }
}
const groupRect = (container: HTMLElement, id: string) =>
  rectOf(container.querySelector(`rect[data-group="${id}"]`))
/** The node's own rectangle: the one with the box's stroke, not a halo or a ring. */
const nodeRect = (container: HTMLElement, id: string) =>
  rectOf(container.querySelector(`g[data-node="${id}"] rect[stroke-width="2"]:not([data-ring])`))
const edgePath = (container: HTMLElement, id: string) =>
  container.querySelector(`path[data-edge="${id}"]`)?.getAttribute('d') ?? ''

const inside = (outer: GraphBox, inner: GraphBox) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height

const vertices = (d: string): GraphPoint[] =>
  parsePath(d).flatMap((command) =>
    'x' in command ? [{ x: command.x as number, y: command.y as number }] : []
  )

describe('NetworkGraph box, compound and routed painter', () => {
  // Mutation caught: the route ignored and the edge drawn straight between the two ends.
  it('draws a routed edge through every bend point of its route', () => {
    const { container } = renderLevel(3)
    const route = mapLayoutFixture.edges.find((edge) => edge.id === 'e:notes->repo')?.route ?? []
    expect(route.length).toBeGreaterThan(2)
    expect(vertices(edgePath(container, 'e:notes->repo'))).toEqual(
      route.map(([x, y]) => ({ x, y }))
    )
  })

  // Mutation caught: a box painted from its centre as its corner, which pushes a child out of its parent.
  it('paints each child rect inside its parent rect', () => {
    const { container } = renderLevel(3)
    const chain = ['sys:notes', 'pkg/api', 'pkg/api/routes']
    chain.slice(1).forEach((id, i) => {
      expect(inside(groupRect(container, chain[i] as string), groupRect(container, id))).toBe(true)
    })
    const file = nodeRect(container, 'pkg/api/routes/notes.ts')
    expect(file.width).toBeGreaterThan(0)
    expect(inside(groupRect(container, 'pkg/api/routes'), file)).toBe(true)
  })

  // Mutation caught: zero offset, so the runtime edge is painted over the import edge.
  it('paints a runtime edge 18 px from an import edge between the same boxes', () => {
    const nodes = [
      { id: 'web', label: 'web' },
      { id: 'api', label: 'api' },
    ]
    const edges = [
      { id: 'web-api-import', source: 'web', target: 'api', kind: 'import' },
      { id: 'web-api-runtime', source: 'web', target: 'api', kind: 'runtime' },
    ]
    const layout = boxLayout({
      boxes: {
        web: { x: 40, y: 40, width: 200, height: 80 },
        api: { x: 440, y: 40, width: 200, height: 80 },
      },
    })
    const { container } = renderMap(nodes, edges, layout)
    const [importStart, importEnd] = vertices(edgePath(container, 'web-api-import'))
    const [runtimeStart, runtimeEnd] = vertices(edgePath(container, 'web-api-runtime'))
    expect(importStart?.x).toBe(240)
    expect(importEnd?.x).toBe(440)
    expect(Math.abs((runtimeStart?.y ?? 0) - (importStart?.y ?? 0))).toBe(18)
    expect(Math.abs((runtimeEnd?.y ?? 0) - (importEnd?.y ?? 0))).toBe(18)
  })

  // Mutation caught: the arrowhead's reference point left at 0, so it overshoots the target's border.
  it('puts the arrow tip on the end of a routed edge', () => {
    const { container } = renderLevel(3)
    const refX = [...container.querySelectorAll('marker')].map((m) => m.getAttribute('refX'))
    expect(refX).toEqual([String(ARROW_LENGTH), String(ARROW_LENGTH)])
  })

  // Mutation caught: groups painted in input order, so a parent covers its children.
  it('paints compound boxes outermost first, each with its label', () => {
    const { container } = renderLevel(2)
    const order = [...container.querySelectorAll('rect[data-variant="box"]')].map((rect) =>
      rect.getAttribute('data-group')
    )
    expect(order).toEqual(['sys:notes', 'pkg/api', 'pkg/store'])
    expect(screen.getByTestId('network-graph-group-pkg/api')).toHaveTextContent('api')
  })

  // Mutation caught: the press target left as the dot's 24 px row instead of the whole box.
  it('presses a box node anywhere on its box, its label centred inside', () => {
    renderLevel(1)
    const button = screen.getByTestId('network-graph-node-pkg/api')
    const style = button.style
    expect([style.left, style.top, style.width, style.height]).toEqual([
      '400px',
      '80px',
      '820px',
      '600px',
    ])
    expect(button).toHaveTextContent('api')
    act(() => fireEvent.click(button))
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('names each box node with the compound boxes that hold it', () => {
    renderLevel(3)
    expect(screen.getByRole('button', { name: /^notes\.ts, .*notes, api, routes/ })).toBeTruthy()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderLevel(3)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('mapGraph', () => {
  // Mutation caught: childless shallower nodes (an actor, an overflow box) dropped at a deep level.
  it('keeps childless shallower nodes as boxes and shallower parents as compound boxes', () => {
    const { nodes, edges } = mapGraph(mapLayoutFixture, 3)
    expect(nodes.map((node) => node.id)).toEqual([
      'actor:user',
      'ext:db',
      'pkg/web',
      'pkg/api/+more',
      'pkg/api/routes/notes.ts',
      'pkg/api/auth/session.ts',
      'pkg/store/src/notes-repo.ts',
    ])
    expect(edges.map((edge) => edge.id)).toEqual(['e:notes->session', 'e:notes->repo'])
    expect(edges.every((edge) => edge.kind === 'call')).toBe(true)
  })
})
