import { createRequire } from 'node:module'

type Step = { key: string; px: number; spaceKeys: string[] }
type Options = {
  nearestSpacing: (px: number) => { below?: Step; above?: Step }
  fontSizes: string[]
  typographyVariants: string[]
}
type SpacingOptions = {
  spacingAdvice: (px: number) => string
  nearestClasses: (prop: string, px: number) => string[]
  typeOptions: string
}

const spacingOptions = createRequire(import.meta.url)('../../eslint-rules/spacing-options') as {
  fromOptions: (options: Options) => SpacingOptions
} & SpacingOptions

const steps: Step[] = [
  { key: '0', px: 0, spaceKeys: [] },
  { key: '1', px: 4, spaceKeys: ['space.alpha.one'] },
  { key: '2', px: 8, spaceKeys: ['space.beta.two', 'space.gamma.two'] },
  { key: '3', px: 12, spaceKeys: [] },
]
const nearestSpacing = (px: number) => ({
  below: [...steps].reverse().find((step) => step.px <= px),
  above: steps.find((step) => step.px >= px),
})
const fixture = spacingOptions.fromOptions({
  nearestSpacing,
  fontSizes: ['tiny', 'huge'],
  typographyVariants: ['quux', 'corge'],
})

describe('spacing-options: derived from fix-options, not hand-kept', () => {
  it('names the step either side and the space keys equal to each', () => {
    expect(fixture.spacingAdvice(6)).toBe(
      'use 4 (`space.alpha.one`) or 8 (`space.beta.two`, `space.gamma.two`)'
    )
  })

  it('names a step with no space key by its number alone', () => {
    expect(fixture.spacingAdvice(10)).toBe('use 8 (`space.beta.two`, `space.gamma.two`) or 12')
  })

  it('names a value on a step once', () => {
    expect(fixture.spacingAdvice(8)).toBe('use 8 (`space.beta.two`, `space.gamma.two`)')
  })

  it('names only the smallest step below it, never zero', () => {
    expect(fixture.spacingAdvice(1)).toBe('use 4 (`space.alpha.one`)')
  })

  it('names only the largest step above it', () => {
    expect(fixture.spacingAdvice(99)).toBe('use 12')
  })

  it('treats a negative value as its positive twin', () => {
    expect(fixture.spacingAdvice(-6)).toBe(fixture.spacingAdvice(6))
  })

  it('names the classes either side of an arbitrary value', () => {
    expect(fixture.nearestClasses('gap', 6)).toEqual(['gap-1', 'gap-2'])
  })

  it('names one class for a value on a step, one below the smallest, one above the largest', () => {
    expect(fixture.nearestClasses('p', 8)).toEqual(['p-2'])
    expect(fixture.nearestClasses('p', 1)).toEqual(['p-1'])
    expect(fixture.nearestClasses('p', 99)).toEqual(['p-3'])
  })

  it('lists every variant and every font-size key it is given, uncapped', () => {
    expect(fixture.typeOptions).toBe(
      'a Typography variant (`variant="quux"`, `variant="corge"`) or a font-size class (`text-tiny`, `text-huge`)'
    )
    const many = spacingOptions.fromOptions({
      nearestSpacing,
      fontSizes: [],
      typographyVariants: Array.from({ length: 12 }, (_, i) => `v${i}`),
    })
    expect(many.typeOptions).toContain('`variant="v11"`')
  })
})
