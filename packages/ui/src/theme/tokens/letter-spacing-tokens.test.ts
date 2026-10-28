import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import resolveConfig from 'tailwindcss/resolveConfig'
import { primitiveTypography } from './primitives'

/**
 * Drift guard for letter spacing (TD-7). `tailwind.config.js` is CJS and cannot import the
 * TypeScript primitives, so it keeps its own literals. Tailwind's default scale happens to equal
 * the primitives, so the resolved values alone would pass with the config block deleted; the raw
 * `extend` check is what fails then.
 */

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const config = require(path.join(packageRoot, 'tailwind.config.js'))
const resolved = resolveConfig(config).theme.letterSpacing as Record<string, string>

describe('tailwind letterSpacing', () => {
  it('extends letterSpacing with exactly primitiveTypography.letterSpacing', () => {
    expect(config.theme.extend.letterSpacing).toEqual(primitiveTypography.letterSpacing)
  })

  it('resolves every tracking-* step to the primitive', () => {
    for (const [step, value] of Object.entries(primitiveTypography.letterSpacing)) {
      expect(resolved[step], `tracking-${step}`).toBe(value)
    }
  })
})
