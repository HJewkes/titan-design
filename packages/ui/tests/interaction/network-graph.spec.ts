import { test, expect, type Page } from '@playwright/test'

const DEFAULT_STORY = 'components-organisms-networkgraph--default'

async function openGraph(page: Page, args = '') {
  const query = args === '' ? '' : `&args=${args}`
  await page.goto(`/iframe.html?id=${DEFAULT_STORY}&viewMode=story${query}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('application')).toBeVisible()
}

interface AxValue {
  value?: unknown
  relatedNodes?: { backendDOMNodeId?: number }[]
}
interface AxNode {
  ignored: boolean
  role?: AxValue
  name?: AxValue
  backendDOMNodeId?: number
  properties?: { name: string; value: AxValue }[]
}

/** The accessibility node Chromium resolves the graph's `aria-activedescendant` to. */
async function activeDescendant(page: Page) {
  const session = await page.context().newCDPSession(page)
  await session.send('Accessibility.enable')
  const { nodes } = (await session.send('Accessibility.getFullAXTree')) as { nodes: AxNode[] }
  await session.detach()
  const graph = nodes.find((node) => node.role?.value === 'application')
  const relation = graph?.properties?.find((property) => property.name === 'activedescendant')
  const targetId = relation?.value.relatedNodes?.[0]?.backendDOMNodeId
  const target = nodes.find((node) => targetId !== undefined && node.backendDOMNodeId === targetId)
  return { ignored: target?.ignored, role: target?.role?.value, name: target?.name?.value }
}

// Risk R1 of the contract: the active node is an HTML button, the active edge an SVG path.
test('aria-activedescendant resolves to a named button in the accessibility tree, for a node and for an edge', async ({
  page,
}) => {
  await openGraph(page, 'width:340;height:300')
  await page.getByRole('application').focus()
  await expect
    .poll(() => activeDescendant(page))
    .toEqual({ ignored: false, role: 'button', name: 'lead-01, Lead, 1 incoming, 5 outgoing' })

  await page.keyboard.press('ArrowRight')
  await expect
    .poll(() => activeDescendant(page))
    .toEqual({ ignored: false, role: 'button', name: 'lead-01 to worker-01, Messaged, weight 6' })
})

test('the graph is one tab stop', async ({ page }) => {
  await openGraph(page, 'width:340;height:300')
  const graph = page.getByRole('application')
  await graph.focus()
  await page.keyboard.press('Tab')
  expect(await graph.evaluate((root) => root.contains(document.activeElement))).toBe(false)
})

test('a key scrolls the active node into view in Wide fan-out', async ({ page }) => {
  await openGraph(page, 'fixture:Wide+fan-out;width:340;height:300')
  const parent = page.getByRole('button', { name: /^lead-01, / })
  const lastChild = page.getByRole('button', { name: /^worker-60, / })
  await expect(lastChild).not.toBeInViewport()

  await page.getByRole('application').focus()
  await expect(parent).toBeInViewport()

  await page.keyboard.press('End')
  await expect(lastChild).toBeInViewport()
  await expect(parent).not.toBeInViewport()

  await page.keyboard.press('Home')
  await expect(parent).toBeInViewport()
})

// Risk R2 of the contract: jsdom does not hit-test, so the width of an edge's press target is checked here.
test('an edge takes a press 5 px off its painted stroke, and not 12 px off', async ({ page }) => {
  await openGraph(page, 'fixture:Deep+chain;width:340;height:200')
  const edge = page.getByRole('button', { name: 'worker-01 to worker-02, Spawned, weight unknown' })
  const line = await edge.evaluate((path) => {
    const box = path.getBoundingClientRect()
    return { x: box.left + box.width * 0.75, y: box.top + box.height / 2 }
  })

  await page.mouse.click(line.x, line.y + 12)
  await expect(edge).toHaveAttribute('aria-pressed', 'false')

  await page.mouse.click(line.x, line.y + 5)
  await expect(edge).toHaveAttribute('aria-pressed', 'true')
})
