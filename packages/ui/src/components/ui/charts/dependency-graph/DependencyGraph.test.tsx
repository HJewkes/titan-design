import { act, fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { MUTED_OPACITY } from '../network-graph/NetworkGraphNodeMarks'
import { DependencyGraph } from './DependencyGraph'
import { architectureGraph, EGO_FOCUS, egoGraph } from './fixtures'
import type { DependencyGraphProps } from './types'

const BASE: DependencyGraphProps = {
  graph: architectureGraph,
  accessibilityLabel: 'Package graph',
  width: 800,
  height: 480,
}

const graph = (props: Partial<DependencyGraphProps> = {}) => (
  <DependencyGraph {...BASE} {...props} />
)

const root = () => screen.getByTestId('network-graph-root')
const nodeButton = (id: string) => screen.getByTestId(`network-graph-node-${id}`)
const panel = () => screen.getByTestId('dependency-graph-focus')
const isMuted = (container: HTMLElement, id: string) =>
  container.querySelector(`g[data-node="${id}"]`)?.getAttribute('opacity') === String(MUTED_OPACITY)
const edgeOpacity = (container: HTMLElement, id: string) =>
  container.querySelector(`path[data-edge="${id}"]`)?.getAttribute('opacity')
const drawnNodes = (container: HTMLElement) =>
  [...container.querySelectorAll('g[data-node]')].map((g) => g.getAttribute('data-node'))

/** Presses a node, then moves focus away, so only the focus (not the cursor) can light it. */
function focusAndLeave(id: string) {
  fireEvent.click(nodeButton(id))
  act(() => root().blur())
}

describe('DependencyGraph', () => {
  it('draws every node in a box inside its tier box, with routed edges', () => {
    const { container } = render(graph())

    expect(drawnNodes(container)).toHaveLength(12)
    expect(container.querySelectorAll('g[data-shape="box"]')).toHaveLength(12)
    expect(nodeButton('kernel')).toHaveAccessibleName(/Core/)
    expect(container.querySelector('path[data-edge="api->schema"]')).not.toBeNull()
  })

  it('pressing a node keeps its dependencies and dependents lit after focus leaves', () => {
    const { container } = render(graph())

    focusAndLeave(EGO_FOCUS)

    for (const id of ['api', 'schema', 'logger', 'config', 'console', 'mobile', 'studio']) {
      expect(isMuted(container, id)).toBe(false)
    }
    for (const id of ['kernel', 'billing', 'docs', 'search']) {
      expect(isMuted(container, id)).toBe(true)
    }
    expect(edgeOpacity(container, 'console->api')).toBe('1')
    expect(edgeOpacity(container, 'schema->kernel')).toBe(String(MUTED_OPACITY))
  })

  it('names the focused node, what it depends on and what uses it, with the link slot', () => {
    render(graph({ renderNodeLink: (node) => <Text>Open {node.id} reference</Text> }))

    focusAndLeave('auth')

    expect(panel()).toHaveTextContent('@acme/auth')
    expect(panel()).toHaveTextContent('Depends on: @acme/logger, @acme/config')
    expect(panel()).toHaveTextContent('Used by: @acme/console, @acme/mobile, @acme/billing')
    expect(screen.getByText('Open auth reference')).toBeInTheDocument()
  })

  it('Enter on the keyboard cursor focuses that node', () => {
    const onFocusedIdChange = vi.fn()
    render(graph({ onFocusedIdChange }))

    act(() => root().focus())
    fireEvent.keyDown(root(), { key: 'Enter' })

    expect(onFocusedIdChange).toHaveBeenCalledWith(expect.any(String))
    const id = onFocusedIdChange.mock.calls[0]?.[0] as string
    expect(panel()).toHaveTextContent(`@acme/${id}`)
  })

  it('pressing the focused node again clears the focus', () => {
    const { container } = render(graph({ defaultFocusedId: 'api' }))

    fireEvent.click(nodeButton('api'))
    act(() => root().blur())

    expect(isMuted(container, 'kernel')).toBe(false)
    expect(panel()).toHaveTextContent('Select a box')
  })

  it('a controlled focus lights its neighbourhood and reports presses without moving', () => {
    const onFocusedIdChange = vi.fn()
    const { container } = render(graph({ focusedId: 'kernel', onFocusedIdChange }))

    focusAndLeave('docs')

    expect(onFocusedIdChange).toHaveBeenCalledWith('docs')
    expect(isMuted(container, 'schema')).toBe(false)
    expect(isMuted(container, 'api')).toBe(true)
  })

  it('ego mode draws only the node, its dependencies and its dependents', () => {
    const { container } = render(graph({ egoId: EGO_FOCUS, graph: egoGraph }))

    expect(new Set(drawnNodes(container))).toEqual(
      new Set(['api', 'schema', 'logger', 'config', 'console', 'mobile', 'studio'])
    )
  })

  it('shows the empty state when nothing is drawn, and no panel', () => {
    render(graph({ egoId: 'ghost', emptyState: <Text>No such package</Text> }))

    expect(screen.getByText('No such package')).toBeInTheDocument()
    expect(screen.queryByTestId('dependency-graph-focus')).toBeNull()
  })

  it('renders a skeleton while loading, and no panel', () => {
    render(graph({ isLoading: true }))

    expect(screen.getByLabelText('Package graph, loading')).toBeInTheDocument()
    expect(screen.queryByTestId('dependency-graph-focus')).toBeNull()
  })

  it('hydrates the server markup without a mismatch', async () => {
    const element = graph({ defaultFocusedId: 'api' })
    const host = document.createElement('div')
    host.innerHTML = renderToString(element)
    document.body.appendChild(host)
    const onRecoverableError = vi.fn()

    await act(async () => {
      hydrateRoot(host, element, { onRecoverableError })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(host.querySelectorAll('g[data-node]')).toHaveLength(12)
    host.remove()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(graph({ defaultFocusedId: 'api' }))

    expect(await axe(container)).toHaveNoViolations()
  })
})
