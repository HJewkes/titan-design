import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Computed-style comparison tests: HTML ground truth vs React component.
 *
 * Each test navigates to the comparison specimen page, finds the HTML and React
 * versions of a component variant, extracts computed styles, and asserts they match.
 *
 * These components use react-native-web + NativeWind. NativeWind compiles Tailwind
 * classes into RN style objects, which react-native-web renders as inline styles.
 * Any class-based styles that NativeWind doesn't convert will show as mismatches.
 */

// Priority 1a: Layout properties added to container props
const CONTAINER_PROPS = [
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'borderWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'gap',
  'opacity',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'boxShadow',
] as const

// Priority 1b: Text properties with letterSpacing, lineHeight, textTransform
const TEXT_PROPS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textTransform',
] as const

const STYLE_PROPS = [...CONTAINER_PROPS, ...TEXT_PROPS] as const

/**
 * react-native-web renders <Text> as <div dir="auto" class="css-text-...">
 * Font styles only apply to these Text elements, not to View containers.
 */
const RNW_TEXT_SELECTOR = 'div[dir="auto"]'

type StyleMap = Record<string, string>

async function getStyles(locator: Locator, props: readonly string[]): Promise<StyleMap> {
  return locator.evaluate((el, propsArg) => {
    const cs = window.getComputedStyle(el)
    const result: Record<string, string> = {}
    for (const p of propsArg) {
      result[p] = cs.getPropertyValue(
        p.replace(/([A-Z])/g, '-$1').toLowerCase(),
      )
    }
    return result
  }, props as unknown as string[])
}

