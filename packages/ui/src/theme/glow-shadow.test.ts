import { describe, expect, it } from 'vitest'
import { depthCSSVars } from './depth-css-vars'
import { getGlowShadow } from './elevation'
import type { GlowIntensity } from './elevation-planes'

// Recorded from both glow writers before they shared one function (TD-561). A change here
// changes every glow on screen and in tokens.css.
const RECORDED: Record<GlowIntensity, [blurSpread: string, opacity: string]> = {
  tight: ['0 0 4px 0px', '0.4'],
  subtle: ['0 0 12px 0px', '0.25'],
  medium: ['0 0 20px 2px', '0.4'],
  strong: ['0 0 30px 4px', '0.55'],
}
const INTENSITIES = Object.keys(RECORDED) as GlowIntensity[]
const TOKEN_RGB = 'var(--glow-rgb, var(--color-brand-primary-rgb))'

describe('glow shadows match the recorded strings', () => {
  it.each(INTENSITIES)('getGlowShadow paints the %s glow', (intensity) => {
    const [geometry, opacity] = RECORDED[intensity]
    expect(getGlowShadow('#FF7900', intensity)).toEqual({
      boxShadow: `${geometry} rgba(255, 121, 0, ${opacity})`,
    })
  })

  it.each(INTENSITIES)('tokens.css declares the %s glow in both modes', (intensity) => {
    const [geometry, opacity] = RECORDED[intensity]
    const expected = `${geometry} rgba(${TOKEN_RGB}, ${opacity})`
    expect(depthCSSVars('dark')[`--glow-${intensity}`]).toBe(expected)
    expect(depthCSSVars('light')[`--glow-${intensity}`]).toBe(expected)
  })
})
