import { describe, it, expect } from 'vitest'
import { depthCSSVars } from './depth-css-vars'
import { darkThemeCSSVars } from './config'
import { liftShadow } from './lift-shadow'
import { getElevationSurface } from './elevation'
import { getSemanticColors } from './tokens/semantic'
import { grainForTone, insetWell, paperSheet } from './materials'

describe('depthCSSVars', () => {
  const dark = depthCSSVars('dark')

  it('aliases every elevation surface to a theme token that exists', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const alias = /^var\((--[\w-]+)\)$/.exec(dark[`--elevation-${level}-surface`])?.[1]
      expect(alias && darkThemeCSSVars[alias]).toBe(getElevationSurface(level, 'dark'))
    }
  })

  it('carries the lift shadow the style helpers produce, per mode', () => {
    for (const step of [1, 2, 3, 4, 5] as const) {
      expect(dark[`--lift-${step}`]).toBe(liftShadow(step, 'dark'))
      expect(depthCSSVars('light')[`--lift-${step}`]).toBe(liftShadow(step, 'light'))
    }
  })

  it('gives content lifts a shadow, not only floating ones', () => {
    expect(dark['--lift-1']).toContain('rgba(0,0,0,')
  })

  it('grains the paper for the raised tone of the active mode', () => {
    const lightRaised = getSemanticColors('light')['surface-raised']
    expect(depthCSSVars('light')['--material-paper-grain']).toBe(grainForTone(lightRaised))
  })

  it('carries the material shadows the style helpers produce', () => {
    expect(dark['--material-paper-shadow']).toBe((paperSheet() as { boxShadow: string }).boxShadow)
    expect(dark['--material-inset-shadow']).toBe((insetWell() as { boxShadow: string }).boxShadow)
  })

  it('lets a caller retint a glow through --glow-rgb', () => {
    expect(dark['--glow-medium']).toBe(
      '0 0 20px 2px rgba(var(--glow-rgb, var(--color-brand-primary-rgb)), 0.4)'
    )
  })
})
