import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GhostBand, BAND_H, type GhostBandProps } from './GhostBand'
import { PHASE_AXIS_COLOR, PHASE_AXIS_BASE_COLOR } from './fatigue-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import type { PhaseSegment } from './fatigue-model'

const t = getSemanticColors('dark')

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
/** Per-run BASE rects — these carry the run's true geometry (full width). */
const basesOf = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[data-testid="ghost-band-base"]')).map(geom)
/** Per-run FILL rects — width is the share of the run earned against target. */
const fillsOf = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[data-testid="ghost-band-fill"]')).map(geom)
const labelsOf = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('text')).map((n) => ({
    text: n.textContent,
    fill: n.getAttribute('fill'),
  }))

/** A rep whose phases each run EXACTLY their prescribed duration. */
const onPace: PhaseSegment[] = [
  { phase: 'eccentric', startMs: 0, endMs: 2600 },
  { phase: 'hold', startMs: 2600, endMs: 3000 },
  { phase: 'concentric', startMs: 3000, endMs: 3950 },
]
const TEMPO: [number, number, number, number] = [2.6, 0.4, 0.95, 0.28]

describe('GhostBand', () => {
  it('draws a contiguous strip — each run butts against the next with no gap', () => {
    const runs = basesOf(band())
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
    expect(fillsOf(band()).map((r) => r.fill)).toEqual([
      PHASE_AXIS_COLOR.eccentric,
      PHASE_AXIS_COLOR.idle,
      PHASE_AXIS_COLOR.concentric,
    ])
  })

  it('renders nothing when every run is zero-width', () => {
    const c = band([{ phase: 'idle', startMs: 500, endMs: 500 }])
    expect(c.querySelectorAll('rect')).toHaveLength(0)
  })

  it('separates a hold from idle by VALUE, so a narrow hold still reads as a hold', () => {
    const runs = fillsOf(
      band([
        { phase: 'eccentric', startMs: 0, endMs: 1000 },
        { phase: 'hold', startMs: 1000, endMs: 1500 },
        { phase: 'concentric', startMs: 1500, endMs: 3000 },
      ])
    )
    expect(runs[1].fill).toBe(PHASE_AXIS_COLOR.hold)
    expect(runs[1].fill).not.toBe(PHASE_AXIS_COLOR.idle)
    // A filled hold sits BRIGHTER than idle, an unfilled one darker — never the same.
    expect(PHASE_AXIS_COLOR.hold).not.toBe(PHASE_AXIS_BASE_COLOR.hold)
    expect(PHASE_AXIS_BASE_COLOR.hold).not.toBe(PHASE_AXIS_COLOR.idle)
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
    expect(labelsOf(c).map((l) => l.text)).toEqual(['ECC', 'HOLD', 'CON'])
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
    const labels = labelsOf(c).map((l) => l.text)
    expect(labels).not.toContain('HOLD')
    expect(labels).toEqual(['ECC', 'CON'])
  })

  it('never labels idle — dead time has no name', () => {
    expect(labelsOf(band(segments, { showLabels: true })).map((l) => l.text)).toEqual([
      'ECC',
      'CON',
    ])
  })

  it('rounds the band once, as a clip — never per run', () => {
    const c = band()
    expect(c.querySelector('clipPath rect')?.getAttribute('rx')).toBe('2')
    const runRects = Array.from(c.querySelectorAll('g[clip-path] > g > rect'))
    expect(runRects.every((r) => r.getAttribute('rx') == null)).toBe(true)
  })

  // --- pacing -----------------------------------------------------------------

  it('fills every run completely when no tempo is prescribed', () => {
    const bases = basesOf(band())
    fillsOf(band()).forEach((f, i) => expect(f.width).toBeCloseTo(bases[i].width, 5))
  })

  it('leaves the geometry alone when pacing turns on — only the FILL changes', () => {
    const flat = basesOf(band(onPace))
    const paced = basesOf(band(onPace, { targetTempoSeconds: TEMPO }))
    expect(paced).toEqual(flat)
  })

  it('fills a run that hit its target to the brim', () => {
    const c = band(onPace, { targetTempoSeconds: TEMPO })
    const bases = basesOf(c)
    fillsOf(c).forEach((f, i) => expect(f.width).toBeCloseTo(bases[i].width, 5))
  })

  it('leaves a FAST phase partly unfilled — the base shows through', () => {
    // A 1.3 s eccentric against a 2.6 s target is exactly half paced.
    const fast: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 1300 }]
    const c = band(fast, { targetTempoSeconds: TEMPO })
    expect(fillsOf(c)[0].width).toBeCloseTo(basesOf(c)[0].width * 0.5, 5)
  })

  it('CAPS a slow phase at its own run width rather than overflowing', () => {
    const slow: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 9000 }]
    const c = band(slow, { targetTempoSeconds: TEMPO })
    expect(fillsOf(c)[0].width).toBeCloseTo(basesOf(c)[0].width, 5)
  })

  it('paints the muted base UNDER the fill so an unfilled remainder is still band', () => {
    const fast: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 1300 }]
    const c = band(fast, { targetTempoSeconds: TEMPO })
    expect(basesOf(c)[0].fill).toBe(PHASE_AXIS_BASE_COLOR.eccentric)
    expect(fillsOf(c)[0].fill).toBe(PHASE_AXIS_COLOR.eccentric)
  })

  it('tones each label by its own pacing — ahead warns, on-pace succeeds, over errors', () => {
    const mixed: PhaseSegment[] = [
      { phase: 'eccentric', startMs: 0, endMs: 1000 }, // 1.0s vs 2.6s → ahead
      { phase: 'concentric', startMs: 1000, endMs: 1950 }, // 0.95s vs 0.95s → on pace
      { phase: 'hold', startMs: 1950, endMs: 3950 }, // 2.0s vs 0.28s → over
    ]
    const c = band(mixed, { targetTempoSeconds: TEMPO, showLabels: true })
    expect(labelsOf(c)).toEqual([
      { text: 'ECC', fill: t['status-warning'] },
      { text: 'CON', fill: t['status-success'] },
      { text: 'HOLD', fill: t['status-error'] },
    ])
  })

  it('keeps labels plain when nothing is prescribed to pace against', () => {
    const c = band(onPace, { showLabels: true })
    expect(labelsOf(c).every((l) => l.fill === t['text-primary'])).toBe(true)
  })

  // --- the well ---------------------------------------------------------------

  it('recesses every run, so an unearned remainder reads as empty channel', () => {
    const c = band(onPace, { targetTempoSeconds: TEMPO })
    expect(c.querySelectorAll('[data-testid="ghost-band-well"]')).toHaveLength(onPace.length)
  })

  it('sits the well UNDER the fill — a filled run hides its own recess', () => {
    const c = band(onPace, { targetTempoSeconds: TEMPO })
    const order = Array.from(c.querySelectorAll('g[clip-path] > g > rect')).map((r) =>
      r.getAttribute('data-testid')
    )
    expect(order.slice(0, 3)).toEqual(['ghost-band-base', 'ghost-band-well', 'ghost-band-fill'])
  })

  it('spans the well across the whole run, not just the unfilled part', () => {
    // Recessing only the exposed remainder would step in tone at the fill's edge.
    const fast: PhaseSegment[] = [{ phase: 'eccentric', startMs: 0, endMs: 1300 }]
    const c = band(fast, { targetTempoSeconds: TEMPO })
    const well = geom(c.querySelector('[data-testid="ghost-band-well"]')!)
    expect(well.width).toBeCloseTo(basesOf(c)[0].width, 5)
  })
})
