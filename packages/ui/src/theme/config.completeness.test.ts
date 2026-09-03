import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { darkThemeCSSVars, lightThemeCSSVars } from './config'

/**
 * Drift guard for the token codegen source (TD-05.08).
 *
 * `config.ts` (darkThemeCSSVars / lightThemeCSSVars) is the source that
 * `tokens-css.ts` renders into `dist/tokens.css`. It must stay a complete,
 * value-accurate mirror of the `:root` / `.light` custom properties in
 * `global.css`; otherwise the generated stylesheet silently drifts from the
 * design system (the exact gap this ticket closed). This test fails if
 * global.css gains a `:root` var that config.ts does not cover, or if any
 * shared var's value diverges.
 */

const themeDir = path.dirname(fileURLToPath(import.meta.url))
const css = readFileSync(path.join(themeDir, 'global.css'), 'utf8')

/**
 * global.css :root vars intentionally excluded from the codegen source.
 * Empty today — every :root var is mirrored. Add a var here (with a reason)
 * only if it is genuinely prototype-irrelevant, rather than silently skipping.
 */
const CODEGEN_ALLOWLIST = new Set<string>([])

function parseVarBlock(header: RegExp): Map<string, string> {
  const match = css.match(header)
  if (!match) throw new Error(`could not locate CSS block for ${header}`)
  const vars = new Map<string, string>()
  for (const line of match[1].split('\n')) {
    const declaration = line.match(/^\s*(--[a-z0-9-]+):\s*(.+?);\s*$/i)
    if (declaration) vars.set(declaration[1], declaration[2].trim())
  }
  return vars
}

const globalDark = parseVarBlock(/:root\s*\{([\s\S]*?)\n\s*\}/)
const globalLight = parseVarBlock(/\.light,\s*\n?\s*:root\.light\s*\{([\s\S]*?)\n\s*\}/)

const cases = [
  ['dark', globalDark, darkThemeCSSVars as Record<string, string>],
  ['light', globalLight, lightThemeCSSVars as Record<string, string>],
] as const

describe('token codegen completeness (config.ts vs global.css)', () => {
  it('parses both global.css theme blocks', () => {
    expect(globalDark.size).toBeGreaterThan(90)
    expect(globalLight.size).toBe(globalDark.size)
  })

  for (const [mode, globalVars, cfg] of cases) {
    it(`${mode}: config covers every global.css :root var with the exact value`, () => {
      const missing: string[] = []
      const mismatched: string[] = []
      for (const [name, value] of globalVars) {
        if (CODEGEN_ALLOWLIST.has(name)) continue
        if (!(name in cfg)) {
          missing.push(name)
        } else if (cfg[name] !== value) {
          mismatched.push(`${name}: global='${value}' config='${cfg[name]}'`)
        }
      }
      expect(missing, 'global.css vars missing from config.ts codegen source').toEqual([])
      expect(mismatched, 'value drift between config.ts and global.css').toEqual([])
    })

    it(`${mode}: config emits no var absent from global.css`, () => {
      const extra = Object.keys(cfg).filter(
        (name) => !globalVars.has(name) && !CODEGEN_ALLOWLIST.has(name)
      )
      expect(extra, 'config.ts vars not present in global.css :root').toEqual([])
    })
  }
})