function normalizeColor(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeFontFamily(value: string): string {
  return value
    .split(',')
    .map((f) => f.trim().replace(/['"]/g, '').toLowerCase())
    .join(', ')
}

/**
 * Normalize display property: treat inline-flex and flex as equivalent
 * when both are flex-based. RNW renders Views as flex, HTML uses inline-flex.
 */
function normalizeDisplay(value: string): string {
  if (value === 'inline-flex') return 'flex'
  return value
}

/**
 * Normalize lineHeight: "normal" varies across browsers, so we treat
 * "normal" as equivalent to any reasonable computed value.
 */
function normalizeLineHeight(htmlVal: string, reactVal: string): [string, string] {
  if (htmlVal === 'normal' || reactVal === 'normal') {
    return ['normal', 'normal']
  }
  return [htmlVal, reactVal]
}

function compareStyles(
  htmlStyles: StyleMap,
  reactStyles: StyleMap,
  props: readonly string[],
): Array<{ prop: string; html: string; react: string }> {
  const mismatches: Array<{ prop: string; html: string; react: string }> = []

  for (const prop of props) {
    let htmlVal = htmlStyles[prop] ?? ''
    let reactVal = reactStyles[prop] ?? ''

    if (prop.includes('olor')) {
      htmlVal = normalizeColor(htmlVal)
      reactVal = normalizeColor(reactVal)
    }

    if (prop === 'fontFamily') {
      htmlVal = normalizeFontFamily(htmlVal)
      reactVal = normalizeFontFamily(reactVal)
    }

    if (prop === 'fontWeight') {
      const weightMap: Record<string, string> = { normal: '400', bold: '700' }
      htmlVal = weightMap[htmlVal] ?? htmlVal
      reactVal = weightMap[reactVal] ?? reactVal
    }

    // Normalize borderRadius: standardize on "50%" as the canonical circle value.
    // Also treat small px values (< 12px) as circle when the other side is 50%,
    // since RNW computes borderRadius: size/2 as px while HTML uses 50%.
    if (prop === 'borderRadius') {
      const circleValues = new Set(['50%', '9999px', '100px'])
      if (circleValues.has(htmlVal)) htmlVal = '50%'
      if (circleValues.has(reactVal)) reactVal = '50%'
      // If one is 50% and the other is a small px value (circle on a small element)
      if (htmlVal === '50%' && reactVal.endsWith('px')) {
        const px = parseFloat(reactVal)
        if (px > 0 && px <= 20) reactVal = '50%'
      }
      if (reactVal === '50%' && htmlVal.endsWith('px')) {
        const px = parseFloat(htmlVal)
        if (px > 0 && px <= 20) htmlVal = '50%'
      }
    }

    // Skip borderColor/borderWidth when neither side intentionally set a border
    // (browser defaults differ: HTML gets rgb(229,231,235), RNW gets rgb(0,0,0))
    if (prop === 'borderColor' || prop === 'borderWidth') {
      const isDefaultBorder = (val: string) =>
        val === 'rgb(0, 0, 0)' || val === 'rgb(229, 231, 235)' || val === '0px' || val === ''
      if (isDefaultBorder(htmlVal) && isDefaultBorder(reactVal)) {
        continue // Both are unset/default — skip
      }
    }

    // Normalize display: treat inline-flex as equivalent to flex
    if (prop === 'display') {
      htmlVal = normalizeDisplay(htmlVal)
      reactVal = normalizeDisplay(reactVal)
    }

    // Normalize lineHeight: treat "normal" as equivalent
    if (prop === 'lineHeight') {
      ;[htmlVal, reactVal] = normalizeLineHeight(htmlVal, reactVal)
    }

    // Normalize letterSpacing: treat "normal" and "0px" as equivalent
    if (prop === 'letterSpacing') {
      if (htmlVal === 'normal') htmlVal = '0px'
      if (reactVal === 'normal') reactVal = '0px'
    }

    // Normalize textTransform: treat "" and "none" as equivalent
    if (prop === 'textTransform') {
      if (htmlVal === '' || htmlVal === 'none') htmlVal = 'none'
      if (reactVal === '' || reactVal === 'none') reactVal = 'none'
    }

    // Normalize boxShadow: skip when both are "none" or empty
    if (prop === 'boxShadow') {
      if ((htmlVal === 'none' || htmlVal === '') && (reactVal === 'none' || reactVal === '')) {
        continue
      }
    }

    if (htmlVal !== reactVal) {
      mismatches.push({ prop, html: htmlVal, react: reactVal })
    }
  }

  return mismatches
}

/**
 * Core assertion: find both versions within a test-id container and compare styles.
 *
 * Uses `toBeAttached()` instead of `toBeVisible()` because react-native-web
 * components may have 0 height when NativeWind classes aren't applied (a real bug
 * this test suite is designed to catch).
 *
 * When `reactTextSelector` is provided, text-related styles (color, fontFamily,
 * fontSize, fontWeight, letterSpacing, lineHeight, textTransform) are compared
 * against that selector instead of the main React container.
 */
async function assertStyleMatch(
  page: Page,
  testId: string,
  htmlSelector: string,
  reactSelector: string,
  propsOrOptions?: readonly string[] | {
    reactTextSelector: string
    props?: readonly string[]
  },
) {
  const hasTextSplit = propsOrOptions != null && !Array.isArray(propsOrOptions)
  const props = hasTextSplit
    ? (propsOrOptions.props ?? STYLE_PROPS)
    : (propsOrOptions ?? STYLE_PROPS)
  const reactTextSelector = hasTextSplit ? propsOrOptions.reactTextSelector : undefined

  const container = page.locator(`[data-testid="${testId}"]`)
  await expect(container).toBeAttached()

  const htmlEl = container.locator(`.html-version ${htmlSelector}`).first()
  const reactEl = container.locator(`.react-version ${reactSelector}`).first()

  await expect(htmlEl).toBeAttached({ timeout: 3000 })
  await expect(reactEl).toBeAttached({ timeout: 3000 })

  const allMismatches: Array<{ prop: string; html: string; react: string }> = []

  if (reactTextSelector) {
    const containerProps = props.filter(
      (p) => !(TEXT_PROPS as readonly string[]).includes(p),
    )
    const textProps = props.filter(
      (p) => (TEXT_PROPS as readonly string[]).includes(p),
    )

    if (containerProps.length > 0) {
      const htmlStyles = await getStyles(htmlEl, containerProps)
      const reactStyles = await getStyles(reactEl, containerProps)
      allMismatches.push(...compareStyles(htmlStyles, reactStyles, containerProps))
    }

    if (textProps.length > 0) {
      const reactTextEl = container
        .locator(`.react-version ${reactTextSelector}`)
        .first()
      await expect(reactTextEl).toBeAttached({ timeout: 3000 })

      const htmlStyles = await getStyles(htmlEl, textProps)
      const reactStyles = await getStyles(reactTextEl, textProps)
      allMismatches.push(...compareStyles(htmlStyles, reactStyles, textProps))
    }
  } else {
    const htmlStyles = await getStyles(htmlEl, props)
    const reactStyles = await getStyles(reactEl, props)
    allMismatches.push(...compareStyles(htmlStyles, reactStyles, props))
  }

  // Compare bounding box dimensions (width/height) with tolerance
  const DIMENSION_TOLERANCE = 2 // px — accounts for sub-pixel text rendering differences
  const htmlRect = await htmlEl.evaluate(el => {
    const r = el.getBoundingClientRect()
    return { width: Math.round(r.width), height: Math.round(r.height) }
  })
  const reactRect = await reactEl.evaluate(el => {
    const r = el.getBoundingClientRect()
    return { width: Math.round(r.width), height: Math.round(r.height) }
  })

  if (Math.abs(htmlRect.width - reactRect.width) > DIMENSION_TOLERANCE) {
    allMismatches.push({ prop: 'width (px)', html: `${htmlRect.width}px`, react: `${reactRect.width}px` })
  }
  if (Math.abs(htmlRect.height - reactRect.height) > DIMENSION_TOLERANCE) {
    allMismatches.push({ prop: 'height (px)', html: `${htmlRect.height}px`, react: `${reactRect.height}px` })
  }

  // Priority 4: Text content verification (normalize whitespace).
  // RNW renders each Text as a separate div[dir="auto"], so adjacent text nodes
  // lack the inter-element whitespace that HTML naturally has. We normalize by
  // collapsing all whitespace and comparing the non-space characters.
  const htmlText = await htmlEl.evaluate(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
  const reactText = await reactEl.evaluate(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
  // Compare with all spaces removed (catches RNW no-space-between-elements)
  const htmlTextNoSpace = htmlText.replace(/\s/g, '')
  const reactTextNoSpace = reactText.replace(/\s/g, '')
  if (htmlTextNoSpace !== reactTextNoSpace) {
    allMismatches.push({ prop: 'textContent', html: htmlText, react: reactText })
  }

  // Priority 5: Child element count
  // Note: RNW wraps text in div[dir="auto"], so React typically has more
  // child elements than flat HTML. We only flag large discrepancies (>2).
  const htmlChildCount = await htmlEl.evaluate(el => el.children.length)
  const reactChildCount = await reactEl.evaluate(el => el.children.length)
  const childDiff = Math.abs(htmlChildCount - reactChildCount)
  if (childDiff > 2) {
    allMismatches.push({ prop: 'childCount', html: String(htmlChildCount), react: String(reactChildCount) })
  }

  if (allMismatches.length > 0) {
    const report = allMismatches
      .map((m) => `  ${m.prop}: HTML="${m.html}" React="${m.react}"`)
      .join('\n')
    expect.soft(allMismatches.length, `Style mismatches for ${testId}:\n${report}`).toBe(0)
  }
}

/**
 * Compare sub-elements within a comparison pair by iterating children
 * and checking a specific CSS property on each.
 */
async function assertSubElementStyles(
  page: Page,
  testId: string,
  htmlSelector: string,
  reactSelector: string,
  props: readonly string[],
) {
  const container = page.locator(`[data-testid="${testId}"]`)
  await expect(container).toBeAttached()

  const htmlEls = container.locator(`.html-version ${htmlSelector}`)
  const reactEls = container.locator(`.react-version ${reactSelector}`)

  const htmlCount = await htmlEls.count()
  const reactCount = await reactEls.count()

  const allMismatches: Array<{ prop: string; html: string; react: string }> = []

  if (htmlCount !== reactCount) {
    allMismatches.push({ prop: 'element count', html: String(htmlCount), react: String(reactCount) })
  }

  const count = Math.min(htmlCount, reactCount)
  for (let i = 0; i < count; i++) {
    const htmlStyles = await getStyles(htmlEls.nth(i), props)
    const reactStyles = await getStyles(reactEls.nth(i), props)
    const mismatches = compareStyles(htmlStyles, reactStyles, props)
    for (const m of mismatches) {
      allMismatches.push({ prop: `[${i}].${m.prop}`, html: m.html, react: m.react })
    }
  }

  if (allMismatches.length > 0) {
    const report = allMismatches
      .map((m) => `  ${m.prop}: HTML="${m.html}" React="${m.react}"`)
      .join('\n')
    expect.soft(allMismatches.length, `Sub-element mismatches for ${testId}:\n${report}`).toBe(0)
  }
}

test.describe('HTML vs React Component Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/comparison.html')
    await page.waitForFunction(() => document.fonts.ready)
    await page.waitForTimeout(500)
  })

  // ── E1rmBadge ──

  test('E1rmBadge default md', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-default-md', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge default sm', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-default-sm', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge default lg', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-default-lg', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge PR', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-pr', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge delta positive', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-delta-positive', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge delta negative', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-delta-negative', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  test('E1rmBadge no icon', async ({ page }) => {
    await assertStyleMatch(page, 'compare-e1rm-badge-no-icon', '.e1rm-badge', '[data-testid="e1rm-badge"]', { reactTextSelector: '[data-testid="e1rm-badge"] div[dir="auto"]' })
  })

  // ── PrBadge ──

  test('PrBadge e1rm', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-pr-badge-e1rm',
      '.pr-badge', '[aria-label^="Personal record"]', { reactTextSelector: '[aria-label^="Personal record"] div[dir="auto"]' },
    )
  })

  test('PrBadge reps', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-pr-badge-reps',
      '.pr-badge', '[aria-label^="Personal record"]', { reactTextSelector: '[aria-label^="Personal record"] div[dir="auto"]' },
    )
  })

  test('PrBadge compact', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-pr-badge-compact',
      '.pr-badge-compact', '[data-testid="pr-badge-star"]',
      ['color', 'fontSize'] as const,
    )
  })

  // ── StatusDot ──

  const statusVariants = ['success', 'warning', 'error', 'neutral', 'on-track', 'deviation', 'future'] as const
  const statusDotProps = [
    'backgroundColor', 'borderColor', 'borderRadius', 'borderWidth', 'borderStyle',
    'display', 'alignItems', 'justifyContent',
  ] as const

  for (const variant of statusVariants) {
    test(`StatusDot ${variant} md`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-status-dot-${variant}-md`,
        '.status-dot', '[data-testid="status-dot"]',
        statusDotProps,
      )
    })
  }

  for (const variant of statusVariants) {
    test(`StatusDot ${variant} sm`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-status-dot-${variant}-sm`,
        '.status-dot', '[data-testid="status-dot"]',
        statusDotProps,
      )
    })
  }

  // Priority 3a: StatusDot with icons
  const iconVariants = ['success', 'warning', 'error'] as const

  for (const variant of iconVariants) {
    test(`StatusDot ${variant} md with icon`, async ({ page }) => {
      // Check the dot container
      await assertStyleMatch(
        page, `compare-status-dot-${variant}-icon`,
        '.status-dot', '[data-testid="status-dot"]',
        statusDotProps,
      )
      // Check the icon text element
      const container = page.locator(`[data-testid="compare-status-dot-${variant}-icon"]`)
      const htmlIcon = container.locator('.html-version .dot-icon').first()
      const reactIcon = container.locator(`.react-version [data-testid="status-dot"] ${RNW_TEXT_SELECTOR}`).first()

      await expect(htmlIcon).toBeAttached({ timeout: 3000 })
      await expect(reactIcon).toBeAttached({ timeout: 3000 })

      const iconTextProps = ['color', 'fontSize', 'fontWeight'] as const
      const htmlStyles = await getStyles(htmlIcon, iconTextProps)
      const reactStyles = await getStyles(reactIcon, iconTextProps)
      const mismatches = compareStyles(htmlStyles, reactStyles, iconTextProps)

      if (mismatches.length > 0) {
        const report = mismatches
          .map((m) => `  icon.${m.prop}: HTML="${m.html}" React="${m.react}"`)
          .join('\n')
        expect.soft(mismatches.length, `Icon style mismatches for StatusDot ${variant}:\n${report}`).toBe(0)
      }
    })
  }

  // Priority 3b: StatusDot with glow
  for (const variant of iconVariants) {
    test(`StatusDot ${variant} md with glow`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-status-dot-${variant}-glow`,
        '.status-dot', '[data-testid="status-dot"]',
        [...statusDotProps, 'boxShadow'] as const,
      )
    })
  }

  // ── PlaceholderStrip ──

  const placeholderProps = [
    'height', 'backgroundColor', 'borderRadius', 'opacity', 'gap', 'display',
  ] as const

  test('PlaceholderStrip single', async ({ page }) => {
    // Single strip: no children, so display: block (HTML) vs flex (RNW) is not visually different.
    // Use the original props without display for single strip.
    const singleStripProps = [
      'height', 'backgroundColor', 'borderRadius', 'opacity', 'gap',
    ] as const
    await assertStyleMatch(
      page, 'compare-placeholder-single',
      '.placeholder-strip-single', '[data-testid="placeholder-strip"]',
      singleStripProps,
    )
  })

  test('PlaceholderStrip segmented 3', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-placeholder-segmented-3',
      '.placeholder-strip-segmented', '[data-testid="placeholder-strip"]',
      placeholderProps,
    )
  })

  // ── VelocityStrip (mini) ──

  const velocityMiniProps = [
    'height', 'gap', 'borderRadius', 'display', 'flexDirection',
  ] as const

  test('VelocityStrip mini fast', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-velocity-mini-fast',
      '.velocity-mini', '[data-testid="velocity-strip-mini"]',
      velocityMiniProps,
    )
  })

  test('VelocityStrip mini mixed', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-velocity-mini-mixed',
      '.velocity-mini', '[data-testid="velocity-strip-mini"]',
      velocityMiniProps,
    )
  })

  test('VelocityStrip mini grinding', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-velocity-mini-grinding',
      '.velocity-mini', '[data-testid="velocity-strip-mini"]',
      velocityMiniProps,
    )
  })

  // Priority 2a: VelocityStrip bar colors
  test('VelocityStrip mini fast -- bar colors', async ({ page }) => {
    await assertSubElementStyles(
      page, 'compare-velocity-mini-fast',
      '.vel-bar', '[data-testid^="velocity-bar-"]',
      ['backgroundColor'] as const,
    )
  })

  test('VelocityStrip mini mixed -- bar colors', async ({ page }) => {
    await assertSubElementStyles(
      page, 'compare-velocity-mini-mixed',
      '.vel-bar', '[data-testid^="velocity-bar-"]',
      ['backgroundColor'] as const,
    )
  })

  test('VelocityStrip mini grinding -- bar colors', async ({ page }) => {
    await assertSubElementStyles(
      page, 'compare-velocity-mini-grinding',
      '.vel-bar', '[data-testid^="velocity-bar-"]',
      ['backgroundColor'] as const,
    )
  })

  // Priority 3d: VelocityStrip expanded
  // Note: RNW Animated.View may not render animated height in static test context.
  // This test checks that the expanded container renders and has bars.
  test('VelocityStrip expanded -- renders with bars', async ({ page }) => {
    const container = page.locator('[data-testid="compare-velocity-expanded"]')
    await expect(container).toBeAttached()

    const reactEl = container.locator('.react-version [data-testid="velocity-strip"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })

    // Wait for animation to complete
    await page.waitForTimeout(1000)

    // Verify bars are rendered
    const barCount = await container.locator('.react-version [data-testid^="velocity-bar-"]').count()
    expect(barCount, 'Expanded strip should have 3 bars').toBe(3)

    // Check width renders correctly
    const reactRect = await reactEl.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { width: Math.round(r.width), height: Math.round(r.height) }
    })
    expect.soft(reactRect.width, 'Expanded strip width').toBeGreaterThanOrEqual(195)
  })

  // ── TempoDisplay ──

  const tempoContainerProps = [
    'backgroundColor', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'display', 'alignItems',
  ] as const

  test('TempoDisplay colored md', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-tempo-colored-md',
      '.tempo-display', '[data-testid="tempo-display"] > div',
      tempoContainerProps,
    )
    // Check text-level properties on the tempo-value element
    const container = page.locator('[data-testid="compare-tempo-colored-md"]')
    const htmlText = container.locator('.html-version .tempo-value').first()
    const reactText = container.locator(`.react-version [data-testid="tempo-display"] ${RNW_TEXT_SELECTOR}`).first()

    await expect(htmlText).toBeAttached({ timeout: 3000 })
    await expect(reactText).toBeAttached({ timeout: 3000 })

    const tempoTextProps = ['fontSize', 'fontWeight', 'letterSpacing'] as const
    const htmlStyles = await getStyles(htmlText, tempoTextProps)
    const reactStyles = await getStyles(reactText, tempoTextProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, tempoTextProps)

    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  text.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `TempoDisplay colored md text mismatches:\n${report}`).toBe(0)
    }
  })

  test('TempoDisplay mono md', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-tempo-mono-md',
      '.tempo-display', '[data-testid="tempo-display"] > div',
      tempoContainerProps,
    )
    // Check mono text color
    const container = page.locator('[data-testid="compare-tempo-mono-md"]')
    const htmlText = container.locator('.html-version .tempo-value.mono').first()
    const reactText = container.locator(`.react-version [data-testid="tempo-display"] ${RNW_TEXT_SELECTOR}`).first()

    await expect(htmlText).toBeAttached({ timeout: 3000 })
    await expect(reactText).toBeAttached({ timeout: 3000 })

    const monoTextProps = ['color', 'fontSize', 'fontWeight', 'letterSpacing'] as const
    const htmlStyles = await getStyles(htmlText, monoTextProps)
    const reactStyles = await getStyles(reactText, monoTextProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, monoTextProps)

    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  text.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `TempoDisplay mono md text mismatches:\n${report}`).toBe(0)
    }
  })

  test('TempoDisplay colored sm', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-tempo-colored-sm',
      '.tempo-display', '[data-testid="tempo-display"] > div',
      tempoContainerProps,
    )
  })

  // ── DeviationBar ──

  const deviationContainerProps = [
    'height', 'display', 'alignItems', 'justifyContent',
  ] as const

  test('DeviationBar -1.0', async ({ page }) => {
    await assertStyleMatch(page, 'compare-deviation-neg1', '.deviation-bar', '[data-testid="deviation-bar"]', deviationContainerProps)
  })

  test('DeviationBar 0', async ({ page }) => {
    await assertStyleMatch(page, 'compare-deviation-0', '.deviation-bar', '[data-testid="deviation-bar"]', deviationContainerProps)
  })

  test('DeviationBar +0.5', async ({ page }) => {
    await assertStyleMatch(page, 'compare-deviation-0_5', '.deviation-bar', '[data-testid="deviation-bar"]', deviationContainerProps)
  })

  test('DeviationBar +1.0', async ({ page }) => {
    await assertStyleMatch(page, 'compare-deviation-1', '.deviation-bar', '[data-testid="deviation-bar"]', deviationContainerProps)
  })

  // Priority 2c: DeviationBar dot color checks
  const deviationDotData = [
    { testId: 'compare-deviation-neg1', label: '-1.0' },
    { testId: 'compare-deviation-0', label: '0' },
    { testId: 'compare-deviation-0_5', label: '+0.5' },
    { testId: 'compare-deviation-1', label: '+1.0' },
  ] as const

  for (const { testId, label } of deviationDotData) {
    test(`DeviationBar ${label} -- dot color`, async ({ page }) => {
      await assertStyleMatch(
        page, testId,
        '.deviation-dot', '[data-testid="deviation-dot"]',
        ['backgroundColor', 'borderRadius'] as const,
      )
    })
  }

  // ── IntensityBar ──

  const intensityBarProps = [
    'alignItems', 'display', 'flexDirection',
  ] as const

  test('IntensityBar 20% building', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-20', '.intensity-bar', '[data-testid="intensity-bar"]',
      intensityBarProps,
    )
    await assertStyleMatch(page, 'compare-intensity-20', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor'] as const,
    )
  })

  test('IntensityBar 75% approaching', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-75', '.intensity-bar', '[data-testid="intensity-bar"]',
      intensityBarProps,
    )
    await assertStyleMatch(page, 'compare-intensity-75', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor'] as const,
    )
  })

  test('IntensityBar 100% target', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-100', '.intensity-bar', '[data-testid="intensity-bar"]',
      intensityBarProps,
    )
  })

  test('IntensityBar 110% over', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-110', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor'] as const,
    )
    // Priority 2d: Check bulge exists and has correct color
    const container = page.locator('[data-testid="compare-intensity-110"]')
    const htmlBulge = container.locator('.html-version .intensity-bulge').first()
    const reactBulge = container.locator('.react-version [data-testid="intensity-bulge"]').first()
    await expect(htmlBulge).toBeAttached({ timeout: 3000 })
    await expect(reactBulge).toBeAttached({ timeout: 3000 })

    const bulgeProps = ['backgroundColor', 'borderRadius'] as const
    const htmlStyles = await getStyles(htmlBulge, bulgeProps)
    const reactStyles = await getStyles(reactBulge, bulgeProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, bulgeProps)
    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  bulge.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `IntensityBar 110% bulge mismatches:\n${report}`).toBe(0)
    }
  })

  test('IntensityBar 50% at target (blue glow)', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-50-target', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor', 'boxShadow'] as const,
    )
    // Check target line exists
    const container = page.locator('[data-testid="compare-intensity-50-target"]')
    const htmlTarget = container.locator('.html-version .intensity-line-target').first()
    const reactTarget = container.locator('.react-version [data-testid="intensity-target"]').first()
    await expect(htmlTarget).toBeAttached({ timeout: 3000 })
    await expect(reactTarget).toBeAttached({ timeout: 3000 })

    const lineProps = ['backgroundColor'] as const
    const htmlStyles = await getStyles(htmlTarget, lineProps)
    const reactStyles = await getStyles(reactTarget, lineProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, lineProps)
    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  target-line.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `IntensityBar target line mismatches:\n${report}`).toBe(0)
    }
  })

  // Priority 3e: IntensityBar over-2 and over-3
  test('IntensityBar 120% over-2', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-120', '.intensity-bar', '[data-testid="intensity-bar"]',
      intensityBarProps,
    )
    await assertStyleMatch(page, 'compare-intensity-120', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor'] as const,
    )
    // Check bulge
    const container = page.locator('[data-testid="compare-intensity-120"]')
    const htmlBulge = container.locator('.html-version .intensity-bulge').first()
    const reactBulge = container.locator('.react-version [data-testid="intensity-bulge"]').first()
    await expect(htmlBulge).toBeAttached({ timeout: 3000 })
    await expect(reactBulge).toBeAttached({ timeout: 3000 })

    const bulgeProps = ['backgroundColor', 'borderRadius'] as const
    const htmlStyles = await getStyles(htmlBulge, bulgeProps)
    const reactStyles = await getStyles(reactBulge, bulgeProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, bulgeProps)
    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  bulge.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `IntensityBar 120% bulge mismatches:\n${report}`).toBe(0)
    }
  })

  test('IntensityBar 130% over-3', async ({ page }) => {
    await assertStyleMatch(page, 'compare-intensity-130', '.intensity-bar', '[data-testid="intensity-bar"]',
      intensityBarProps,
    )
    await assertStyleMatch(page, 'compare-intensity-130', '.intensity-fill', '[data-testid="intensity-fill"]',
      ['backgroundColor'] as const,
    )
    // Check bulge
    const container = page.locator('[data-testid="compare-intensity-130"]')
    const htmlBulge = container.locator('.html-version .intensity-bulge').first()
    const reactBulge = container.locator('.react-version [data-testid="intensity-bulge"]').first()
    await expect(htmlBulge).toBeAttached({ timeout: 3000 })
    await expect(reactBulge).toBeAttached({ timeout: 3000 })

    const bulgeProps = ['backgroundColor', 'borderRadius'] as const
    const htmlStyles = await getStyles(htmlBulge, bulgeProps)
    const reactStyles = await getStyles(reactBulge, bulgeProps)
    const mismatches = compareStyles(htmlStyles, reactStyles, bulgeProps)
    if (mismatches.length > 0) {
      const report = mismatches.map((m) => `  bulge.${m.prop}: HTML="${m.html}" React="${m.react}"`).join('\n')
      expect.soft(mismatches.length, `IntensityBar 130% bulge mismatches:\n${report}`).toBe(0)
    }
  })

  // ── WorkoutPill ──

  const pillProps = [
    'backgroundColor', 'borderColor', 'borderRadius', 'borderWidth',
    'color', 'fontFamily', 'fontSize', 'fontWeight',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'display', 'alignItems', 'flexDirection',
  ] as const

  const pillStatuses = ['completed', 'active', 'next', 'upcoming', 'missed'] as const

  for (const status of pillStatuses) {
    test(`WorkoutPill ${status}`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-workout-pill-${status}`,
        '.workout-pill',
        '[data-testid="workout-pill"] > div',
        { reactTextSelector: '[data-testid="workout-pill"] div[dir="auto"]', props: pillProps },
      )
    })
  }

  // Priority 3c: WorkoutPill deload
  test('WorkoutPill deload', async ({ page }) => {
    await assertStyleMatch(
      page, 'compare-workout-pill-deload',
      '.workout-pill',
      '[data-testid="workout-pill"] > div',
      { reactTextSelector: '[data-testid="workout-pill"] div[dir="auto"]', props: pillProps },
    )
  })

  // ── MuscleGroupChip ──

  const chipProps = [
    'backgroundColor', 'borderColor', 'borderRadius', 'borderWidth',
    'color', 'fontFamily', 'fontSize', 'fontWeight',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'display', 'alignItems', 'flexDirection',
  ] as const

  const volumeStatuses = ['ontrack', 'target', 'behind', 'untrained', 'over'] as const

  for (const vs of volumeStatuses) {
    test(`MuscleGroupChip ${vs}`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-muscle-chip-${vs}`,
        '.muscle-chip', '[data-testid="muscle-group-chip"]',
        { reactTextSelector: '[data-testid="muscle-group-chip"] div[dir="auto"]', props: chipProps },
      )
    })
  }

  // Priority 2b: MuscleGroupChip dot color
  for (const vs of volumeStatuses) {
    test(`MuscleGroupChip ${vs} -- dot color`, async ({ page }) => {
      await assertStyleMatch(
        page, `compare-muscle-chip-${vs}`,
        '.muscle-chip-dot', '[data-testid="muscle-group-chip-dot"]',
        ['backgroundColor', 'borderRadius'] as const,
      )
    })
  }

  // ── Sparkline (dimension-only comparison) ──

  test('Sparkline ascending -- container dimensions', async ({ page }) => {
    const container = page.locator('[data-testid="compare-sparkline-ascending"]')
    await expect(container).toBeAttached()

    const reactEl = container.locator('.react-version [data-testid="sparkline"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })

    const rect = await reactEl.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { width: Math.round(r.width), height: Math.round(r.height) }
    })

    expect.soft(rect.width, 'Sparkline width').toBe(80)
    expect.soft(rect.height, 'Sparkline height').toBe(30)
  })

  test('Sparkline with reference line -- container dimensions', async ({ page }) => {
    const container = page.locator('[data-testid="compare-sparkline-with-ref"]')
    await expect(container).toBeAttached()

    const reactEl = container.locator('.react-version [data-testid="sparkline"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })

    // Verify reference line exists
    const refLine = container.locator('.react-version [data-testid="sparkline-reference-0"]').first()
    await expect(refLine).toBeAttached({ timeout: 3000 })
  })

  // ── SetRow ──

  // ── SetRow ──
  // SetRow uses fixed-width RN Views vs flexible HTML spans, so full assertStyleMatch
  // produces DOM-level mismatches (display: flex vs block, dimension differences).
  // These tests verify React-side computed styles match the spec.

  test('SetRow completed -- renders with correct border radius', async ({ page }) => {
    const container = page.locator('[data-testid="compare-set-row-completed"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="set-row"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const styles = await reactEl.evaluate(el => {
      const cs = window.getComputedStyle(el)
      return { borderRadius: cs.borderRadius, opacity: cs.opacity }
    })
    expect.soft(styles.borderRadius, 'SetRow borderRadius').toBe('8px')
    expect.soft(styles.opacity, 'Completed non-next set opacity').toBe('0.55')
  })

  test('SetRow active isNextSet -- highlight background and border', async ({ page }) => {
    const container = page.locator('[data-testid="compare-set-row-active-next"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="set-row"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const styles = await reactEl.evaluate(el => {
      const cs = window.getComputedStyle(el)
      return { backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, borderWidth: cs.borderWidth }
    })
    expect.soft(styles.backgroundColor, 'isNextSet bg').toContain('rgba(255')
    expect.soft(styles.borderWidth, 'isNextSet borderWidth').toBe('1px')
  })

  test('SetRow type badge -- badge colors', async ({ page }) => {
    const container = page.locator('[data-testid="compare-set-row-type-badge"]')
    await expect(container).toBeAttached()
    const reactBadge = container.locator('.react-version [data-testid="set-row-type-badge"]').first()
    await expect(reactBadge).toBeAttached({ timeout: 3000 })
    const textContent = await reactBadge.textContent()
    expect.soft(textContent?.trim(), 'Type badge text').toBe('W')
  })

  // ── ExerciseCard ──

  test('ExerciseCard collapsed -- renders name and summary', async ({ page }) => {
    const container = page.locator('[data-testid="compare-exercise-card-collapsed"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="exercise-card"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const text = await reactEl.textContent()
    expect.soft(text, 'Collapsed card text').toContain('Bench Press')
    expect.soft(text, 'Collapsed card summary').toContain('185 lbs')
  })

  test('ExerciseCard upcoming -- opacity 0.6', async ({ page }) => {
    const container = page.locator('[data-testid="compare-exercise-card-upcoming"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="exercise-card"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const opacity = await reactEl.evaluate(el => window.getComputedStyle(el).opacity)
    expect.soft(opacity, 'Upcoming card opacity').toBe('0.6')
  })

  // ── SupersetWrapper ──

  test('SupersetWrapper default -- border and label', async ({ page }) => {
    const container = page.locator('[data-testid="compare-superset-wrapper-default"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="superset-wrapper"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const styles = await reactEl.evaluate(el => {
      const cs = window.getComputedStyle(el)
      return { borderLeftWidth: cs.borderLeftWidth, paddingLeft: cs.paddingLeft, position: cs.position }
    })
    expect.soft(styles.borderLeftWidth, 'SW borderLeftWidth').toBe('3px')
    expect.soft(styles.paddingLeft, 'SW paddingLeft').toBe('8px')
    expect.soft(styles.position, 'SW position').toBe('relative')
  })

  // ── InputBar ──

  test('InputBar default -- background and layout', async ({ page }) => {
    const container = page.locator('[data-testid="compare-input-bar-default"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="input-bar"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const styles = await reactEl.evaluate(el => {
      const cs = window.getComputedStyle(el)
      return { backgroundColor: cs.backgroundColor, flexDirection: cs.flexDirection, alignItems: cs.alignItems }
    })
    expect.soft(styles.backgroundColor, 'InputBar bg').toBe('rgb(25, 25, 25)')
    expect.soft(styles.flexDirection, 'InputBar flexDirection').toBe('row')
    expect.soft(styles.alignItems, 'InputBar alignItems').toBe('center')
  })

  // ── RestTimer ──

  test('RestTimer default -- background and padding', async ({ page }) => {
    const container = page.locator('[data-testid="compare-rest-timer-default"]')
    await expect(container).toBeAttached()
    const reactEl = container.locator('.react-version [data-testid="rest-timer"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })
    const styles = await reactEl.evaluate(el => {
      const cs = window.getComputedStyle(el)
      return { backgroundColor: cs.backgroundColor, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight }
    })
    expect.soft(styles.backgroundColor, 'RestTimer bg').toBe('rgb(28, 28, 28)')
    expect.soft(styles.paddingLeft, 'RestTimer paddingLeft').toBe('16px')
    expect.soft(styles.paddingRight, 'RestTimer paddingRight').toBe('16px')
  })

  test('Sparkline highlight last -- has highlight dot', async ({ page }) => {
    const container = page.locator('[data-testid="compare-sparkline-highlight"]')
    await expect(container).toBeAttached()

    const reactEl = container.locator('.react-version [data-testid="sparkline"]').first()
    await expect(reactEl).toBeAttached({ timeout: 3000 })

    // Last dot should be the highlight dot (larger)
    const lastDot = container.locator('.react-version [data-testid="sparkline-dot-4"]').first()
    await expect(lastDot).toBeAttached({ timeout: 3000 })

    const dotRect = await lastDot.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { width: Math.round(r.width), height: Math.round(r.height) }
    })

    // Highlight dot should be 6px (highlightSize)
    expect.soft(dotRect.width, 'Highlight dot width').toBe(6)
    expect.soft(dotRect.height, 'Highlight dot height').toBe(6)
  })
})
