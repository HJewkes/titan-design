import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GhostBand, BAND_H, type GhostBandProps } from './GhostBand'
import { PHASE_AXIS_COLOR } from './fatigue-tokens'
import type { PhaseSegment } from './fatigue-model'

/** Phase runs with SEAMS between them — the shape the sample-derived model actually produces. */
const segments: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 1182 },
  { phase: 'idle', startMs: 1273, endMs: 1600 },
  { phase: 'concentric', startMs: 1691, endMs: 3545 },
]

const x = (ms: number) => 12 + (ms / 4000) * 300

const band = (segs: PhaseSegment[] = segments, props: Partial<GhostBandProps> = {}) =>
  render(
    <svg>
      <GhostBand segments={segs} x={x} top={0} height={BAND_H} {...props} />
    </svg>
  ).container

const geom = (r: Element) => ({
  x: Number(r.getAttribute('x')),
  width: Number(r.getAttribute('width')),
  fill: r.getAttribute('fill'),
})

/** The strip floor — the one rect sitting directly in the clipped group. */
const floorOf = (c: HTMLElement) => geom(c.querySelector('g[clip-path] > rect')!)
/** The phase runs — one rect per run, each in its own group. */
const runsOf = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('g[clip-path] > g > rect')).map(geom)

describe('GhostBand', () => {
  it('draws a contiguous strip — each run butts against the next with no gap', () => {
    const runs = runsOf(band())
    runs.forEach((r, i) => {
      const next = runs[i + 1]
      if (next) expect(r.x + r.width).toBeCloseTo(next.x, 5)
    })
  })

  it('floors the whole rep with the idle tone so a pause reads as band, not a hole', () => {
    const floor = floorOf(band())
    expect(floor.fill).toBe(PHASE_AXIS_COLOR.idle)
    expect(floor.x).toBeCloseTo(x(0), 5)
    expect(floor.x + floor.width).toBeCloseTo(x(3545), 5)
  })

  it('paints the pause run in the idle tone', () => {
    const runs = runsOf(band())
    expect(runs.map((r) => r.fill)).toEqual([
      PHASE_AXIS_COLOR.eccentric,
      PHASE_AXIS_COLOR.idle,
      PHASE_AXIS_COLOR.concentric,
    ])
  })

  it('renders nothing when every run is zero-width', () => {
    const c = band([{ phase: 'idle', startMs: 500, endMs: 500 }])
    expect(c.querySelectorAll('rect')).toHaveLength(0)
  })

  it('paints a hold in the amber hold tone — a deliberate hold is not idle dead time', () => {
    const runs = runsOf(
      band([
        { phase: 'eccentric', startMs: 0, endMs: 1000 },
        { phase: 'hold', startMs: 1000, endMs: 1500 },
        { phase: 'concentric', startMs: 1500, endMs: 3000 },
      ])
    )
    expect(runs[1].fill).toBe(PHASE_AXIS_COLOR.hold)
    expect(runs[1].fill).not.toBe(PHASE_AXIS_COLOR.idle)
  })

  it('labels a hold run wide enough to hold the word', () => {
    const c = band(
      [
        { phase: 'eccentric', startMs: 0, endMs: 1000 },
        { phase: 'hold', startMs: 1000, endMs: 1500 },
        { phase: 'concentric', startMs: 1500, endMs: 3000 },
      ],
      { showLabels: true }
    )
    expect(Array.from(c.querySelectorAll('text')).map((t) => t.textContent)).toEqual([
      'ECC',
      'HOLD',
      'CON',
    ])
  })

  it('DROPS a label that will not fit rather than clipping it', () => {
    // A 300 ms hold is ~22 px here — over the old flat 20 px floor, which rendered a
    // 'HOLD' that ran past its own run and clipped to 'HOL'.
    const c = band(
      [
        { phase: 'eccentric', startMs: 0, endMs: 1000 },
        { phase: 'hold', startMs: 1000, endMs: 1300 },
        { phase: 'concentric', startMs: 1300, endMs: 3000 },
      ],
      { showLabels: true }
    )
    const labels = Array.from(c.querySelectorAll('text')).map((t) => t.textContent)
    expect(labels).not.toContain('HOLD')
    expect(labels).toEqual(['ECC', 'CON'])
  })

  it('never labels idle — dead time has no name', () => {
    const c = band(segments, { showLabels: true })
    expect(Array.from(c.querySelectorAll('text')).map((t) => t.textContent)).toEqual(['ECC', 'CON'])
  })

  it('draws NO progress ramp by default', () => {
    expect(band().querySelector('[data-testid="ghost-band-ramp"]')).toBeNull()
  })

  it('ramps ONCE across the whole band — a per-run ramp would step dark at every seam', () => {
    const c = band(segments, { progressRamp: true })
    const ramps = c.querySelectorAll('[data-testid="ghost-band-ramp"]')
    expect(ramps).toHaveLength(1)
    // Spans the full strip, so no interior boundary can restart the gradient.
    const floor = floorOf(c)
    expect(geom(ramps[0]).x).toBeCloseTo(floor.x, 5)
    expect(geom(ramps[0]).width).toBeCloseTo(floor.width, 5)
    expect(c.querySelectorAll('linearGradient')).toHaveLength(1)
  })

  it('rounds the band once, as a clip — never per run', () => {
    const c = band()
    expect(c.querySelector('clipPath rect')?.getAttribute('rx')).toBe('2')
    const runRects = Array.from(c.querySelectorAll('g[clip-path] > g > rect'))
    expect(runRects.every((r) => r.getAttribute('rx') == null)).toBe(true)
  })
})
