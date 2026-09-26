/**
 * jsdom has no layout, so a stub ResizeObserver reports the overlay and `offsetWidth` says how
 * wide it is; the overlay then places its labels as it does in a browser.
 */
import { act, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { VelocityBandChart } from './VelocityBandChart'
import { BAND_LABEL_METRICS } from './velocityBandLabels'
import { TIER_B_TWO_GUARDS } from './velocityBandScale-fixture'

let report: ((entries: { target: Element }[]) => void) | null = null

class StubResizeObserver {
  constructor(callback: (entries: { target: Element }[]) => void) {
    report = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 600,
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth')
})

const HEIGHT = 200
/** SetBarChart's value-label row (16 px) plus its gap to the peak bar (3 px). */
const VALUE_LABEL_ROW = 19

async function renderMeasured(props: { showValueLabels?: boolean; orientation?: 'up' | 'down' }) {
  render(
    <VelocityBandChart
      velocities={TIER_B_TWO_GUARDS.velocities}
      scale={TIER_B_TWO_GUARDS.scale}
      height={HEIGHT}
      formatValue={(v) => String(v)}
      accessibilityLabel="set"
      {...props}
    />
  )
  await act(async () => {
    report?.([{ target: screen.getByTestId('velocity-band-overlay') }])
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
  return screen.getAllByTestId(/^band-label-/)
}

/** How many ancestors (and the node itself) mirror it vertically. */
function flipsAbove(node: HTMLElement): number {
  let flips = 0
  for (let el: HTMLElement | null = node; el; el = el.parentElement) {
    if (el.style.transform.includes('scaleY(-1)')) flips++
  }
  return flips
}

describe('VelocityBandChart with value labels (functional gate S6)', () => {
  it('keeps every band label below the value-label row', async () => {
    const labels = await renderMeasured({ showValueLabels: true })
    const plotHeight = HEIGHT - VALUE_LABEL_ROW

    expect(screen.getAllByTestId(/^setbar-label-/).length).toBeGreaterThan(0)
    expect(screen.getByTestId('velocity-band-overlay').style.height).toBe(`${plotHeight}px`)
    expect(labels.map((l) => l.getAttribute('data-testid'))).toContain('band-label-zone')
    for (const label of labels) {
      const top = parseFloat(label.style.bottom) + BAND_LABEL_METRICS.height
      expect(top).toBeLessThanOrEqual(plotHeight)
    }
  })
})

describe('VelocityBandChart facing down', () => {
  it('mirrors the bars and keeps every band label upright', async () => {
    const labels = await renderMeasured({ orientation: 'down' })

    expect(flipsAbove(screen.getByTestId('setbar-bar-0'))).toBe(1)
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) expect(flipsAbove(label) % 2).toBe(0)
  })
})
