import { describe, it, expect } from 'vitest'
import { phaseFillFraction, pacingTone, phaseTargetsMs, ON_TARGET_MS } from './tempo-pacing'
import {
  PACING_TONE,
  PACING_TONE_MIN_CONTRAST,
  PHASE_AXIS_COLOR,
  PHASE_AXIS_BASE_COLOR,
} from './fatigue-tokens'
import { getSemanticColors } from '../../../theme/tokens/semantic'
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
  // The label sits INSIDE the band, so every phase fill AND every muted base is a possible
  // backdrop. `status-error` (red[600]) measured 1.88:1 on the hold fill — this is the guard
  // that stopped that shipping, and that stops a ramp edit reintroducing it.
  const backgrounds = Object.entries({ ...PHASE_AXIS_COLOR, ...PHASE_AXIS_BASE_COLOR })

  for (const [toneName, tone] of Object.entries(PACING_TONE)) {
    it(`keeps '${toneName}' legible on every band background`, () => {
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
    // Proves the guard above has teeth rather than passing by luck.
    expect(contrastRatio(t['status-error'], PHASE_AXIS_COLOR.hold)).toBeLessThan(
      PACING_TONE_MIN_CONTRAST
    )
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
