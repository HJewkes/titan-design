import { describe, expect, it } from 'vitest'
import { compileClasses, compileCss } from './tailwind-compile'

describe('compileCss', () => {
  it('keeps the @media params and escaped selector of a breakpoint utility', async () => {
    const css = await compileCss(['sm:p-gutter-md'])

    expect(css).toContain('@media (min-width:')
    expect(css).toContain('.sm\\:p-gutter-md')
  })

  it('emits no utility rule for an empty class list', async () => {
    const css = await compileCss([])

    expect(css).not.toMatch(/^\s*\.[^\s{]+\s*\{/m)
  })
})

describe('compileClasses', () => {
  it('returns only the classes the config emits a rule for', async () => {
    const result = await compileClasses(['p-4', 'not-a-real-class-xyz', 'flex'])

    expect([...result].sort()).toEqual(['flex', 'p-4'])
  })
})
