import { describe, it, expect } from 'vitest'
import {
  phaseFillFraction,
  pacingTone,
  phaseTargetsMs,
  prescribedSegments,
  ON_TARGET_MS,
} from './tempo-pacing'
import {
  PACING_TONE,
  PACING_TONE_MIN_CONTRAST,
  PHASE_AXIS_COLOR,
  PHASE_AXIS_BASE_COLOR,
} from './fatigue-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { primitiveRamps } from '../../../theme/tokens/primitives'
import type { SamplePhase } from './fatigue-model'

const t = getSemanticColors('dark')
const TEMPO: [number, number, number, number] = [2.6, 0.4, 0.95, 0.28]

/** WCAG 2.1 relative luminance / contrast ratio. */
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const h = hex.replace('#', '')
    const chan = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2]
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('phaseFillFraction', () => {
  it('is the elapsed share of the target', () => {
    expect(phaseFillFraction(500, 1000)).toBeCloseTo(0.5, 5)
  })

  it('CAPS at full so an over-long phase does not overflow its run', () => {
    expect(phaseFillFraction(4000, 1000)).toBe(1)
  })

  it('reads complete when there is no target to pace against', () => {
    expect(phaseFillFraction(500, null)).toBe(1)
    expect(phaseFillFraction(500, 0)).toBe(1)
  })
})

describe('pacingTone', () => {
  it('reads AHEAD while still short of target', () => {
    expect(pacingTone(500, 2000)).toBe(PACING_TONE.ahead)
  })

  it('reads ON PACE within the on-target window either side', () => {
    expect(pacingTone(2000, 2000)).toBe(PACING_TONE.onPace)
    expect(pacingTone(2000 - ON_TARGET_MS, 2000)).toBe(PACING_TONE.onPace)
    expect(pacingTone(2000 + ON_TARGET_MS, 2000)).toBe(PACING_TONE.onPace)
  })

  it('reads OVER once past the window', () => {
    expect(pacingTone(2000 + ON_TARGET_MS + 1, 2000)).toBe(PACING_TONE.over)
  })

  it('stays neutral with no target', () => {
    expect(pacingTone(500, null)).toBe(t['text-primary'])
  })
})

describe('pacing tone legibility', () => {
  // Only ECC and CON are labelled, so only those runs can put a colour behind a pacing
  // tone — each over its fill and its muted base. `GhostBand.test.tsx` pins the fact that
  // hold and idle stay unlabelled, which is what keeps this narrower set honest.
  const LABELLED: SamplePhase[] = ['eccentric', 'concentric']
  const backgrounds = LABELLED.flatMap((p) => [
    [`${p} fill`, PHASE_AXIS_COLOR[p]] as const,
    [`${p} base`, PHASE_AXIS_BASE_COLOR[p]] as const,
  ])

  for (const [toneName, tone] of Object.entries(PACING_TONE)) {
    it(`keeps '${toneName}' legible on every background a label can sit on`, () => {
      for (const [bgName, bg] of backgrounds) {
        const ratio = contrastRatio(tone, bg)
        expect(
          ratio,
          `${toneName} (${tone}) on ${bgName} (${bg}) = ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(PACING_TONE_MIN_CONTRAST)
      }
    })
  }

  it('rejects the status-error token the band used to borrow', () => {
    // Proves the guard has teeth rather than passing by luck: red[600] on the concentric
    // fill is 2.18:1, which is what made the label unreadable in the first place.
    expect(contrastRatio(t['status-error'], PHASE_AXIS_COLOR.concentric)).toBeLessThan(
      PACING_TONE_MIN_CONTRAST
    )
  })

  it('sits at the DEEPEST ramp step that still clears the floor', () => {
    // Guards the other direction — the tones should be as saturated as legibility allows,
    // so a "make it lighter" edit has to justify itself. Derived from the ramp rather than
    // hardcoded, so it catches a change in EITHER direction.
    const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const
    const worstOf = (c: string): number =>
      Math.min(...backgrounds.map(([, bg]) => contrastRatio(c, bg)))

    const cases = [
      ['ahead', PACING_TONE.ahead, primitiveRamps.amber],
      ['onPace', PACING_TONE.onPace, primitiveRamps.green],
      ['over', PACING_TONE.over, primitiveRamps.red],
    ] as const

    for (const [name, configured, ramp] of cases) {
      const deepestPassing = STEPS.filter((s) => worstOf(ramp[s]) >= PACING_TONE_MIN_CONTRAST).pop()
      expect(
        configured,
        `${name}: deepest step clearing ${PACING_TONE_MIN_CONTRAST}:1 is ${deepestPassing}`
      ).toBe(ramp[deepestPassing!])
    }
  })
})

describe('prescribedSegments', () => {
  it('lays the prescribed rep out end to end at its target durations', () => {
    expect(prescribedSegments(TEMPO)).toEqual([
      { phase: 'eccentric', startMs: 0, endMs: 2600 },
      { phase: 'hold', startMs: 2600, endMs: 3000 },
      { phase: 'concentric', startMs: 3000, endMs: 3950 },
      { phase: 'hold', startMs: 3950, endMs: 4230 },
    ])
  })

  it('drops zero-length phases rather than drawing slivers', () => {
    const noHolds = prescribedSegments([3, 0, 2, 0])
    expect(noHolds.map((s) => s.phase)).toEqual(['eccentric', 'concentric'])
    // The concentric still starts where the eccentric ended — no gap from the dropped hold.
    expect(noHolds[1].startMs).toBe(noHolds[0].endMs)
  })

  it('has nothing to describe without a prescription', () => {
    expect(prescribedSegments(null)).toEqual([])
  })

  it('round-trips against phaseTargetsMs — every run matches its own target', () => {
    const segs = prescribedSegments(TEMPO)
    const targets = phaseTargetsMs(
      segs.map((s) => s.phase),
      TEMPO
    )
    segs.forEach((s, i) => expect(s.endMs - s.startMs).toBe(targets[i]))
  })
})

describe('phaseTargetsMs', () => {
  it('maps a hold to BOTTOM before the concentric and TOP after it', () => {
    const phases: SamplePhase[] = ['eccentric', 'hold', 'concentric', 'hold']
    expect(phaseTargetsMs(phases, TEMPO)).toEqual([2600, 400, 950, 280])
  })

  it('gives idle no target — dead time never paces', () => {
    const phases: SamplePhase[] = ['eccentric', 'idle', 'concentric']
    expect(phaseTargetsMs(phases, TEMPO)[1]).toBeNull()
  })

  it('targets nothing at all when no tempo is prescribed', () => {
    const phases: SamplePhase[] = ['eccentric', 'hold', 'concentric']
    expect(phaseTargetsMs(phases, null)).toEqual([null, null, null])
  })

  it('treats a rep that opens on the concentric as having a TOP hold after it', () => {
    const phases: SamplePhase[] = ['concentric', 'hold']
    expect(phaseTargetsMs(phases, TEMPO)).toEqual([950, 280])
  })
})
