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

test('wrapped ragged text spans its widest line and reports each line', async ({ page }) => {
  const { text, ink } = byTestId(await collect(page), 'ragged')
  expect(text!.lineCount).toBe(3)
  expect(text!.last.baseline - text!.first.baseline).toBeCloseTo(40, 1)
  const widestEnd = Math.max(text!.first.right, text!.last.right)
  expect(ink![0] + ink![2]).toBeGreaterThan(widestEnd + 20)
})

test('a box-shadow paints, so its ink is its own box', async ({ page }) => {
  const shadowed = byTestId(await collect(page), 'shadowed')
  expect(shadowed.paints).toBe(true)
  expect(shadowed.ink).toEqual(shadowed.box)
})

test('text under a CSS scale(2) measures twice its unscaled offsets', async ({ page }) => {
  const layout = await collect(page)
  const plain = byTestId(layout, 'unscaled')
  const scaled = byTestId(layout, 'scaled')
  const offset = (n: typeof plain) => n.text!.first.baseline - n.box[1]
  expect(offset(scaled)).toBeCloseTo(2 * offset(plain), 0)
  expect(scaled.ink![3]).toBeCloseTo(2 * plain.ink![3], 0)
})

test('SVG text under a 2x viewBox puts its baseline on the scaled y', async ({ page }) => {
  const layout = await collect(page)
  const labelIn = (svg: { id: string }) =>
    layout.nodes.find((n) => n.tag === 'text' && n.parent === svg.id)!
  const svg = byTestId(layout, 'zoomed')
  const zoomed = labelIn(svg)
  const plain = labelIn(byTestId(layout, 'chart'))
  expect(zoomed.text!.first.baseline).toBeCloseTo(svg.box[1] + 60, 0)
  expect(zoomed.ink![3]).toBeCloseTo(2 * plain.ink![3], 0)
})

test('mixed-size tspans share one line and take ink from the larger run', async ({ page }) => {
  const layout = await collect(page)
  const textIn = (id: string) =>
    layout.nodes.find((n) => n.tag === 'text' && n.parent === byTestId(layout, id).id)!.text!
  const mixed = textIn('mixed')
  const big = textIn('big')
  expect(mixed.lineCount).toBe(1)
  expect(mixed.first.baseline - mixed.first.inkTop).toBeCloseTo(
    big.first.baseline - big.first.inkTop,
    0
  )
})

test('a 1px hairline divider is collected and paints', async ({ page }) => {
  const hairline = byTestId(await collect(page), 'hairline')
  expect(hairline.box[3]).toBe(1)
  expect(hairline.paints).toBe(true)
})

test('children of an opacity:0 ancestor are not collected', async ({ page }) => {
  const layout = await collect(page)
  expect(layout.nodes.some((n) => n.selector.includes('faded'))).toBe(false)
})
