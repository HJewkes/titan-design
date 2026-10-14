import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { motionCSSVars } from '../../../theme/tokens/motion-vars'
import { motion } from '../../../theme/tokens/semantic'
import { spring, springSettleS, type SpringOptions } from './spring'
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
  ['in', '--ease-in', 'in'],
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

const springPresets = Object.keys(MOTION.spring) as (keyof typeof MOTION.spring)[]

/** The largest value the spring reaches, sampled every millisecond until it has settled. */
function springPeak(options: SpringOptions): number {
  const settleS = springSettleS(options)
  let peak = -Infinity
  for (let t = 0; t <= settleS; t += 1e-3) peak = Math.max(peak, spring(t, options))
  return peak
}

describe('MOTION video tokens', () => {
  it.each(['emphasis', 'enter', 'hero', 'count', 'exit', 'staggerEach', 'staggerMax'] as const)(
    'video.%s is the semantic milliseconds in seconds',
    (name) => {
      expect(MOTION.video[name] * 1000).toBe(motion.video[name])
    }
  )

  it('holds the owner durations 0.5, 1.0 and 1.5 s', () => {
    expect([MOTION.video.emphasis, MOTION.video.enter, MOTION.video.hero]).toEqual([0.5, 1, 1.5])
  })

  it('exits in 0.85 of the entrance', () => {
    expect(MOTION.video.exit).toBeCloseTo(MOTION.video.enter * MOTION.video.exitScale, 12)
    expect(MOTION.video.exitScale).toBe(0.85)
  })

  it('keeps rise in px and scaleFrom as a factor', () => {
    expect([MOTION.video.rise, MOTION.video.scaleFrom]).toEqual([
      motion.video.rise,
      motion.video.scaleFrom,
    ])
  })

  it('staggers 60 ms per item while the cascade fits 0.5 s', () => {
    expect(MOTION.staggerEachS(5)).toBe(0.06)
    expect(MOTION.staggerEachS(1)).toBe(0.06)
  })

  it('shrinks the stagger of a long cascade so it totals 0.5 s', () => {
    expect(MOTION.staggerEachS(21) * 20).toBeCloseTo(0.5, 12)
  })

  it('dims context to 35% opacity, fully grey', () => {
    expect(MOTION.dim.context).toEqual({ opacity: 0.35, saturation: 0 })
  })
})

describe('MOTION spring presets', () => {
  it.each(springPresets)('%s settles within 3 s and stays settled', (name) => {
    const options = MOTION.spring[name]
    const settleS = springSettleS(options)
    expect(settleS).toBeGreaterThan(0)
    expect(settleS).toBeLessThan(3)
    for (let t = settleS; t <= settleS + 1; t += 0.01) {
      expect(Math.abs(spring(t, options) - 1)).toBeLessThanOrEqual(1e-3 + 1e-12)
    }
  })

  it.each(springPresets)('%s does not overshoot without allowOvershoot', (name) => {
    expect(springPeak(MOTION.spring[name])).toBeLessThanOrEqual(1)
    expect(springPeak(MOTION.springPreset(name))).toBeLessThanOrEqual(1)
  })

  it('bouncy overshoots only with allowOvershoot, and settles', () => {
    const payoff = MOTION.springPreset('bouncy', { allowOvershoot: true })
    expect(springPeak(payoff)).toBeGreaterThan(1.1)
    expect(springSettleS(payoff)).toBeLessThan(3)
  })

  it.each(springPresets.filter((name) => name !== 'bouncy'))(
    '%s keeps its own shape when allowOvershoot is set',
    (name) => {
      expect(MOTION.springPreset(name, { allowOvershoot: true })).toEqual(MOTION.spring[name])
    }
  )
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
