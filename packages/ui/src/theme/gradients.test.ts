import { describe, it, expect } from 'vitest'
import { linearGradient, linearGradientStops, surfaceGradient } from './gradients'
import { getSemanticColors } from './tokens/semantic'

describe('gradients', () => {
  it('builds a linear-gradient backgroundImage from two tokens (web CSS vars)', () => {
    const style = linearGradient('surface-elevated', 'background-base', 180)
    expect(style.backgroundImage).toBe(
      'linear-gradient(180deg, var(--color-surface-elevated), var(--color-background-base))'
    )
  })

  it('respects a custom angle', () => {
    expect(linearGradient('surface-base', 'background-base', 90).backgroundImage).toContain('90deg')
  })

  it('defaults to a 180deg angle', () => {
    expect(linearGradient('surface-base', 'background-base').backgroundImage).toContain('180deg')
  })

  it('surfaceGradient.chrome is the elevated → base chrome wash', () => {
    expect(surfaceGradient.chrome().backgroundImage).toBe(
      'linear-gradient(180deg, var(--color-surface-elevated), var(--color-background-base))'
    )
  })

  it('surfaceGradient.volumeTrack ramps info → success → error left to right', () => {
    expect(surfaceGradient.volumeTrack().backgroundImage).toBe(
      'linear-gradient(90deg, var(--color-status-info), var(--color-status-success), var(--color-status-error))'
    )
  })

  it('surfaceGradient.volumeTrack resolves against the requested mode', () => {
    expect(surfaceGradient.volumeTrack('light').backgroundImage).toContain('90deg')
  })

  it('surfaceGradient.card is elevated → raised at 135deg', () => {
    expect(surfaceGradient.card().backgroundImage).toBe(
      'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface-raised) 100%)'
    )
  })

  it('surfaceGradient.statusTrack ramps success → warning → error at 25% alpha', () => {
    expect(surfaceGradient.statusTrack().backgroundImage).toBe(
      'linear-gradient(90deg, rgba(46, 213, 115, 0.25) 0%, rgba(249, 180, 21, 0.25) 50%, rgba(209, 67, 67, 0.25) 100%)'
    )
  })

  it('surfaceGradient.deviationTrack ramps success → neutral → warning', () => {
    expect(surfaceGradient.deviationTrack().backgroundImage).toBe(
      'linear-gradient(90deg, rgba(46, 213, 115, 0.25) 0%, rgba(162, 159, 157, 0.15) 50%, rgba(249, 180, 21, 0.25) 100%)'
    )
  })

  describe('{ token, alpha } stops', () => {
    it('prints rgba for the alpha stop and positions on a mixed list', () => {
      expect(
        linearGradientStops([{ token: 'status-success', alpha: 0.25 }, 'status-error'], 90)
          .backgroundImage
      ).toBe('linear-gradient(90deg, rgba(46, 213, 115, 0.25) 0%, var(--color-status-error) 100%)')
    })

    it('resolves the alpha stop against the requested mode', () => {
      const stops = [{ token: 'result-neutral' as const, alpha: 0.15 }, 'status-error' as const]
      const dark = linearGradientStops(stops, 90, 'dark').backgroundImage
      const light = linearGradientStops(stops, 90, 'light').backgroundImage
      const { r, g, b } = hexToRgbOf(getSemanticColors('light')['result-neutral'])
      expect(light).toContain(`rgba(${r}, ${g}, ${b}, 0.15) 0%`)
      expect(light).not.toBe(dark)
    })

    it('clamps alpha to 0..1', () => {
      expect(
        linearGradientStops([{ token: 'status-success', alpha: 2 }, 'status-error']).backgroundImage
      ).toContain(', 1) 0%')
    })
  })
})

function hexToRgbOf(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
