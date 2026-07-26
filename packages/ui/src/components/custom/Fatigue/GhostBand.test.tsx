import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GhostBand, BAND_H } from './GhostBand'
import { PHASE_AXIS_COLOR } from './fatigue-tokens'
import type { PhaseSegment } from './fatigue-model'

/** Phase runs with SEAMS between them — the shape the sample-derived model actually produces. */
const segments: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 1182 },
  { phase: 'idle', startMs: 1273, endMs: 1600 },
  { phase: 'concentric', startMs: 1691, endMs: 3545 },
]

const x = (ms: number) => 12 + (ms / 4000) * 300

const band = (segs: PhaseSegment[] = segments) =>
  render(
    <svg>
      <GhostBand segments={segs} x={x} top={0} height={BAND_H} />
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

  it('rounds the band once, as a clip — never per run', () => {
    const c = band()
    expect(c.querySelector('clipPath rect')?.getAttribute('rx')).toBe('2')
    const runRects = Array.from(c.querySelectorAll('g[clip-path] > g > rect'))
    expect(runRects.every((r) => r.getAttribute('rx') == null)).toBe(true)
  })
})
