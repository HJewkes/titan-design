import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import resolveConfig from 'tailwindcss/resolveConfig'
import { primitiveTypography } from './primitives'

/**
 * Drift guard for letter spacing (TD-7). `tailwind.config.js` is CJS and cannot import the
 * TypeScript primitives, so it keeps its own literals; this test fails when either side moves,
 * or when the config stops extending the scale and `tracking-*` falls back to Tailwind's defaults.
 */

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const config = require(path.join(packageRoot, 'tailwind.config.js'))
const resolved = resolveConfig(config).theme.letterSpacing as Record<string, string>

describe('tailwind letterSpacing', () => {
  it('resolves every tracking-* step to primitiveTypography.letterSpacing', () => {
    for (const [step, value] of Object.entries(primitiveTypography.letterSpacing)) {
      expect(resolved[step], `tracking-${step}`).toBe(value)
    }
  })

  it('resolves tracking-widest to 0.5px, not the 0.1em Tailwind default', () => {
    expect(resolved.widest).toBe('0.5px')
  })
})
