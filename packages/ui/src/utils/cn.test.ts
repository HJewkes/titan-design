import { describe, it, expect } from 'vitest'
import { cn } from './cn'
import { spacingCSSVars } from '../theme/tokens/spacing-vars'

describe('cn', () => {
  it('collapses a plain Tailwind conflict, last one winning', () => {
    expect(cn('p-4 bg-red-500', 'bg-blue-500')).toBe('p-4 bg-blue-500')
  })

  it('keeps unrelated classes', () => {
    expect(cn('flex-row', 'items-center')).toBe('flex-row items-center')
  })
})

/**
 * The semantic spacing keys have to be part of the merge vocabulary (AW-142).
 *
 * A preset layers its own padding over the primitive's by passing `className`,
 * and that only works if tailwind-merge knows the two classes conflict. It
 * matches a spacing value against the configured scale, so a key it has never
 * heard of survives beside its sibling and stylesheet order decides — which is
 * how Badge rendered sm, md and lg all at 8px.
 */
describe('cn knows the semantic spacing scale', () => {
  it.each([
    ['px-squish-x-sm px-squish-x-md', 'px-squish-x-md'],
    ['py-squish-y-sm py-squish-y-lg', 'py-squish-y-lg'],
    ['p-inset-lg p-inset-sm', 'p-inset-sm'],
    ['gap-stack-sm gap-stack-xl', 'gap-stack-xl'],
    ['mt-stack-sm mt-stack-lg', 'mt-stack-lg'],
    ['h-control-sm h-control-lg', 'h-control-lg'],
    ['min-h-control-sm min-h-control-lg', 'min-h-control-lg'],
  ])('collapses %s', (input, expected) => {
    expect(cn(input)).toBe(expected)
  })

  it('collapses a semantic key against a numeric one, either order', () => {
    expect(cn('px-2 px-squish-x-md')).toBe('px-squish-x-md')
    expect(cn('px-squish-x-md px-2')).toBe('px-2')
  })

  it('leaves px and py independent', () => {
    expect(cn('px-squish-x-md py-squish-y-md')).toBe('px-squish-x-md py-squish-y-md')
  })

  it('covers every key the token module declares', () => {
    const spacingKeys = Object.keys(spacingCSSVars)
      .filter((property) => property.startsWith('--space-'))
      .map((property) => property.slice('--space-'.length))
    for (const key of spacingKeys) {
      expect(cn(`p-inset-xs p-${key}`), `p-${key} did not collapse`).toBe(`p-${key}`)
    }
  })
})
