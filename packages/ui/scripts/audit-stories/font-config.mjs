// titan's mono family, read from the tree's tailwind.config.js the way spacing-scale.mjs reads
// spacing. A `var(--font-family-*)` entry is resolved through src/theme/global.css.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/** The test for "is this family mono" when the config names no family. */
export const MONO_FALLBACK = /mono/i

export function loadFontConfig(uiDir) {
  const config = createRequire(`${uiDir}/x.js`)(`${uiDir}/tailwind.config.js`)
  const css = readFileSync(join(uiDir, 'src/theme/global.css'), 'utf8')
  return parseFontConfig(config, css)
}

/** The first family in a CSS `font-family` list, unquoted. */
export const firstFamily = (list) =>
  String(list ?? '')
    .split(',')[0]
    .trim()
    .replace(/^['"]|['"]$/g, '')

// The first value the stylesheet declares for a custom property; both themes share font families.
const cssVarValue = (css, name) =>
  css.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+);`))?.[1]

/** `{ mono }`: the first mono family name, or null when the config does not resolve to one. */
export function parseFontConfig(config, css = '') {
  const entries = [config.theme?.extend?.fontFamily?.mono, config.theme?.fontFamily?.mono].find(
    Boolean
  )
  const first = Array.isArray(entries) ? entries[0] : entries
  const varName = String(first ?? '').match(/^var\((--[\w-]+)\)$/)?.[1]
  const family = firstFamily(varName ? cssVarValue(css, varName) : first)
  return { mono: family || null }
}

/** True when `family` is the configured mono face, or looks like a mono one when none is set. */
export const isMono = (family, fonts) =>
  fonts?.mono ? family === fonts.mono : MONO_FALLBACK.test(family ?? '')
