import { describe, it, expect } from 'vitest'
import { generateTokensCss } from './tokens-css'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'
import { depthCSSVars } from './depth-css-vars'

describe('generateTokensCss', () => {
  const css = generateTokensCss()

  it('emits a default :root block and a .light override block', () => {
    expect(css).toContain(':root {')
    expect(css).toContain('.light, :root.light {')
  })

  it('emits every dark token in :root with its exact value', () => {
    for (const [name, value] of Object.entries(darkThemeCSSVars)) {
      expect(css).toContain(`  ${name}: ${value};`)
    }
  })

  it('emits every light token with its exact value', () => {
    for (const [name, value] of Object.entries(lightThemeCSSVars)) {
      expect(css).toContain(`  ${name}: ${value};`)
    }
  })

  it('emits the depth and material vars in both blocks', () => {
    const [root, light] = css.split('.light, :root.light {')
    for (const [name, value] of Object.entries(depthCSSVars('dark'))) {
      expect(root).toContain(`  ${name}: ${value};`)
    }
    for (const [name, value] of Object.entries(depthCSSVars('light'))) {
      expect(light).toContain(`  ${name}: ${value};`)
    }
  })

  it('is deterministic across invocations', () => {
    expect(generateTokensCss()).toBe(css)
  })
})
