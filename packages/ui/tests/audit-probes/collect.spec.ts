import { test, expect } from '@playwright/test'
import { collect, loadFixture, type Layout } from './load-fixture'

const byTestId = (layout: Layout, id: string) => {
  const node = layout.nodes.find((n) => n.selector === `[data-testid="${id}"]`)
  if (!node) throw new Error(`no node for ${id}`)
  return node
}

test.beforeEach(async ({ page }) => {
  await loadFixture(page, 'collect.html')
})

test('a baseline-aligned pair reports baselines within 0.25px', async ({ page }) => {
  const layout = await collect(page)
  const small = byTestId(layout, 'pair-small').text!
  const large = byTestId(layout, 'pair-large').text!
  expect(Math.abs(small.first.baseline - large.first.baseline)).toBeLessThanOrEqual(0.25)
})

test('a 48px line-height:1 numeral reports inkTop inside its line box', async ({ page }) => {
  const numeral = byTestId(await collect(page), 'numeral')
  const [, top, , height] = numeral.box
  expect(numeral.text!.fontSize).toBe(48)
  expect(numeral.text!.first.inkTop).toBeGreaterThan(top)
  expect(numeral.text!.first.inkTop).toBeLessThan(top + height)
})

test('SVG text is collected', async ({ page }) => {
  const layout = await collect(page)
  const chart = byTestId(layout, 'chart')
  const label = layout.nodes.find((n) => n.tag === 'text' && n.parent === chart.id)
  expect(label?.text?.lineCount).toBe(1)
  expect(label?.text?.first.baseline).toBeCloseTo(chart.box[1] + 30, 0)
})

test('the ink of an unpainted padded wrapper equals its child box', async ({ page }) => {
  const layout = await collect(page)
  const wrapper = byTestId(layout, 'wrapper')
  const swatch = byTestId(layout, 'swatch')
  expect(wrapper.paints).toBe(false)
  expect(wrapper.box[3]).toBe(swatch.box[3] + 24)
  expect(wrapper.ink).toEqual(swatch.box)
})

test('two runs over the same frame give identical output', async ({ page }) => {
  expect(await collect(page)).toEqual(await collect(page))
})
