import { test, expect } from '@playwright/test'
import { compositeOver } from '../../scripts/audit-stories/colour.mjs'
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

test('text over a translucent layer reports the composite as its backdrop', async ({ page }) => {
  const text = byTestId(await collect(page), 'over-rgba').text!
  expect(text.backdrop).toBe(compositeOver('rgba(0, 0, 255, 0.4)', 'rgb(200, 40, 40)'))
  expect(text.backdropImage).toBe(false)
  expect(text.color).toBe('rgb(250, 250, 250)')
})

test('text over a background image has no backdrop colour and says why', async ({ page }) => {
  const layout = await collect(page)
  const text = byTestId(layout, 'over-image').text!
  expect(text.backdrop).toBeNull()
  expect(text.backdropImage).toBe(true)
  expect(byTestId(layout, 'untracked').text!.backdrop).toBe('#ffffff')
})

test('nested opacity 0.5 inside 0.5 gives an effective opacity of 0.25', async ({ page }) => {
  const { style } = byTestId(await collect(page), 'half-of-half')
  expect(style.opacity).toBe(1)
  expect(style.effectiveOpacity).toBe(0.25)
})

test('tracked caps text reports its computed text and box style', async ({ page }) => {
  const layout = await collect(page)
  const { text, style } = byTestId(layout, 'tracked')
  expect(text).toMatchObject({
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: 600,
    family: 'Sample Face',
    ownText: 'Overline text that runs well past the fo',
  })
  expect(style).toMatchObject({
    textAlign: 'right',
    direction: 'rtl',
    boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 1px',
    hasBackgroundImage: false,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  })
  expect(byTestId(layout, 'untracked').text!.letterSpacing).toBe(0)
})

test('two copies of one icon hash alike and a different icon does not', async ({ page }) => {
  const layout = await collect(page)
  const [a, b, c] = ['icon-a', 'icon-b', 'icon-c'].map((id) => byTestId(layout, id))
  expect(a.glyph).toEqual(expect.any(String))
  expect(a.glyph).toBe(b.glyph)
  expect(c.glyph).not.toBe(a.glyph)
  expect(byTestId(layout, 'icon-named').glyph).toBe('sample-icon')
})

test('an svg reports the stroke of its first shape, else its fill', async ({ page }) => {
  const layout = await collect(page)
  expect(byTestId(layout, 'icon-a').paint).toBe('rgb(10, 120, 60)')
  expect(byTestId(layout, 'icon-c').paint).toBe('rgb(1, 2, 3)')
  expect(byTestId(layout, 'wrapper')).not.toHaveProperty('glyph')
})

test('headings report their level from aria-level, the tag, or the ARIA default', async ({
  page,
}) => {
  const layout = await collect(page)
  expect(byTestId(layout, 'aria-heading').heading).toBe(3)
  expect(byTestId(layout, 'tag-heading').heading).toBe(4)
  expect(byTestId(layout, 'default-heading').heading).toBe(2)
  expect(byTestId(layout, 'concept').heading).toBeNull()
})

test('a node reports its data-concept and its ARIA state', async ({ page }) => {
  const layout = await collect(page)
  expect(byTestId(layout, 'concept').concept).toBe('sample-concept')
  expect(byTestId(layout, 'selected').state).toEqual({
    selected: true,
    current: 'page',
    pressed: null,
    checked: null,
    disabled: false,
  })
  expect(byTestId(layout, 'disabled-child').state).toMatchObject({
    pressed: 'true',
    disabled: true,
  })
})

test('a story audit parameter resolves its selectors to node ids', async ({ page }) => {
  expect((await collect(page)).audit).toEqual({ concepts: {}, glyphRoles: {} })
  await page.evaluate(() => {
    const audit = {
      concepts: { sample: ['[data-testid="concept"]', '[data-testid="faded"]'] },
      glyphRoles: { '[data-testid="icon-a"]': 'status', 'not a selector((': 'ignored' },
    }
    Object.assign(window, {
      __STORYBOOK_PREVIEW__: { currentRender: { story: { parameters: { audit } } } },
    })
  })
  const layout = await collect(page)
  expect(layout.audit).toEqual({
    concepts: { sample: [byTestId(layout, 'concept').id] },
    glyphRoles: { [byTestId(layout, 'icon-a').id]: 'status' },
  })
})
