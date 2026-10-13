import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { motionCSSVars } from '../../../theme/tokens/motion-vars'
import { MOTION } from './tokens'

const require = createRequire(import.meta.url)
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const css = readFileSync(path.join(packageRoot, 'src/theme/global.css'), 'utf8')
const tailwindTheme = require(path.join(packageRoot, 'tailwind.config.js')).theme.extend as {
  transitionTimingFunction: Record<string, string>
  transitionDuration: Record<string, string>
}

/** Every declaration of `name` in global.css: one per theme block. */
function declaredValues(name: string): string[] {
  return [...css.matchAll(new RegExp(`^\\s*${name}:\\s*(.+?);\\s*$`, 'gm'))].map((m) => m[1] ?? '')
}

/** y at x = `x` on the CSS curve, by dense sampling of its parameter: independent of the solver. */
function sampledCubicBezier([x1, y1, x2, y2]: number[], x: number): number {
  const at = (s: number, a: number, b: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3
  let best = 0
  for (let i = 1; i <= 100_000; i++) {
    const s = i / 100_000
    if (Math.abs(at(s, x1, x2) - x) < Math.abs(at(best, x1, x2) - x)) best = s
  }
  return at(best, y1, y2)
}

const curves = [
  ['out', '--ease-out', 'out'],
  ['inOut', '--ease-in-out', 'in-out'],
  ['spring', '--ease-spring', 'spring'],
] as const

const durations = [
  ['fast', '--duration-fast'],
  ['normal', '--duration-normal'],
  ['slow', '--duration-slow'],
] as const

describe('MOTION tokens', () => {
  it.each(curves)('ease.%s evaluates %s', (name, variable) => {
    const points = /cubic-bezier\((.+)\)/.exec(motionCSSVars[variable])?.[1]?.split(',').map(Number)
    expect(points).toHaveLength(4)
    for (const x of [0.1, 0.5, 0.9]) {
      expect(MOTION.ease[name](x)).toBeCloseTo(sampledCubicBezier(points as number[], x), 3)
    }
  })

  it('ease.out(0.5) is cubic-bezier(0.22, 1, 0.36, 1) sampled at 0.5, within 1e-3', () => {
    const expected = sampledCubicBezier([0.22, 1, 0.36, 1], 0.5)
    expect(Math.abs(MOTION.ease.out(0.5) - expected)).toBeLessThan(1e-3)
  })

  it.each(durations)('duration.%s is %s in seconds', (name, variable) => {
    expect(`${Math.round(MOTION.duration[name] * 1000)}ms`).toBe(motionCSSVars[variable])
  })
})

describe('motion CSS variables', () => {
  it.each([...curves.map(([, v]) => v), ...durations.map(([, v]) => v)])(
    '%s in both global.css theme blocks is the derived value',
    (variable) => {
      expect(declaredValues(variable)).toEqual([motionCSSVars[variable], motionCSSVars[variable]])
    }
  )

  it.each(curves)('Tailwind ease %s holds the same curve as %s', (_, variable, key) => {
    expect(tailwindTheme.transitionTimingFunction[key]).toBe(motionCSSVars[variable])
  })

  it.each(durations)('Tailwind duration-%s holds the same value as %s', (name, variable) => {
    expect(tailwindTheme.transitionDuration[name]).toBe(motionCSSVars[variable])
  })
})
