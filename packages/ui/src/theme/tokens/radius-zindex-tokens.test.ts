import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { primitiveBorderRadius, primitiveZIndex } from './primitives'

/**
 * Drift guard for radius and z-index. `tailwind.config.js` is CJS and cannot import the
 * TypeScript primitives, so it keeps its own literals; this test fails when either side moves.
 */

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const extend = require(path.join(packageRoot, 'tailwind.config.js')).theme.extend

describe('tailwind.config.js matches the primitives', () => {
  it('extends borderRadius with exactly primitiveBorderRadius', () => {
    expect(extend.borderRadius).toEqual(primitiveBorderRadius)
  })

  it('extends zIndex with exactly primitiveZIndex', () => {
    expect(extend.zIndex).toEqual(primitiveZIndex)
  })
})

describe('borderRadius 2xl', () => {
  const px = (value: string) => Number(value.replace(/px$/, ''))

  it('is a 24px value, so it renders the same on web and native', () => {
    expect(extend.borderRadius['2xl']).toMatch(/^\d+px$/)
    expect(px(extend.borderRadius['2xl'])).toBe(24)
  })

  it('is larger than xl', () => {
    expect(px(extend.borderRadius['2xl'])).toBeGreaterThan(px(extend.borderRadius.xl))
  })
})
