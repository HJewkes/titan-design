import { describe, it, expect } from 'vitest'
import {
  ELEVATION_PLANE,
  FLOATING_ELEVATION_MIN,
  getElevationShadow,
  getElevationSurface,
  getGlowShadow,
  getPressedRecessShadow,
  type ElevationLevel,
} from './elevation'
import { getSemanticColors } from './tokens/semantic'
import { surfaceBackground, PLANE_ORDER } from './surface-planes'

const web = (style: object) => style as { boxShadow?: string }

describe('getGlowShadow', () => {
  it('returns shadow style for valid hex color', () => {
    const style = getGlowShadow('#FF7900', 'medium')
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('returns empty object for invalid color', () => {
    expect(getGlowShadow('not-a-color')).toEqual({})
  })

  it('scales intensity across levels', () => {
    expect(getGlowShadow('#FF7900', 'subtle')).not.toEqual(getGlowShadow('#FF7900', 'strong'))
  })

  it('defaults to medium intensity', () => {
    expect(getGlowShadow('#FF7900')).toEqual(getGlowShadow('#FF7900', 'medium'))
  })
})

describe('elevation resolves to the grey ramp', () => {
  const LEVELS: ElevationLevel[] = [-2, -1, 0, 1, 2, 3, 4, 5]
  const dark = getSemanticColors('dark')
  const rampHexes = new Set(PLANE_ORDER.map((plane) => surfaceBackground(plane, 'dark')))

  it('every level paints a plane that is on the ramp, never a derived colour', () => {
    for (const level of LEVELS) {
      const hex = getElevationSurface(level, 'dark')
      expect(rampHexes.has(hex), `level ${level} → ${hex}`).toBe(true)
    }
  })

  it('reads the page plane at 0 and climbs one plane per content level', () => {
    expect(getElevationSurface(0, 'dark')).toBe(dark['surface-base'])
    expect(getElevationSurface(1, 'dark')).toBe(dark['surface-elevated'])
    expect(getElevationSurface(2, 'dark')).toBe(dark['surface-raised'])
    expect(getElevationSurface(3, 'dark')).toBe(dark['surface-overlay'])
  })

  it('floating levels share the overlay plane: past the ramp, the shadow separates', () => {
    expect(ELEVATION_PLANE[4]).toBe('overlay')
    expect(ELEVATION_PLANE[5]).toBe('overlay')
    expect(FLOATING_ELEVATION_MIN).toBe(4)
  })

  it('steps down the ramp below zero', () => {
    expect(getElevationSurface(-1, 'dark')).toBe(dark['background-base'])
    expect(getElevationSurface(-2, 'dark')).toBe(dark['background-frame'])
  })
})

describe('elevation treatment: recess below, nothing at 0, lift above', () => {
  it('wears no treatment at level 0', () => {
    expect(getElevationShadow(0, 'dark')).toEqual({})
  })

  it('lifts every content level with a top rim-light AND an ambient shadow', () => {
    for (const level of [1, 2, 3] as const) {
      const shadow = web(getElevationShadow(level, 'dark')).boxShadow ?? ''
      expect(shadow, `level ${level} rim`).toContain('inset 0 1px 0 rgba(255,255,255,0.20)')
      expect(shadow.split(', ').filter((layer) => !layer.startsWith('inset')).length).toBeGreaterThan(0)
    }
  })

  it('grows the ambient shadow with each content level', () => {
    const reach = (level: ElevationLevel) => {
      const layers = web(getElevationShadow(level, 'dark')).boxShadow!.split(', ')
      return Math.max(...layers.map((l) => Number(/0 (\d+)px/.exec(l)?.[1] ?? 0)))
    }
    expect(reach(1)).toBeLessThan(reach(2))
    expect(reach(2)).toBeLessThan(reach(3))
    expect(reach(3)).toBeLessThan(reach(4))
    expect(reach(4)).toBeLessThan(reach(5))
  })

  it('floats without a hairline ring: lift is rim + shadow only', () => {
    const style = getElevationShadow(4, 'dark') as Record<string, unknown>
    expect(style.borderWidth).toBeUndefined()
    expect(style.borderColor).toBeUndefined()
  })

  it('lets a caller drop the rim for a specimen', () => {
    expect(web(getElevationShadow(2, 'dark', { rim: 0 })).boxShadow).not.toContain('inset')
  })

  it('recesses inset levels with the insetWell cut, not a cast shadow', () => {
    for (const level of [-1, -2] as const) {
      const shadow = web(getElevationShadow(level, 'dark')).boxShadow ?? ''
      expect(shadow, `level ${level}`).toContain('inset 0 2px 6px')
      expect(shadow, `level ${level}`).toContain('inset 0 -1px 0')
    }
  })

  it('getPressedRecessShadow returns the same cut for a given fill', () => {
    expect(web(getPressedRecessShadow('#1C1916', 'dark')).boxShadow).toContain('inset')
  })
})
