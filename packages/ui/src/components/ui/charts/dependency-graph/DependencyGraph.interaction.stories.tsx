// Pointer behaviour inside a docs-like page, as play functions. Hidden from the sidebar and docs
// (`!dev`, `!autodocs`); the `storybook` Vitest project runs them in Chromium at 1440 by 900.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { expect, waitFor, within } from 'storybook/test'

import { Surface } from '../../surface'
import { Typography } from '../../typography'
import { DependencyGraph } from './DependencyGraph'
import { architectureGraph } from './fixtures'

const PARAGRAPHS = Array.from(
  { length: 50 },
  (_, i) =>
    `Section ${String(i + 1)}. Every unit sits in one tier and depends only on the tiers below ` +
    'it. The graph below draws each unit in its tier box, with an arrow to each dependency. ' +
    'Press a unit to light its dependencies and dependents and to open its reference page.'
)

function Prose({ from, to }: { from: number; to: number }) {
  return (
    <View className="gap-stack-md">
      {PARAGRAPHS.slice(from, to).map((text) => (
        <Typography key={text} variant="body1">
          {text}
        </Typography>
      ))}
    </View>
  )
}

/** A docs page at desktop width: a navigation column, then a header, prose, the graph and more prose. */
function DocsPage() {
  return (
    <View className="flex-row">
      <View className="gap-stack-sm p-inset-md" style={{ width: 240 }}>
        <Typography variant="subtitle2">Guides</Typography>
        <Typography variant="body2">Architecture</Typography>
      </View>
      <View className="flex-1 gap-stack-lg p-inset-lg">
        <Typography variant="h3">Architecture</Typography>
        <Prose from={0} to={40} />
        <DependencyGraph
          graph={architectureGraph}
          accessibilityLabel="Package graph"
          width={960}
          height={640}
        />
        <Prose from={40} to={50} />
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Components/Organisms/DependencyGraph/Interactions',
  tags: ['!dev', '!autodocs', 'interaction', 'play'],
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: {
        desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
      },
    },
  },
  globals: { viewport: { value: 'desktop1440' } },
  decorators: [
    (Story) => (
      <Surface level="base" style={{ minHeight: '100%' }}>
        <Story />
      </Surface>
    ),
  ],
  render: () => <DocsPage />,
}
export default meta
type Story = StoryObj

const nodeButton = (canvas: HTMLElement) => within(canvas).getByTestId('network-graph-node-console')
const graphRoot = (canvas: HTMLElement) => within(canvas).getByTestId('network-graph-root')

/** Scrolls the page until the node sits just above the fold, with the rest of the graph below it. */
async function placeNodeAtFold(canvas: HTMLElement) {
  const node = nodeButton(canvas)
  const top = node.getBoundingClientRect().bottom - (window.innerHeight - 40)
  window.scrollBy({ top, behavior: 'instant' })
  await expect(window.scrollY).toBeGreaterThan(0)
  await expect(node.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight)
  await expect(graphRoot(canvas).getBoundingClientRect().bottom).toBeGreaterThan(window.innerHeight)
  return node
}

const commonAncestor = (a: Element, b: Element) => {
  let shared: Element | null = a
  while (shared && !shared.contains(b)) shared = shared.parentElement
  return shared ?? document.body
}

/**
 * A mouse press as the browser delivers one: each event goes to whatever is under the pointer at
 * that moment, the press focuses its focusable ancestor, and the click goes to the nearest element
 * holding both the press and the release.
 */
function mousePressAt(x: number, y: number) {
  const init = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y }
  const pointer = { ...init, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  const down = document.elementFromPoint(x, y) ?? document.body
  down.dispatchEvent(new PointerEvent('pointerdown', pointer))
  down.dispatchEvent(new MouseEvent('mousedown', init))
  ;(down.closest('[tabindex]') as HTMLElement | null)?.focus()
  const up = document.elementFromPoint(x, y) ?? document.body
  up.dispatchEvent(new PointerEvent('pointerup', pointer))
  up.dispatchEvent(new MouseEvent('mouseup', init))
  commonAncestor(down, up).dispatchEvent(new MouseEvent('click', init))
}

/** TD-1024: focus moving to the graph scrolled the page mid-press, so the release missed the node. */
export const MousePressFocusesANodeAtTheFold: Story = {
  play: async ({ canvasElement }) => {
    const node = await placeNodeAtFold(canvasElement)
    const box = node.getBoundingClientRect()

    mousePressAt(box.x + box.width / 2, box.y + box.height / 2)

    await waitFor(() => expect(node).toHaveAttribute('aria-pressed', 'true'))
    await expect(within(canvasElement).getByTestId('dependency-graph-focus')).toHaveTextContent(
      'api'
    )
  },
}

/** A click with no pointer behind it, as assistive tech sends, focuses the node without a jump. */
export const ClickFocusesANodeWithoutScrolling: Story = {
  play: async ({ canvasElement }) => {
    const node = await placeNodeAtFold(canvasElement)
    const scrolledTo = window.scrollY

    node.click()

    await waitFor(() => expect(node).toHaveAttribute('aria-pressed', 'true'))
    await expect(graphRoot(canvasElement)).toHaveFocus()
    await expect(window.scrollY).toBe(scrolledTo)
  },
}
