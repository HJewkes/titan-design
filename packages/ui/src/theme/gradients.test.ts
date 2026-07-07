import { describe, it, expect } from 'vitest'
import { linearGradient, surfaceGradient } from './gradients'

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
})
