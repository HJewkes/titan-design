import { describe, it, expect } from 'vitest'
import { paceTone, paceToneColor } from './paceTone'

describe('paceTone', () => {
  it('reads as neutral when there is no target', () => {
    expect(paceTone(0.6)).toBe('neutral')
    expect(paceTone(0)).toBe('neutral')
  })

  it('reads as ahead when progress equals the target (inclusive)', () => {
    expect(paceTone(0.5, 0.5)).toBe('ahead')
  })

  it('reads as ahead when progress is past the target', () => {
    expect(paceTone(0.8, 0.5)).toBe('ahead')
  })

  it('reads as behind when progress trails the target', () => {
    expect(paceTone(0.3, 0.5)).toBe('behind')
  })

  describe('paceToneColor', () => {
    it('maps each tone to its real titan literal hex', () => {
      expect(paceToneColor('ahead', 'dark')).toBe('#2ED573') // status-success (green 300)
      expect(paceToneColor('behind', 'dark')).toBe('#F9B415') // status-warning (amber 300)
      expect(paceToneColor('neutral', 'dark')).toBe('#01B5D1') // cyan 400
    })

    // The mode is a real parameter, not decoration: the caller passes
    // `useSurfaceMode()` so the fill follows the theme (VW-316). These three roles
    // happen to be mode-invariant today, which is why no rendered colour moved.
    it('resolves through the requested mode', () => {
      for (const tone of ['ahead', 'behind', 'neutral'] as const) {
        expect(paceToneColor(tone, 'light')).toBe(paceToneColor(tone, 'dark'))
      }
    })
  })
})
